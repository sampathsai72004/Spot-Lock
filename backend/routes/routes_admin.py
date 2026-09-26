from datetime import datetime, timedelta
import uuid
from flask import Blueprint, request, jsonify, g
from flask_security import auth_required
from flask_security.utils import hash_password
from flask_cors import cross_origin
from backend.models.models import Reservation, Role, User, db, ParkingLot, ParkingSpot
import traceback
from functools import wraps
import jwt
from flask import current_app
from backend.extensions import cache 
from sqlalchemy import func 


admin_bp = Blueprint('admin_bp', __name__, url_prefix='/api/admin')


def jwt_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.headers.get('Authorization', None)
        if not auth or not auth.startswith('Bearer '):
            return jsonify({'message': 'Missing or invalid token'}), 401
        token = auth.split(' ')[1]
        try:
            payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            user = User.query.get(payload['user_id'])
            if not user:
                return jsonify({'message': 'User not found'}), 401
            g.current_user = user
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token expired'}), 401
        except Exception as e:
            return jsonify({'message': f'Invalid token: {str(e)}'}), 401
        return f(*args, **kwargs)
    return decorated


@admin_bp.route('/parking-lots', methods=['GET'])
@jwt_required
def get_parking_lots():
    try:
        lots = ParkingLot.query.all()

        result = [{
            'id': lot.id,
            'prime_location_name': lot.prime_location_name,
            'address': lot.address,
            'pin_code': lot.pin_code,
            'price': lot.price,
            'number_of_spots': lot.number_of_spots,
            'available_spots': lot.available_spots,
            'occupied_spots': lot.occupied_spots
        } for lot in lots]

        return jsonify(result), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"message": "Error fetching parking lots", "error": str(e)}), 500



@admin_bp.route('/create-lot', methods=['POST'])
@jwt_required
def create_parking_lot():
    data = request.get_json()

    try:
        required_fields = ['prime_location_name', 'address', 'pin_code', 'price', 'number_of_spots']
        if not all(field in data and data[field] for field in required_fields):
            return jsonify({"message": "Missing required fields"}), 400

        num_spots = int(data['number_of_spots'])
        if num_spots <= 0:
             return jsonify({"message": "Number of spots must be positive"}), 400

        new_lot = ParkingLot(
            prime_location_name=data['prime_location_name'],
            address=data['address'],
            pin_code=data['pin_code'],
            price=float(data['price']),
            number_of_spots=num_spots
        )

        db.session.add(new_lot)
        db.session.flush()  

       
        for i in range(1, new_lot.number_of_spots + 1):
            db.session.add(ParkingSpot(lot_id=new_lot.id, status='A', spot_number=i))

        db.session.commit()

        return jsonify({"message": "Parking lot created successfully", "id": new_lot.id}), 201

    except Exception as e:
        traceback.print_exc()
        db.session.rollback()
        return jsonify({"message": "Error creating parking lot", "error": str(e)}), 500

@admin_bp.route('/delete-lot/<string:lot_id>', methods=['DELETE'])
@jwt_required
def delete_parking_lot(lot_id):
    try:
        lot = ParkingLot.query.get(lot_id)
        if not lot:
            return jsonify({"message": "Parking lot not found"}), 404

        if lot.occupied_spots > 0:
            return jsonify({"message": "Cannot delete: spots are still occupied"}), 403
        ParkingSpot.query.filter_by(lot_id=lot.id).delete()
        db.session.delete(lot)
        db.session.commit()

        
        cache.delete('admin:parking_lots')
        cache.delete('admin:summary')
        cache.delete('admin:reservations')

        return jsonify({"message": "Parking lot deleted successfully"}), 200

    except Exception as e:
        traceback.print_exc()
        db.session.rollback()
        return jsonify({"message": "Error deleting parking lot", "error": str(e)}), 500

