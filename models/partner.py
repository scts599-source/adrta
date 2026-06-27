from datetime import datetime

from . import db

class Partner(db.Model):
    __tablename__ = 'partner'

    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    user_id = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    coupon_code = db.Column(db.String(50), unique=True, nullable=False)
    wallet_balance = db.Column(db.Integer, default=0)
    actual_wallet_balance = db.Column(db.Integer, default=0)
    lifetime_earnings = db.Column(db.Integer, default=0)
    actual_lifetime_earnings = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    commissions = db.relationship('PartnerCommission', backref='partner', lazy=True, cascade='all, delete-orphan')
