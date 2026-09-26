from flask import Blueprint, request, jsonify, current_app, g, send_file
from backend.models import db, User, ParkingLot, ParkingSpot, Reservation
from functools import wraps
from datetime import datetime, timedelta
import jwt
import io
import csv

user_bp = Blueprint('user_bp', __name__, url_prefix='/api')

def jwt_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.headers.get('Authorization', None)
        if not auth or not auth.startswith('Bearer '):
            return jsonify({'message': 'Authorization token is missing or malformed'}), 401
        
        token = auth.split(' ')[1]
        try:
            payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            user = User.query.get(payload['user_id'])
            if not user:
                return jsonify({'message': 'User associated with token not found'}), 401
            
            g.current_user = user
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token, please log in again'}), 401
        except Exception as e:
            current_app.logger.exception("JWT processing error:")
            return jsonify({'message': 'Authentication failed due to an internal error.'}), 500
        return f(*args, **kwargs)
    return decorated


@user_bp.route('/my-profile', methods=['GET'])
@jwt_required
def my_profile():
    user = g.current_user
    return jsonify({
        "id": user.id,
        "email": user.email,
    }), 200


@user_bp.route('/my-profile-stats', methods=['GET'])
@jwt_required
def my_profile_stats():
    user = g.current_user
    reservations = user.reservations.all()
    total_spent = sum(r.parking_cost or 0 for r in reservations if r.parking_cost is not None)
    active_res_exists = any(r.leaving_timestamp is None for r in reservations)
    return jsonify({
        "total_reservations": len(reservations),
        "active_reservation": active_res_exists,
        "total_spent": round(float(total_spent), 2)
    }), 200


@user_bp.route('/lots', methods=['GET'])
@jwt_required
def search_or_list_lots():
    query = request.args.get('query', '').strip()
    lots_query = ParkingLot.query

    if query:
        search_pattern = f'%{query}%'
        lots_query = lots_query.filter(
            (ParkingLot.prime_location_name.ilike(search_pattern)) |
            (ParkingLot.address.ilike(search_pattern)) |
            (ParkingLot.pin_code.ilike(search_pattern))
        )

    lots = lots_query.all()
    result = [{
        "id": lot.id,
        "prime_location_name": lot.prime_location_name,
        "address": lot.address,
        "pin_code": lot.pin_code,
        "price": round(float(lot.price), 2),
        "number_of_spots": lot.number_of_spots,
        "available_spots": lot.available_spots,
        "occupied_spots": lot.occupied_spots,
    } for lot in lots]

    return jsonify(result), 200


@user_bp.route('/lots/<string:lot_id>/available-spots', methods=['GET'])
@jwt_required
def available_spots(lot_id):
    lot = ParkingLot.query.get_or_404(lot_id)
    spots = ParkingSpot.query.filter_by(lot_id=lot.id, status='A').order_by(ParkingSpot.spot_number.asc()).all()
    return jsonify([spot.spot_number for spot in spots]), 200


@user_bp.route('/reserve', methods=['POST'])
@jwt_required
def reserve():
    data = request.get_json()
    lot_id = data.get('lot_id')

    if not lot_id:
        return jsonify({'error': 'Missing lot_id'}), 400

    lot = ParkingLot.query.get(lot_id)
    if not lot:
        return jsonify({'error': 'Parking lot not found'}), 404

    existing_reservation = Reservation.query.filter_by(user_id=g.current_user.id, leaving_timestamp=None).first()
    if existing_reservation:
        return jsonify({'error': 'You already have an active reservation! Please release it first.'}), 400

    spot = ParkingSpot.query.filter_by(lot_id=lot.id, status='A').order_by(ParkingSpot.spot_number.asc()).first()
    if not spot:
        return jsonify({'error': 'No available spots in this lot.'}), 400

    try:
        spot.status = 'O'
        reservation = Reservation(
            spot_id=spot.id,
            user_id=g.current_user.id,
            parking_timestamp=datetime.utcnow(),
            parking_cost=lot.price  
        )
        db.session.add(reservation)
        db.session.commit()

        return jsonify({
            'message': 'Spot reserved successfully!',
            'reservation_id': reservation.id,
            'spot_number': spot.spot_number,
            'lot_name': lot.prime_location_name,
            'parking_timestamp': reservation.parking_timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            'price': round(float(reservation.parking_cost), 2)
        }), 200
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Error during reservation")
        return jsonify({'error': 'An unexpected error occurred during reservation.'}), 500


