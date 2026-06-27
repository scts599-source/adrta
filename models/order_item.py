from . import db

class OrderItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.String(50), db.ForeignKey('order.id', ondelete='CASCADE'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id', ondelete='SET NULL'), nullable=True)
    product_name = db.Column(db.String(200))
    variant_info = db.Column(db.String(100))
    selected_size = db.Column(db.String(10), nullable=True)
    unit_price = db.Column(db.Integer)
    quantity = db.Column(db.Integer)
    total_price = db.Column(db.Integer)
