from flask import Blueprint, current_app, request, jsonify, send_from_directory
from flask_security import auth_required, verify_password, hash_password, current_user
from backend.models import db, User, ParkingLot, ParkingSpot, Reservation, Role
from flask_cors import cross_origin
import uuid

bp = Blueprint('main', __name__)

@bp.route('/')
def home():
    return send_from_directory(current_app.static_folder, 'index.html')

@bp.route('/<path:path>')
def catch_all(path):
    if not path.startswith('api/'):
        return send_from_directory(current_app.static_folder, 'index.html')
    else:
        return ('', 404)
    

@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    user = User.query.filter_by(email=email).first()
    if not user or not verify_password(password, user.password):
        return jsonify({'message': 'Invalid credentials'}), 401
    token = user.get_auth_token()
    return jsonify({'token': token, 'email': user.email, 'role': user.roles[0].name if user.roles else ''})


@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    role = data.get('role')
   
    if not email or not password or role != 'user':
        return jsonify({"message": "Invalid inputs"}), 400
 
    if User.query.filter_by(email=email).first():
        return jsonify({"message": "User already exists"}), 400

    try:
        datastore = current_app.security.datastore

        user_role = Role.query.filter_by(name='user').first()
        if not user_role:
            return jsonify({"message": "User role not found in the database"}), 500

        user = datastore.create_user(
            email=email,
            password=hash_password(password),
            fs_uniquifier=str(uuid.uuid4()),
            roles=[user_role],
            active=True
        )
        db.session.commit()
        return jsonify({"message": "User created"}), 201

    except Exception as e:
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({"message": "Error creating user", "error": str(e)}), 500
