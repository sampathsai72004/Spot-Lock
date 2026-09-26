from backend.celery_worker import celery_app
from flask import render_template
from flask_mail import Message
from datetime import datetime, timedelta
from sqlalchemy import func
from backend.models.models import db, User, Reservation, ParkingLot, ParkingSpot
from backend.app import app, mail

def send_email(to, subject, html_content):
    with app.app_context():
        msg = Message(subject=subject, recipients=[to], html=html_content)
        mail.send(msg)

@celery_app.task
def send_monthly_report(user_id, year, month):
    with app.app_context():
        user = User.query.get(user_id)
        if not user:
            return

        start = datetime(year, month, 1)
        end = datetime(year + 1, 1, 1) if month == 12 else datetime(year, month + 1, 1)

        reservations = Reservation.query.filter(
            Reservation.user_id == user.id,
            Reservation.parking_timestamp >= start,
            Reservation.parking_timestamp < end
        ).all()

        total_booked = len(reservations)
        amount_spent = sum(r.parking_cost or 0 for r in reservations)

        lot_usage = (
            db.session.query(
                ParkingLot.prime_location_name,
                func.count(Reservation.id).label('usage_count')
            )
            .join(ParkingSpot, ParkingSpot.id == Reservation.spot_id)
            .join(ParkingLot, ParkingLot.id == ParkingSpot.lot_id)
            .filter(
                Reservation.user_id == user.id,
                Reservation.parking_timestamp >= start,
                Reservation.parking_timestamp < end
            )
            .group_by(ParkingLot.prime_location_name)
            .order_by(func.count(Reservation.id).desc())
            .first()
        )

        most_used_lot = lot_usage[0] if lot_usage else "N/A"

        html = render_template(
            "email_monthly_report.html",
            user=user,
            total_booked=total_booked,
            amount_spent=amount_spent,
            most_used_lot=most_used_lot,
            report_month=start.strftime("%B %Y"),
            reservations=reservations
        )

        send_email(
            to=user.email,
            subject=f"Your Monthly Parking Activity Report - {start.strftime('%B %Y')}",
            html_content=html
        )

        print(f"Sent report to {user.email} for {start.strftime('%B %Y')}")


@celery_app.task
def schedule_all_reports():
    with app.app_context():
        now = datetime.utcnow()
        year, month = (now - timedelta(days=1)).year, (now - timedelta(days=1)).month

        for user in User.query.all():
            send_monthly_report.delay(user.id, year, month)
