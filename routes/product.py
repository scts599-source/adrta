from flask import Blueprint, request, jsonify
from sqlalchemy import or_

from models import db
from models.product import Product

product_bp = Blueprint('product_bp', __name__)

@product_bp.route('/api/products', methods=['GET'])
def list_products():
    is_new = request.args.get('is_new', '').lower()
    category = request.args.get('category', '').strip()
    search_term = request.args.get('search', '').strip()

    query = Product.query
    if is_new == 'true':
        query = query.filter(Product.is_new == True)
    elif is_new == 'false':
        query = query.filter(Product.is_new == False)

    if category:
        query = query.filter(Product.category.ilike(f'%{category}%'))

    if search_term:
        query = query.filter(
            or_(
                Product.name.ilike(f'%{search_term}%'),
                Product.description.ilike(f'%{search_term}%')
            )
        )

    products = query.all()
    return jsonify([p.to_dict() for p in products])

@product_bp.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    product = Product.query.get_or_404(product_id)
    return jsonify(product.to_dict())
