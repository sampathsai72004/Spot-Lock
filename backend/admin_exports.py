from celery import shared_task

@shared_task
def generate_admin_csv_export(admin_user_id):
    from backend.app import create_app
    app = create_app()
    with app.app_context():
        from backend.models import User, Reservation, ParkingSpot, ParkingLot
        from flask_mail import Mail, Message
        import io, csv
        from datetime import datetime

        mail = Mail(app)
        admin = User.query.get(admin_user_id)
        rows = (
            Reservation.query
            .join(User, Reservation.user_id == User.id)
            .join(ParkingSpot, Reservation.spot_id == ParkingSpot.id)
            .join(ParkingLot, ParkingSpot.lot_id == ParkingLot.id)
            .add_entity(User)
            .add_entity(ParkingSpot)
            .add_entity(ParkingLot)
            .all()
        )
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            'slot_id', 'spot_id', 'user_email', 'lot_name',
            'parking_time_start', 'parking_time_end', 'duration_hours', 'cost', 'remarks'
        ])
        for reservation, user, spot, lot in rows:
            start, end = reservation.parking_timestamp, reservation.leaving_timestamp
            duration = (
                round(((end or datetime.utcnow()) - start).total_seconds() / 3600, 2) if start else ""
            )
            writer.writerow([
                reservation.id,
                spot.id if spot else "",
                user.email if user else "",
                lot.prime_location_name if lot else "",
                start.strftime('%Y-%m-%d %H:%M:%S') if start else "",
                end.strftime('%Y-%m-%d %H:%M:%S') if end else "",
                duration,
                reservation.parking_cost or "",
                getattr(reservation, "remarks", ""),
            ])
        output.seek(0)
        msg = Message(
            subject="All Parking Reservations CSV Export",
            recipients=[admin.email],
            body="Attached is the parking history export for all users.",
        )
        msg.attach("parking_export_all.csv", "text/csv", output.read())
        mail.send(msg)
