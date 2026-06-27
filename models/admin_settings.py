from datetime import datetime

from . import db

class AdminSettings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    maintenance_enabled = db.Column(db.Boolean, default=False)
    maintenance_message = db.Column(db.Text)
    maintenance_ends_at = db.Column(db.DateTime)
