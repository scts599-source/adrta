from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from datetime import datetime
import html

from models import db
from models.cart_item import CartItem
from models.product import Product
from models.product_variant import ProductVariant
from models.order import Order
from models.order_item import OrderItem
from models.coupon import Coupon
from utils.validation import validate_email, validate_phone, validate_name
from utils.security import sanitize_text
from utils.mailer import send_order_confirmation_email, send_cod_order_email

order_bp = Blueprint('order_bp', __name__)


@order_bp.route('/api/orders', methods=['POST'])
@login_required
def create_order():
    try:
        data = request.get_json(silent=True) or {}
        cart_items = CartItem.query.filter_by(user_id=current_user.id).all()
        if not cart_items:
            return jsonify({'error': 'Cart is empty'}), 400

        subtotal = 0
        for item in cart_items:
            if not item.product:
                continue
            price = item.product.price or 0
            if item.variant and item.variant.price:
                price = item.variant.price
            subtotal += price * item.quantity

        discount = int(data.get('discount', 0) or 0)
        coupon_code = data.get('coupon_code')

        raw_customer_name = data.get('customer_name', '').strip()
        phone = data.get('phone', '').strip()
        email = data.get('email', '').strip().lower()
        address = data.get('address', '').strip()
        payment_method = (data.get('payment_method') or '').upper()

        if not all([raw_customer_name, phone, email, address]):
            return jsonify({'error': 'Missing required customer information'}), 400
        if not validate_name(raw_customer_name):
            return jsonify({'error': 'Invalid customer name format'}), 400
        if not validate_phone(phone):
            return jsonify({'error': 'Invalid mobile number format'}), 400
        if not validate_email(email):
            return jsonify({'error': 'Invalid email address'}), 400
        if payment_method not in ['ONLINE', 'COD']:
            return jsonify({'error': 'Invalid payment method. Choose ONLINE or COD'}), 400

        customer_name = html.escape(raw_customer_name)
        address = sanitize_text(address)

        razorpay_payment_id = data.get('razorpay_payment_id')
        razorpay_order_id = data.get('razorpay_order_id')
        razorpay_signature = data.get('razorpay_signature')

        payment_reference = None
        if payment_method == 'ONLINE':
            if not all([razorpay_payment_id, razorpay_order_id, razorpay_signature]):
                return jsonify({'error': 'Payment verification details missing'}), 400
            # payment verification happens in frontend or on a dedicated gateway callback
            order_status = 'confirmed'
            payment_status = 'completed'
            payment_reference = razorpay_payment_id
        else:
            order_status = 'pending confirmation'
            payment_status = 'pending'

        total = subtotal - discount
        total = max(total, 0)

        order_id = f"ORD-{__import__('uuid').uuid4().hex[:8].upper()}"

        order = Order(
            id=order_id,
            user_id=current_user.id,
            subtotal=subtotal,
            discount=discount,
            shipping=0,
            total_amount=total,
            payment_method=payment_method,
            payment_reference=payment_reference,
            customer_name=customer_name,
            phone=phone,
            email=email,
            address=address,
            order_status=order_status,
            payment_status=payment_status,
            coupon_code=coupon_code if coupon_code else None,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.session.add(order)
        db.session.flush()

        for item in cart_items:
            if not item.product:
                continue
            price = item.product.price or 0
            variant_info = ''
            if item.variant:
                if item.variant.price:
                    price = item.variant.price
                if getattr(item.variant, 'color_name', None):
                    variant_info = item.variant.color_name
            order_item = OrderItem(
                order_id=order_id,
                product_id=item.product_id,
                product_name=item.product.name,
                variant_info=variant_info,
                selected_size=item.selected_size,
                unit_price=price,
                quantity=item.quantity,
                total_price=price * item.quantity
            )
            db.session.add(order_item)
            if item.variant and item.variant.stock is not None:
                item.variant.stock = max(0, item.variant.stock - item.quantity)
            elif item.product.stock is not None:
                item.product.stock = max(0, item.product.stock - item.quantity)

        if coupon_code:
            coupon = Coupon.query.filter_by(code=coupon_code.upper(), active=True).first()
            if coupon:
                coupon.used_count = (coupon.used_count or 0) + 1

        CartItem.query.filter_by(user_id=current_user.id).delete()
        db.session.commit()

        try:
            if payment_method == 'COD':
                send_cod_order_email(order_id)
            else:
                send_order_confirmation_email(order_id)
        except Exception:
            pass

        return jsonify({'success': True, 'order_id': order_id, 'total': total, 'payment_method': payment_method, 'message': 'Order placed successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create order: {str(e)}'}), 500


@order_bp.route('/api/orders/user', methods=['GET'])
@login_required
def get_user_orders():
    try:
        orders_db = Order.query.filter_by(user_id=current_user.id).order_by(Order.created_at.desc()).all()
        orders_list = []
        for order in orders_db:
            orders_list.append({
                'id': order.id,
                'status': order.order_status or 'pending',
                'total': float(order.total_amount or 0),
                'date': order.created_at.isoformat() if order.created_at else None,
                'shippingAddress': order.address or '',
                'paymentMethod': order.payment_method or '',
                'items': [
                    {
                        'productName': item.product_name or 'Unknown',
                        'variantInfo': item.variant_info or '',
                        'quantity': item.quantity or 0,
                        'unitPrice': float(item.unit_price or 0),
                        'totalPrice': float(item.total_price or 0)
                    }
                    for item in order.items
                ]
            })
        return jsonify({'success': True, 'orders': orders_list}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': 'Failed to fetch orders', 'details': str(e)}), 500


@order_bp.route('/api/orders/<order_id>', methods=['GET'])
@login_required
def get_order(order_id):
    try:
        order = Order.query.filter_by(id=order_id, user_id=current_user.id).first()
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        return jsonify({
            'id': order.id,
            'subtotal': order.subtotal or 0,
            'discount': order.discount or 0,
            'shipping': order.shipping or 0,
            'total_amount': order.total_amount or 0,
            'payment_method': order.payment_method or '',
            'payment_status': order.payment_status or 'pending',
            'payment_reference': order.payment_reference or '',
            'customer_name': order.customer_name or '',
            'phone': order.phone or '',
            'email': order.email or '',
            'address': order.address or '',
            'order_status': order.order_status or 'pending',
            'tracking_id': order.tracking_id or '',
            'created_at': order.created_at.isoformat() if order.created_at else None,
            'updated_at': order.updated_at.isoformat() if order.updated_at else None,
            'items': [
                {
                    'product_name': item.product_name or 'Unknown',
                    'variant_info': item.variant_info or '',
                    'quantity': item.quantity or 0,
                    'unit_price': item.unit_price or 0,
                    'total_price': item.total_price or 0
                }
                for item in order.items
            ]
        })
    except Exception as e:
        return jsonify({'error': 'Failed to get order details', 'details': str(e)}), 500
