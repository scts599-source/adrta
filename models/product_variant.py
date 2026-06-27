from . import db

class ProductVariant(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id', ondelete='CASCADE'), nullable=False)
    color_name = db.Column(db.String(50), nullable=False)
    price = db.Column(db.Integer)
    stock = db.Column(db.Integer)
    description = db.Column(db.Text)
    images = db.Column(db.Text)
