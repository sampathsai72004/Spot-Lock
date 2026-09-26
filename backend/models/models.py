from backend.extensions import db  
from flask_security import UserMixin, RoleMixin
from datetime import datetime, timedelta
import uuid
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy import UniqueConstraint 
import jwt
from flask import current_app


class UserRoles(db.Model):
    __tablename__ = 'user_roles'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    role_id = db.Column(db.Integer, db.ForeignKey('role.id'))

class Role(db.Model, RoleMixin):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    description = db.Column(db.String(255), nullable=True)

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password = db.Column(db.String(255), nullable=False)
    fs_uniquifier = db.Column(db.String(64), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    active = db.Column(db.Boolean, default=True)

    roles = db.relationship('Role', secondary='user_roles', backref=db.backref('users', lazy='dynamic'))
    reservations = db.relationship('Reservation', backref='user', lazy='dynamic')
    
    def get_auth_token(self):
        payload = {
            'user_id': self.id,
            'email': self.email,
            'role': self.roles[0].name if self.roles else '',
            'exp': datetime.utcnow() + timedelta(hours=24)
        }
        token = jwt.encode(
            payload,
            current_app.config['SECRET_KEY'],
            algorithm='HS256'
        )
        if isinstance(token, bytes):
            token = token.decode('utf-8')
        return token

    def is_admin(self):
        return any(role.name == 'admin' for role in self.roles)


class ParkingLot(db.Model):
    __tablename__ = 'parking_lot'
    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    prime_location_name = db.Column(db.String(100), nullable=False)
    address = db.Column(db.String(255), nullable=False)
    pin_code = db.Column(db.String(10), nullable=False)
    price = db.Column(db.Float, nullable=False)
    number_of_spots = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    spots = db.relationship('ParkingSpot', backref='lot', lazy='dynamic', cascade="all, delete-orphan")

    @hybrid_property
    def available_spots(self):
        return ParkingSpot.query.filter_by(lot_id=self.id, status='A').count()

    @hybrid_property
    def occupied_spots(self):
        return ParkingSpot.query.filter_by(lot_id=self.id, status='O').count()

class ParkingSpot(db.Model):
    __tablename__ = 'parking_spot'
    id = db.Column(db.Integer, primary_key=True)
    lot_id = db.Column(db.String, db.ForeignKey('parking_lot.id')) 
 
    spot_number = db.Column(db.Integer, nullable=False)
    
    status = db.Column(db.String(1), nullable=False, default='A')  

    reservation = db.relationship('Reservation', backref='spot', uselist=False, cascade="all, delete-orphan")

   
    __table_args__ = (
        UniqueConstraint('lot_id', 'spot_number', name='_lot_spot_uc'),
    )

class Reservation(db.Model):
    __tablename__ = 'reservation'
    id = db.Column(db.Integer, primary_key=True)
    spot_id = db.Column(db.Integer, db.ForeignKey('parking_spot.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    parking_timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    leaving_timestamp = db.Column(db.DateTime)
    parking_cost = db.Column(db.Float)