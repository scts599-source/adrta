from . import db

class Coupon(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False)
    type = db.Column(db.String(20))
    value = db.Column(db.Integer)
    min_subtotal = db.Column(db.Integer, default=0)
    max_uses = db.Column(db.Integer)
    used_count = db.Column(db.Integer, default=0)
    expiry = db.Column(db.Date)
    active = db.Column(db.Boolean, default=True)
    partner_id = db.Column(db.Integer, db.ForeignKey('partner.id'), nullable=True)
    partner = db.relationship('Partner', backref='coupons')
