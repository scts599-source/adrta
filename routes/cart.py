from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from config.settings import Config
import razorpay

from models import db
from models.cart_item import CartItem
from models.product import Product
from models.product_variant import ProductVariant

cart_bp = Blueprint('cart_bp', __name__)

RAZORPAY_KEY_ID = Config.RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET = Config.RAZORPAY_KEY_SECRET
razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))


@cart_bp.route('/api/cart/get', methods=['GET'])
@login_required
def get_cart_items():
    try:
        items = CartItem.query.filter_by(user_id=current_user.id).all()

        cart_data = []
        items_to_remove = []

        for item in items:
            if not item.product:
                items_to_remove.append(item)
                continue

            product = item.product
            product_image = product.image
            if not product_image or not isinstance(product_image, str) or len(product_image.strip()) == 0:
                product_image = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22%3E%3Crect fill=%22%23ddd%22 width=%22300%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22%3ENo Image%3C/text%3E%3C/svg%3E'

            price = product.price or 0
            stock = product.stock or 0
            variant_info = ''

            if item.product_variant_id:
                variant = ProductVariant.query.get(item.product_variant_id)
                if variant:
                    if variant.price is not None:
                        price = variant.price
                    if variant.stock is not None:
                        stock = variant.stock
                    if variant.images:
                        try:
                            if isinstance(variant.images, str):
                                variant_images = __import__('json').loads(variant.images)
                            else:
                                variant_images = variant.images
                            if isinstance(variant_images, list) and variant_images:
                                product_image = variant_images[0]
                        except Exception:
                            pass
                    if hasattr(variant, 'color_name') and variant.color_name:
                        variant_info = f" ({variant.color_name})"

            cart_data.append({
                'id': item.id,
                'product_id': product.id,
                'name': product.name or 'Unknown Product',
                'image': product_image,
                'quantity': item.quantity or 1,
                'price': float(price),
                'stock': stock,
                'variant_id': item.product_variant_id,
                'variant_details': variant_info or None
            })

        if items_to_remove:
            for item in items_to_remove:
                db.session.delete(item)
            db.session.commit()

        return jsonify({'items': cart_data}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to load cart', 'details': str(e), 'items': []}), 500


@cart_bp.route('/api/cart/add', methods=['POST'])
@login_required
def add_to_cart():
    try:
        data = request.get_json(silent=True) or {}
        product_id = data.get('product_id')
        quantity = int(data.get('quantity', 1) or 1)
        product_variant_id = data.get('product_variant_id')
        selected_size = data.get('selected_size')

        if not product_id:
            return jsonify({'error': 'Product ID is required'}), 400
        if quantity < 1:
            return jsonify({'error': 'Quantity must be at least 1'}), 400

        if product_variant_id:
            variant = ProductVariant.query.get(product_variant_id)
            if not variant:
                return jsonify({'error': 'Variant not found'}), 404
            if variant.stock is not None and variant.stock < quantity:
                return jsonify({'error': 'Insufficient stock for this variant'}), 400
        else:
            product = Product.query.get(product_id)
            if not product:
                return jsonify({'error': 'Product not found'}), 404
            if product.stock is not None and product.stock < quantity:
                return jsonify({'error': 'Insufficient stock'}), 400

        existing_item_query = CartItem.query.filter_by(user_id=current_user.id, product_id=product_id)
        if product_variant_id:
            existing_item_query = existing_item_query.filter_by(product_variant_id=product_variant_id)
        else:
            existing_item_query = existing_item_query.filter(CartItem.product_variant_id.is_(None))

        existing_item = existing_item_query.first()

        if existing_item:
            existing_item.quantity += quantity
        else:
            new_item = CartItem(
                user_id=current_user.id,
                product_id=product_id,
                quantity=quantity,
                product_variant_id=product_variant_id,
                selected_size=selected_size
            )
            db.session.add(new_item)

        db.session.commit()
        return jsonify({'success': True, 'message': 'Item added to cart'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to add item to cart', 'details': str(e)}), 500


@cart_bp.route('/api/cart/<int:item_id>', methods=['PUT'])
@login_required
def update_cart_item(item_id):
    try:
        data = request.get_json(silent=True) or {}
        quantity = int(data.get('quantity', 1) or 1)

        cart_item = CartItem.query.filter_by(id=item_id, user_id=current_user.id).first()
        if not cart_item:
            return jsonify({'error': 'Cart item not found'}), 404

        if quantity <= 0:
            db.session.delete(cart_item)
            db.session.commit()
            return jsonify({'success': True, 'message': 'Item removed from cart'})

        available_stock = cart_item.product.stock if cart_item.product else None
        if cart_item.product_variant_id:
            variant = ProductVariant.query.get(cart_item.product_variant_id)
            if variant and variant.stock is not None:
                available_stock = variant.stock

        if available_stock is not None and quantity > available_stock:
            return jsonify({'error': f'Only {available_stock} items available'}), 400

        cart_item.quantity = quantity
        db.session.commit()
        return jsonify({'success': True, 'message': 'Cart updated'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update cart', 'details': str(e)}), 500


@cart_bp.route('/api/cart/<int:item_id>', methods=['DELETE'])
@login_required
def remove_from_cart(item_id):
    try:
        cart_item = CartItem.query.filter_by(id=item_id, user_id=current_user.id).first()
        if not cart_item:
            return jsonify({'error': 'Cart item not found'}), 404

        db.session.delete(cart_item)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Item removed from cart'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to remove from cart', 'details': str(e)}), 500


@cart_bp.route('/api/cart/clear', methods=['DELETE'])
@login_required
def clear_cart():
    try:
        CartItem.query.filter_by(user_id=current_user.id).delete()
        db.session.commit()
        return jsonify({'success': True, 'message': 'Cart cleared'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to clear cart', 'details': str(e)}), 500


@cart_bp.route('/api/razorpay/key', methods=['GET'])
def get_razorpay_key():
    return jsonify({'key': RAZORPAY_KEY_ID}), 200


@cart_bp.route('/api/razorpay/create-order', methods=['POST'])
@login_required
def create_razorpay_order():
    try:
        data = request.get_json(silent=True) or {}
        amount_rupees = data.get('amount', 0)

        try:
            amount_rupees = int(float(amount_rupees))
        except (TypeError, ValueError):
            return jsonify({'error': 'Invalid amount'}), 400

        if amount_rupees <= 0:
            return jsonify({'error': 'Invalid amount'}), 400

        amount_paise = amount_rupees * 100
        razorpay_order = razorpay_client.order.create({
            'amount': amount_paise,
            'currency': 'INR',
            'payment_capture': 1
        })

        return jsonify({
            'success': True,
            'order_id': razorpay_order['id'],
            'amount': amount_paise,
            'currency': 'INR',
            'key': RAZORPAY_KEY_ID
        }), 200

    except Exception as e:
        return jsonify({'error': 'Failed to create payment order', 'details': str(e)}), 500