@user_bp.route('/my-reservation', methods=['GET'])
@jwt_required
def my_reservation():
    reservation = Reservation.query.filter_by(user_id=g.current_user.id, leaving_timestamp=None).first()
    if not reservation:
        return jsonify({}), 204

    lot_name = reservation.spot.lot.prime_location_name if reservation.spot and reservation.spot.lot else "Unknown Lot"
    spot_number = reservation.spot.spot_number if reservation.spot else None

    return jsonify({
        'id': reservation.id,
        'spot_number': spot_number,
        'lot_name': lot_name,
        'parking_timestamp': reservation.parking_timestamp.strftime('%Y-%m-%d %H:%M:%S'),
        'base_price': round(float(reservation.parking_cost), 2)
    }), 200


@user_bp.route('/my-reservations', methods=['GET'])
@jwt_required
def my_reservations():
    reservations = Reservation.query.filter_by(user_id=g.current_user.id)\
        .order_by(Reservation.parking_timestamp.desc()).all()

    result = []
    for r in reservations:
        lot_name = r.spot.lot.prime_location_name if r.spot and r.spot.lot else "Unknown Lot"
        spot_number = r.spot.spot_number if r.spot else None
        result.append({
            'id': r.id,
            'spot_number': spot_number,
            'lot_name': lot_name,
            'parking_timestamp': r.parking_timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            'leaving_timestamp': r.leaving_timestamp.strftime('%Y-%m-%d %H:%M:%S') if r.leaving_timestamp else None,
            'price': round(float(r.parking_cost), 2),
            'status': 'Active' if r.leaving_timestamp is None else 'Parked Out'
        })
    return jsonify(result), 200


@user_bp.route('/release', methods=['POST'])
@jwt_required
def release():
    data = request.get_json()
    reservation_id = data.get('reservation_id')

    if not reservation_id:
        return jsonify({'error': 'Missing reservation_id'}), 400

    reservation = Reservation.query.get(reservation_id)
    if not reservation:
        return jsonify({'error': 'Reservation not found'}), 404
    if reservation.user_id != g.current_user.id:
        return jsonify({'error': 'Unauthorized to release this reservation'}), 403
    if reservation.leaving_timestamp:
        return jsonify({'error': 'Spot already released'}), 400

    try:
        now = datetime.utcnow()
        reservation.leaving_timestamp = now

        start_time = reservation.parking_timestamp
        base_price = reservation.parking_cost or 0.0
        elapsed_minutes = int((now - start_time).total_seconds() / 60)

        
        if elapsed_minutes <= 1:
            total_price = base_price
        else:
            total_price = base_price + (elapsed_minutes - 1) * 1.0

        reservation.parking_cost = total_price

        if reservation.spot:
            reservation.spot.status = 'A'

        db.session.commit()
        current_app.logger.info(
            f"Spot released successfully for reservation {reservation.id}, total: ₹{total_price:.2f}"
        )
        return jsonify({
            'message': 'Spot released successfully!',
            'total_price': round(float(total_price), 2)
        }), 200

    except Exception:
        db.session.rollback()
        current_app.logger.exception("Error releasing spot:")
        return jsonify({'error': 'An unexpected error occurred during spot release.'}), 500


