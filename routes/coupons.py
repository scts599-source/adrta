from flask import Blueprint, request, jsonify
from datetime import datetime
from models.coupon import Coupon

coupons_bp = Blueprint('coupons_bp', __name__)


@coupons_bp.route('/api/coupons/validate', methods=['POST'])
def validate_coupon():
    try:
        data = request.get_json(silent=True) or {}
        code = (data.get('code') or '').strip().upper()
        subtotal = int(data.get('subtotal', 0) or 0)

        if not code:
            return jsonify({'error': 'Coupon code required'}), 400

        coupon = Coupon.query.filter_by(code=code, active=True).first()
        if not coupon:
            return jsonify({'error': 'Invalid coupon code'}), 400

        if coupon.expiry:
            expiry_datetime = datetime.combine(coupon.expiry, datetime.max.time())
            if expiry_datetime < datetime.utcnow():
                return jsonify({'error': 'This coupon has expired'}), 400

        if coupon.max_uses and coupon.used_count >= coupon.max_uses:
            return jsonify({'error': 'Coupon usage limit reached'}), 400

        min_order = coupon.min_subtotal or 0
        if subtotal < min_order:
            return jsonify({'error': f'Minimum order amount is ₹{min_order}. Your cart: ₹{subtotal}'}), 400

        discount = 0
        if coupon.type == 'percentage':
            discount = int((subtotal * coupon.value) / 100)
        elif coupon.type == 'fixed':
            discount = min(coupon.value, subtotal)

        return jsonify({
            'success': True,
            'discount': discount,
            'coupon': {
                'code': coupon.code,
                'type': coupon.type,
                'value': coupon.value,
                'min_subtotal': min_order
            }
        }), 200

    except Exception as e:
        return jsonify({'error': 'Failed to validate coupon', 'details': str(e)}), 500