@admin_bp.route('/summary', methods=['GET'])
@jwt_required
def admin_summary():
    try:      
        total_users = User.query.count()
        total_lots = ParkingLot.query.count()
        total_reservations = Reservation.query.count()
        total_revenue = db.session.query(db.func.coalesce(db.func.sum(Reservation.parking_cost), 0)).scalar()
        active_reservations = Reservation.query.filter_by(leaving_timestamp=None).count()
        available_spots = ParkingSpot.query.filter_by(status='A').count()
        occupied_spots = ParkingSpot.query.filter_by(status='O').count()       
        reserved_spots = active_reservations
        
        def growth(model, date_field='created_at'):
            now = datetime.utcnow()
            last_month = now - timedelta(days=30)
            total = model.query.count()
            recent = model.query.filter(
                getattr(model, date_field) >= last_month
            ).count()
            prev = model.query.filter(
                getattr(model, date_field) < last_month
            ).count()
            if prev == 0:
                return 100 if total > 0 else 0
            return round(100 * (recent / prev))
        
        userGrowth = growth(User, date_field='fs_uniquifier')  
        lotGrowth = growth(ParkingLot, date_field='created_at')
        reservationGrowth = growth(Reservation, date_field='parking_timestamp')
       
        now = datetime.utcnow()
        days_ago_30 = now - timedelta(days=30)
        days_ago_60 = now - timedelta(days=60)
        revenue_30 = db.session.query(db.func.coalesce(db.func.sum(Reservation.parking_cost), 0)).filter(
            Reservation.parking_timestamp >= days_ago_30
        ).scalar() or 0
        revenue_prev_30 = db.session.query(db.func.coalesce(db.func.sum(Reservation.parking_cost), 0)).filter(
            Reservation.parking_timestamp < days_ago_30,
            Reservation.parking_timestamp >= days_ago_60
        ).scalar() or 0
        revenueGrowth = 0
        if revenue_prev_30:
            revenueGrowth = round(100 * (revenue_30 - revenue_prev_30) / max(1, revenue_prev_30))
        elif revenue_30:
            revenueGrowth = 100
    
        last5 = Reservation.query.order_by(Reservation.parking_timestamp.desc()).limit(5).all()
        recentReservations = []
        for r in last5:
            user = r.user
            recentReservations.append({
                "id": r.id,
                "userEmail": user.email if user else "-",
                "location": (r.spot.lot.prime_location_name if r.spot and r.spot.lot else "-"),
                "spot_number": (r.spot.spot_number if r.spot else "-"), 
                "time": r.parking_timestamp.strftime('%Y-%m-%d %H:%M:%S') if r.parking_timestamp else "",
                "status": "active" if (not r.leaving_timestamp) else "completed"
            })
       
        nearly_full_lots = []
        for lot in ParkingLot.query.all():
            if lot.available_spots <= 2:
                nearly_full_lots.append(lot.prime_location_name)
        systemAlerts = []
        now_iso = datetime.utcnow().isoformat()
        for i, name in enumerate(nearly_full_lots, start=1):
           
            current_lot = ParkingLot.query.filter_by(prime_location_name=name).first()
            if current_lot:
                 systemAlerts.append({
                    "id": i,
                    "severity": "medium",
                    "title": "Lot nearly full",
                    "message": f"{name}: only {current_lot.available_spots} available spots.",
                    "timestamp": now_iso
                })

        chart_labels = []
        chart_data = []
        today = datetime.utcnow().date()
        for i in range(6, -1, -1):
            d = today - timedelta(days=i)
            label = d.strftime('%a')
            chart_labels.append(label)
            count = Reservation.query.filter(
                db.func.date(Reservation.parking_timestamp) == d
            ).count()
            chart_data.append(count)
        chart_usage = {
            "labels": chart_labels,
            "data": chart_data,
        }

        utilization = {
            "labels": ["Occupied", "Available", "Reserved"],
            "data":  [occupied_spots, available_spots, reserved_spots]
        }

        return jsonify({
            "summary": {
                "totalUsers": total_users,
                "userGrowth": userGrowth,
                "totalParkingLots": total_lots,
                "lotGrowth": lotGrowth,
                "activeReservations": active_reservations,
                "reservationGrowth": reservationGrowth,
                "revenue": int(total_revenue or 0),
                "revenueGrowth": revenueGrowth
            },
            "recentReservations": recentReservations,
            "systemAlerts": systemAlerts,
            "chartUsage": chart_usage,
            "utilization": utilization
        }), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"message": "Error retrieving admin summary", "error": str(e)}), 500

@admin_bp.route('/users', methods=['GET'])
@jwt_required
def get_users():
    users = User.query.all()
    return jsonify([
        {
            'id': user.id,
            'email': user.email,
            'roles': [role.name for role in user.roles],
            'active': user.active
        } for user in users
    ]), 200

@admin_bp.route('/users', methods=['POST'])
@jwt_required
def add_user():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    roles = data.get('roles', [])
    active = data.get('active', True)
    if not email or not password or not roles:
        return jsonify({"message": "Email, password, and role(s) required"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"message": "User already exists"}), 400
    try:
        user = User(
            email=email,
            password=hash_password(password),
            fs_uniquifier=str(uuid.uuid4()),
            active=active
        )
        db.session.add(user)
        db.session.flush()
        for role_name in roles:
            role = Role.query.filter_by(name=role_name).first()
            if role:
                user.roles.append(role)
        db.session.commit()
        return jsonify({"message": "User added successfully"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error adding user", "error": str(e)}), 500

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required
def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
   
    Reservation.query.filter_by(user_id=user.id).delete()
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "User and their reservations deleted successfully"}), 200

