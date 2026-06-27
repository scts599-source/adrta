from datetime import datetime

from . import db

class CartItem(db.Model):
    __tablename__ = 'cart_item'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id', ondelete='CASCADE'), nullable=False)
    product_variant_id = db.Column(db.Integer, nullable=True)
    quantity = db.Column(db.Integer, default=1)
    selected_size = db.Column(db.String(10), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=True)

    product = db.relationship('Product', backref=db.backref('cart_items_rel', lazy=True))

    @property
    def variant(self):
        if self.product_variant_id:
            from .product_variant import ProductVariant
            return ProductVariant.query.get(self.product_variant_id)
        return None