@user_bp.route('/my-summary', methods=['GET'])
@jwt_required
def my_summary():
    try:
        user = g.current_user
        reservations = user.reservations.order_by(Reservation.parking_timestamp.desc()).all()

        total_spent = sum(r.parking_cost or 0 for r in reservations if r.parking_cost is not None)
        active_res = next((r for r in reservations if r.leaving_timestamp is None), None)

        recent_reservations_data = []
        for r in reservations[:7]:
            lot_name = r.spot.lot.prime_location_name if r.spot and r.spot.lot else "Unknown Lot"
            recent_reservations_data.append({
                "id": r.id,
                "lotName": lot_name,
                "spotId": r.spot_id,
                "start": r.parking_timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                "end": r.leaving_timestamp.strftime('%Y-%m-%d %H:%M:%S') if r.leaving_timestamp else "",
                "status": "active" if r.leaving_timestamp is None else "completed"
            })

        trend_map = {}
        now_utc = datetime.utcnow()
        for i in range(6, -1, -1):
            date_key = (now_utc - timedelta(days=i)).strftime('%b %d')
            trend_map[date_key] = 0
        for r in reservations:
            if r.parking_timestamp:
                key = r.parking_timestamp.strftime('%b %d')
                if key in trend_map:
                    trend_map[key] += 1

        trend_data = [{"date": k, "count": v} for k, v in trend_map.items()]

        active_res_data = None
        if active_res:
            lot_name = active_res.spot.lot.prime_location_name if active_res.spot and active_res.spot.lot else "Unknown Lot"
            active_res_data = {
                "id": active_res.id,
                "lotName": lot_name,
                "spotId": active_res.spot_id,
                "start": active_res.parking_timestamp.strftime('%Y-%m-%d %H:%M:%S')
            }

        return jsonify({
            "stats": {
                "total_reservations": len(reservations),
                "active_reservation": bool(active_res),
                "total_spent": round(float(total_spent), 2),
            },
            "recentReservations": recent_reservations_data,
            "activeReservation": active_res_data,
            "trend": trend_data,
            "alerts": [],
        }), 200

    except Exception:
        current_app.logger.exception("Error in my_summary endpoint:")
        return jsonify({'error': 'Failed to load summary.'}), 500

@user_bp.route('/export-csv', methods=['GET'])
@jwt_required
def export_csv():
    user = g.current_user
    reservations = user.reservations.order_by(Reservation.parking_timestamp.asc()).all()

    si = io.StringIO()
    fieldnames = [
        'Reservation ID', 'Spot ID', 'Spot Number', 'Parking Lot',
        'Parking Timestamp', 'Leaving Timestamp', 'Cost (INR)', 'Status'
    ]
    writer = csv.DictWriter(si, fieldnames=fieldnames)
    writer.writeheader()

    for r in reservations:
        lot_name = r.spot.lot.prime_location_name if r.spot and r.spot.lot else "Unknown Lot"
        spot_number = r.spot.spot_number if r.spot else "N/A"
        writer.writerow({
            'Reservation ID': r.id,
            'Spot ID': r.spot_id,
            'Spot Number': spot_number,
            'Parking Lot': lot_name,
            'Parking Timestamp': r.parking_timestamp.strftime('%Y-%m-%d %H:%M:%S') if r.parking_timestamp else '',
            'Leaving Timestamp': r.leaving_timestamp.strftime('%Y-%m-%d %H:%M:%S') if r.leaving_timestamp else 'Active',
            'Cost (INR)': round(float(r.parking_cost), 2) if r.parking_cost is not None else 0.0,
            'Status': 'Active' if r.leaving_timestamp is None else 'Completed'
        })

    si.seek(0)
    return send_file(
        io.BytesIO(si.getvalue().encode('utf-8')),
        mimetype='text/csv',
        as_attachment=True,
        download_name=f'parking_reservations_{user.id}_{datetime.now().strftime("%Y%m%d%H%M%S")}.csv'
    ), 200
