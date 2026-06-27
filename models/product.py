import json
from datetime import datetime

from . import db


class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150))
    category = db.Column(db.String(100))
    original_price = db.Column(db.Integer)
    price = db.Column(db.Integer)
    mrp = db.Column(db.Integer, nullable=True)
    stock = db.Column(db.Integer)
    description = db.Column(db.Text)
    image = db.Column(db.Text)
    is_new = db.Column(db.Boolean, default=False)
    available_sizes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    variants = db.relationship('ProductVariant', backref='product', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        image_value = self.image or ''
        parsed_image = image_value
        if isinstance(image_value, str):
            try:
                parsed_image = json.loads(image_value)
            except Exception:
                parsed_image = image_value

        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'original_price': self.original_price,
            'price': self.price,
            'mrp': self.mrp,
            'stock': self.stock,
            'description': self.description,
            'image': parsed_image,
            'is_new': self.is_new,
            'available_sizes': self.available_sizes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
