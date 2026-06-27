from datetime import datetime

from . import db

class Order(db.Model):
    id = db.Column(db.String(50), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    subtotal = db.Column(db.Integer, nullable=False)
    discount = db.Column(db.Integer, default=0)
    shipping = db.Column(db.Integer, default=0)
    total_amount = db.Column(db.Integer, nullable=False)
    payment_method = db.Column(db.String(20))
    payment_status = db.Column(db.String(20), default='pending')
    payment_reference = db.Column(db.String(100))
    customer_name = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    email = db.Column(db.String(100))
    address = db.Column(db.Text)
    order_status = db.Column(db.String(50), default='pending confirmation')
    tracking_id = db.Column(db.String(100))
    coupon_code = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    items = db.relationship('OrderItem', backref='order', lazy=True, cascade='all, delete-orphan')
