from datetime import datetime

from . import db

class OTP(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), index=True, nullable=True)
    email = db.Column(db.String(100), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    otp_code = db.Column(db.String(10), nullable=False)
    purpose = db.Column(db.String(50), nullable=False)
    is_used = db.Column(db.Boolean, default=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref='otps', lazy=True)

    def __repr__(self):
        identifier = self.email or self.phone or 'N/A'
        return f"<OTP {self.id}: *** for {identifier} (User ID: {self.user_id})>"
