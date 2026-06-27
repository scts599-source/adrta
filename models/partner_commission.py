from datetime import datetime

from . import db

class PartnerCommission(db.Model):
    __tablename__ = 'partner_commission'

    id = db.Column(db.Integer, primary_key=True)
    partner_id = db.Column(db.Integer, db.ForeignKey('partner.id', ondelete='CASCADE'), nullable=False)
    order_id = db.Column(db.String(50), db.ForeignKey('order.id', ondelete='CASCADE'), nullable=False)
    commission_amount = db.Column(db.Integer, nullable=False)
    visible_to_partner = db.Column(db.Boolean, default=False)
    order_subtotal = db.Column(db.Integer, nullable=False)
    commission_rate = db.Column(db.Float, default=5.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    order = db.relationship('Order', backref='partner_commission')
