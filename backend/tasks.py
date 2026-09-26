import io
import csv
from datetime import datetime
import logging
from celery import shared_task
from flask_mail import Message
from backend.app import create_app, mail
from backend.models import User, Reservation, ParkingSpot, ParkingLot

logger = logging.getLogger(__name__)

@shared_task(bind=True)
def generate_admin_csv_export(self, admin_user_id):
    
    app = create_app()
    with app.app_context():
        admin = User.query.get(admin_user_id)
        if not admin:
            logger.error(f"Admin user with ID {admin_user_id} not found.")
            return

        try:
            query_result = (
                Reservation.query
                .outerjoin(User, Reservation.user_id == User.id)
                .outerjoin(ParkingSpot, Reservation.spot_id == ParkingSpot.id)
                .outerjoin(ParkingLot, ParkingSpot.lot_id == ParkingLot.id)
                .add_entity(User)
                .add_entity(ParkingSpot)
                .add_entity(ParkingLot)
                .order_by(Reservation.id.desc())
                .all()
            )

            output = io.StringIO()
            writer = csv.writer(output)

            
            writer.writerow([
                'reservation_id', 'user_id', 'user_email', 'lot_id', 'lot_location_name',
                'spot_number', 'reservation_start_time', 'reservation_end_time',
                'reservation_status', 'total_cost', 'remarks'
            ])

            for reservation, user, spot, lot in query_result:
                
                start_time = reservation.parking_timestamp.isoformat() if reservation.parking_timestamp else ''
                end_time = reservation.leaving_timestamp.isoformat() if reservation.leaving_timestamp else ''

                writer.writerow([
                    reservation.id,
                    user.id if user else 'N/A',
                    user.email if user else 'N/A',
                    lot.id if lot else 'N/A',
                    lot.prime_location_name if lot else 'N/A',
                    spot.spot_number if spot else 'N/A',
                    start_time,
                    end_time,
                    reservation.status, 
                    reservation.parking_cost or 0.0,
                    getattr(reservation, "remarks", "")
                ])

            output.seek(0)
            filename = f"parking_export_{datetime.utcnow().strftime('%Y%m%d')}.csv"

            msg = Message(
                subject="All Parking Reservations CSV Export",
                recipients=[admin.email],
                body=f"Attached is the parking history export, generated on {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}.",
            )
            msg.attach(filename, "text/csv", output.read())
            mail.send(msg)

            logger.info(f"Successfully sent reservation export to {admin.email}")
            return f"Export sent to {admin.email}"

        except Exception as e:
           
            logger.error(f"Failed to generate CSV for admin {admin_user_id}: {e}", exc_info=True)
           
            self.retry(exc=e, countdown=60)