@admin_bp.route('/update-lot/<lot_id>', methods=['PUT'])
@jwt_required
def update_lot(lot_id):
    data = request.json or {}
    lot = ParkingLot.query.get_or_404(lot_id)
    errors = []
    name = data.get('prime_location_name', '').strip()
    address = data.get('address', '').strip()
    pin_code = data.get('pin_code', '').strip()
     
    try:
        price = float(data.get('price'))
    except (TypeError, ValueError):
        errors.append('Invalid price')
    try:
        number_of_spots = int(data.get('number_of_spots'))
    except (TypeError, ValueError):
        errors.append('Invalid number of spots')

    if not name:
        errors.append('Location name required')
    if not address:
        errors.append('Address required')
    if not pin_code:
        errors.append('Pin code required')
    if 'price' not in locals() or price <= 0:
        errors.append('Price must be positive')
    if 'number_of_spots' not in locals() or number_of_spots <= 0:
        errors.append('Number of spots must be positive')

    if errors:
        return jsonify({'success': False, 'errors': errors, 'message': 'Validation failed'}), 400

    old_spots_count = lot.number_of_spots
    
    lot.prime_location_name = name
    lot.address = address
    lot.pin_code = pin_code
    lot.price = price
    lot.number_of_spots = number_of_spots

    db.session.flush()

    spot_qs = lot.spots.order_by(ParkingSpot.spot_number.asc())
    spot_count = spot_qs.count()
    
    if number_of_spots > spot_count:
        
        max_spot_number = db.session.query(func.max(ParkingSpot.spot_number)).filter(
            ParkingSpot.lot_id == lot.id
        ).scalar() or 0
        
        start_number = max_spot_number + 1
        to_add = number_of_spots - spot_count
        
        for i in range(to_add):
            new_spot_number = start_number + i
            db.session.add(ParkingSpot(lot_id=lot.id, status='A', spot_number=new_spot_number))
            
    elif number_of_spots < spot_count:
        
        spots_to_remove_count = spot_count - number_of_spots
              
        available_spots_to_delete = ParkingSpot.query.filter(
            ParkingSpot.lot_id == lot.id,
            ParkingSpot.status == 'A'
        ).order_by(
            ParkingSpot.spot_number.desc()
        ).limit(spots_to_remove_count).all()
        
        
        if len(available_spots_to_delete) < spots_to_remove_count:
             
             lot.number_of_spots = old_spots_count
             db.session.rollback()

             occupied_spots = ParkingSpot.query.filter(
                ParkingSpot.lot_id == lot.id,
                ParkingSpot.status == 'O'
             ).count()
             
             max_allowed_spots = occupied_spots + len(available_spots_to_delete)

             return jsonify({
                'success': False, 
                'message': f'Cannot shrink lot to {number_of_spots}. Max capacity allowed is {max_allowed_spots} due to current occupied spots.',
                'errors': [f'Occupied spots prevent shrinking below {max_allowed_spots} total spots.']
             }), 400
             
        for spot in available_spots_to_delete:
            db.session.delete(spot)

    db.session.commit()
    return jsonify({'success': True, 'message': 'Parking lot updated'})

@admin_bp.route('/parking-lots', methods=['GET'])
@jwt_required
def admin_search_parking_lots():
    query = request.args.get("query", "").strip().lower()
    q = ParkingLot.query
    if query:
        q = q.filter(
            (ParkingLot.prime_location_name.ilike(f"%{query}%")) |
            (ParkingLot.address.ilike(f"%{query}%")) |
            (ParkingLot.pin_code.ilike(f"%{query}%"))
        )
    lots = q.all()
    results = [{
        "id": lot.id,
        "prime_location_name": lot.prime_location_name,
        "address": lot.address,
        "pin_code": lot.pin_code,
        "price": lot.price,
        "number_of_spots": lot.number_of_spots,
        "available_spots": lot.available_spots,
        "occupied_spots": lot.occupied_spots,
    } for lot in lots]
    return jsonify(results)

@admin_bp.route('/reservations', methods=['GET'])
@jwt_required
def admin_search_reservations():
    query = request.args.get("query", "").lower()
    q = Reservation.query.join(User).join(ParkingSpot).join(ParkingLot)
    if query:
        
        q = q.filter(
            (User.email.ilike(f"%{query}%")) |
            (ParkingLot.prime_location_name.ilike(f"%{query}%")) |
            (db.cast(ParkingSpot.spot_number, db.String).ilike(f"%{query}%")) 
        )
    results = []
    for res in q.order_by(Reservation.parking_timestamp.desc()).all():
        results.append({
            "id": res.id,
            "user_email": res.user.email if res.user else "",
            "lot_name": res.spot.lot.prime_location_name if res.spot and res.spot.lot else "",
            "spot_number": res.spot.spot_number if res.spot else None, 
            "parking_timestamp": res.parking_timestamp.isoformat() if res.parking_timestamp else "",
            "leaving_timestamp": res.leaving_timestamp.isoformat() if res.leaving_timestamp else "",
            "parking_cost": res.parking_cost
        })
    return jsonify(results)
    

@admin_bp.route('/users', methods=['GET'])
@jwt_required
def get_users_list():
    users = User.query.all()
    return jsonify([
        {
            'id': user.id,
            'email': user.email,
            'roles': [role.name for role in user.roles],
            'active': user.active
        } for user in users
    ]), 200