
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from datetime import datetime
from dateutil.parser import parse
import json
import os
import uuid

from models import db
from models.product import Product
from models.product_variant import ProductVariant
from models.order import Order
from models.order_item import OrderItem
from models.coupon import Coupon
from models.user import User
from models.admin_settings import AdminSettings
from models.newsletter import Newsletter
from utils.decorators import admin_required
from utils.security import allowed_file, safe_get_image
from utils.mailer import (
    compress_image_base64,
    send_order_confirmation_email,
    send_cod_order_email,
    send_shipping_update_email,
    send_delivery_confirmation_email,
    calculate_partner_commission,
)

admin_bp = Blueprint('admin_bp', __name__)


@admin_bp.route('/api/admin/newsletter', methods=['GET'])
@admin_required
def admin_newsletter():
    try:
        subscribers = Newsletter.query.filter_by(is_active=True).order_by(Newsletter.subscribed_at.desc()).all()
        return jsonify([
            {
                'id': s.id,
                'email': s.email,
                'subscribed_at': s.subscribed_at.isoformat() if s.subscribed_at else None
            }
            for s in subscribers
        ])
    except Exception as e:
        return jsonify({'error': 'Failed to fetch subscribers', 'details': str(e)}), 500


@admin_bp.route('/api/admin/products', methods=['GET', 'POST'])
@admin_required
def admin_products():
    if request.method == 'GET':
        try:
            products = Product.query.order_by(Product.id.desc()).all()
            result = []
            for p in products:
                sizes = []
                if getattr(p, 'available_sizes', None):
                    try:
                        sizes = json.loads(p.available_sizes)
                    except Exception:
                        sizes = []
                result.append({
                    'id': p.id,
                    'name': p.name,
                    'category': p.category,
                    'price': p.price,
                    'original_price': p.original_price,
                    'mrp': getattr(p, 'mrp', p.original_price),
                    'stock': p.stock,
                    'description': p.description or '',
                    'image': safe_get_image(p.image),
                    'is_new': p.is_new,
                    'available_sizes': sizes
                })
            return jsonify(result)
        except Exception as e:
            return jsonify({'error': 'Failed to load products', 'details': str(e)}), 500

    try:
        data = request.get_json(silent=True) or {}
        name = (data.get('name') or '').strip()
        category = (data.get('category') or '').strip()
        price_raw = data.get('price')
        mrp_raw = data.get('mrp') or data.get('productMRP') or data.get('original_price')
        stock_raw = data.get('stock')
        description = (data.get('description') or '').strip()
        images = data.get('images', [])
        if isinstance(images, str):
            try:
                images = json.loads(images)
            except Exception:
                images = [images] if images else []
        if not isinstance(images, list):
            images = [images] if images else []

        if not name:
            return jsonify({'error': 'Product name is required'}), 400
        if price_raw is None or price_raw == '':
            return jsonify({'error': 'Selling price is required'}), 400
        if stock_raw is None or stock_raw == '':
            return jsonify({'error': 'Stock quantity is required'}), 400

        price = int(float(price_raw))
        stock = int(float(stock_raw))
        if mrp_raw is not None and mrp_raw != '':
            mrp = int(float(mrp_raw))
            if mrp < price:
                return jsonify({'error': 'MRP cannot be less than selling price'}), 400
        else:
            mrp = price

        compressed_images = []
        for img in images:
            if img and isinstance(img, str) and len(img) > 100:
                try:
                    compressed_images.append(compress_image_base64(img, max_size_kb=800, quality=85))
                except Exception:
                    compressed_images.append(img)

        images_json = json.dumps(compressed_images) if compressed_images else '[]'
        is_new = data.get('is_new', False)
        if isinstance(is_new, str):
            is_new = is_new.lower() == 'true'

        product = Product(
            name=name,
            category=category,
            original_price=mrp,
            price=price,
            mrp=mrp,
            stock=stock,
            description=description,
            image=images_json,
            is_new=bool(is_new),
            available_sizes=data.get('available_sizes', '[]')
        )
        db.session.add(product)
        db.session.commit()
        return jsonify({'success': True, 'product_id': product.id, 'message': 'Product created successfully'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create product: {str(e)}'}), 500


@admin_bp.route('/api/admin/products/<int:product_id>', methods=['GET', 'PUT', 'DELETE'])
@admin_required
def admin_product(product_id):
    product = Product.query.get_or_404(product_id)

    if request.method == 'GET':
        try:
            sizes = []
            if getattr(product, 'available_sizes', None):
                try:
                    sizes = json.loads(product.available_sizes)
                except Exception:
                    sizes = []
            return jsonify({
                'id': product.id,
                'name': product.name,
                'category': product.category,
                'price': product.price,
                'original_price': product.original_price,
                'mrp': getattr(product, 'mrp', product.original_price),
                'stock': product.stock,
                'description': product.description or '',
                'image': safe_get_image(product.image),
                'is_new': product.is_new,
                'available_sizes': sizes
            })
        except Exception as e:
            return jsonify({'error': 'Product not found', 'details': str(e)}), 404

    if request.method == 'PUT':
        try:
            data = request.get_json(silent=True) or {}
            if 'name' in data:
                product.name = data['name'].strip()
            if 'category' in data:
                product.category = data['category'].strip()
            if 'price' in data:
                try:
                    product.price = int(float(data['price']))
                except (ValueError, TypeError):
                    return jsonify({'error': 'Invalid price value'}), 400
            if 'mrp' in data or 'productMRP' in data or 'original_price' in data:
                mrp_value = data.get('mrp') or data.get('productMRP') or data.get('original_price')
                if mrp_value is not None and mrp_value != '':
                    try:
                        mrp_int = int(float(mrp_value))
                        if mrp_int < product.price:
                            return jsonify({'error': 'MRP cannot be less than selling price'}), 400
                        product.mrp = mrp_int
                        product.original_price = mrp_int
                    except (ValueError, TypeError):
                        return jsonify({'error': 'Invalid MRP value'}), 400
                else:
                    product.mrp = product.price
                    product.original_price = product.price
            if 'stock' in data:
                try:
                    product.stock = int(float(data['stock']))
                except (ValueError, TypeError):
                    return jsonify({'error': 'Invalid stock value'}), 400
            if 'description' in data:
                product.description = data['description'].strip()
            if 'available_sizes' in data:
                product.available_sizes = data['available_sizes']
            if 'images' in data and data['images']:
                images = data['images']
                if isinstance(images, str):
                    try:
                        images = json.loads(images)
                    except Exception:
                        images = [images] if images else []
                if not isinstance(images, list):
                    images = [images] if images else []
                compressed_images = []
                for img in images:
                    if img and isinstance(img, str) and len(img) > 100:
                        try:
                            compressed_images.append(compress_image_base64(img, max_size_kb=800, quality=85))
                        except Exception:
                            compressed_images.append(img)
                if compressed_images:
                    product.image = json.dumps(compressed_images)
            if 'is_new' in data:
                is_new = data['is_new']
                product.is_new = is_new.lower() == 'true' if isinstance(is_new, str) else bool(is_new)
            db.session.commit()
            discount = 0
            if product.mrp and product.mrp > product.price:
                discount = round(((product.mrp - product.price) / product.mrp) * 100)
            return jsonify({'success': True, 'message': 'Product updated successfully', 'product': {
                'id': product.id,
                'mrp': product.mrp,
                'price': product.price,
                'discount_percent': discount
            }})
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'Failed to update product: {str(e)}'}), 500

    if request.method == 'DELETE':
        try:
            CartItem = None
            from models.cart_item import CartItem
            deleted_cart = CartItem.query.filter_by(product_id=product_id).delete()
            ProductVariant.query.filter_by(product_id=product_id).delete()
            OrderItem.query.filter_by(product_id=product_id).update({'product_id': None})
            db.session.delete(product)
            db.session.commit()
            return jsonify({'success': True, 'message': 'Product deleted successfully'})
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'Failed to delete product: {str(e)}'}), 500


@admin_bp.route('/api/admin/products/<int:product_id>/variants', methods=['GET', 'POST'])
@admin_required
def admin_product_variants(product_id):
    product = Product.query.get_or_404(product_id)
    if request.method == 'GET':
        try:
            variants = []
            for v in product.variants:
                images = []
                if v.images:
                    try:
                        images = json.loads(v.images) if isinstance(v.images, str) else v.images
                    except Exception:
                        images = []
                variants.append({
                    'id': v.id,
                    'color_name': v.color_name,
                    'price': v.price,
                    'stock': v.stock,
                    'description': v.description or '',
                    'images': images
                })
            return jsonify(variants)
        except Exception as e:
            return jsonify({'error': 'Failed to fetch variants', 'details': str(e)}), 500

    try:
        data = request.get_json(silent=True) or {}
        color_name = (data.get('color_name') or '').strip()
        if not color_name:
            return jsonify({'error': 'Color name is required'}), 400
        images_raw = data.get('images', [])
        if isinstance(images_raw, str):
            try:
                images_raw = json.loads(images_raw)
            except Exception:
                images_raw = [images_raw] if images_raw else []
        if not isinstance(images_raw, list):
            images_raw = [images_raw] if images_raw else []
        compressed_images = []
        for img in images_raw:
            if img and isinstance(img, str) and len(img) > 100:
                try:
                    compressed_images.append(compress_image_base64(img, max_size_kb=500, quality=80))
                except Exception:
                    continue
        if not compressed_images:
            return jsonify({'error': 'No valid images provided or all compressions failed'}), 400
        variant = ProductVariant(
            product_id=product_id,
            color_name=color_name,
            price=data.get('price') or product.price,
            stock=data.get('stock', 0),
            description=data.get('description', ''),
            images=json.dumps(compressed_images)
        )
        db.session.add(variant)
        db.session.commit()
        return jsonify({'success': True, 'variant_id': variant.id, 'message': 'Variant created successfully'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create variant: {str(e)}'}), 500


@admin_bp.route('/api/admin/variants/<int:variant_id>', methods=['PUT', 'DELETE'])
@admin_required
def admin_variant(variant_id):
    variant = ProductVariant.query.get_or_404(variant_id)
    if request.method == 'PUT':
        try:
            data = request.get_json(silent=True) or {}
            if 'color_name' in data:
                variant.color_name = data['color_name'].strip()
            if 'price' in data:
                variant.price = data['price']
            if 'stock' in data:
                variant.stock = data['stock']
            if 'description' in data:
                variant.description = data['description']
            if 'images' in data:
                images = data['images']
                if isinstance(images, list):
                    variant.images = json.dumps(images)
                else:
                    variant.images = json.dumps([images]) if images else '[]'
            db.session.commit()
            return jsonify({'success': True, 'message': 'Variant updated successfully'})
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': 'Failed to update variant', 'details': str(e)}), 500

    try:
        from models.cart_item import CartItem
        CartItem.query.filter_by(product_variant_id=variant_id).update({'product_variant_id': None})
        db.session.delete(variant)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Variant deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete variant', 'details': str(e)}), 500


@admin_bp.route('/api/admin/orders', methods=['GET'])
@admin_required
def admin_orders():
    try:
        orders = Order.query.order_by(Order.created_at.desc()).all()
        return jsonify([
            {
                'id': order.id,
                'user_id': order.user_id,
                'customer_name': order.customer_name or 'N/A',
                'phone': order.phone or 'N/A',
                'email': order.email or 'N/A',
                'address': order.address or 'N/A',
                'total_amount': order.total_amount or 0,
                'subtotal': order.subtotal or 0,
                'discount': order.discount or 0,
                'shipping': order.shipping or 0,
                'payment_method': order.payment_method or 'N/A',
                'payment_status': order.payment_status or 'pending',
                'order_status': order.order_status or 'pending confirmation',
                'tracking_id': order.tracking_id or '',
                'created_at': order.created_at.isoformat() if order.created_at else None,
                'items_count': len(order.items)
            }
            for order in orders
        ])
    except Exception as e:
        return jsonify({'error': 'Failed to fetch orders', 'details': str(e)}), 500


@admin_bp.route('/api/admin/orders/<order_id>', methods=['GET', 'PUT'])
@admin_required
def admin_order_detail(order_id):
    order = Order.query.get_or_404(order_id)
    if request.method == 'GET':
        try:
            user_info = None
            if order.user_id:
                user = User.query.get(order.user_id)
                if user:
                    user_info = {
                        'id': user.id,
                        'name': user.name,
                        'email': user.email,
                        'phone': user.phone,
                        'address': user.address,
                        'is_verified': user.is_verified,
                        'is_admin': user.is_admin,
                        'registered_at': user.created_at.isoformat() if user.created_at else None
                    }
            return jsonify({
                'id': order.id,
                'user_id': order.user_id,
                'user_info': user_info,
                'customer_name': order.customer_name,
                'phone': order.phone,
                'email': order.email,
                'address': order.address,
                'subtotal': order.subtotal,
                'discount': order.discount,
                'shipping': order.shipping,
                'total_amount': order.total_amount,
                'payment_method': order.payment_method,
                'payment_status': order.payment_status,
                'payment_reference': order.payment_reference,
                'order_status': order.order_status,
                'tracking_id': order.tracking_id,
                'created_at': order.created_at.isoformat() if order.created_at else None,
                'updated_at': order.updated_at.isoformat() if order.updated_at else None,
                'items': [
                    {
                        'id': item.id,
                        'product_id': item.product_id,
                        'product_name': item.product_name,
                        'variant_info': item.variant_info,
                        'selected_size': item.selected_size,
                        'unit_price': item.unit_price,
                        'quantity': item.quantity,
                        'total_price': item.total_price
                    }
                    for item in order.items
                ]
            })
        except Exception as e:
            return jsonify({'error': 'Failed to get order details', 'details': str(e)}), 500

    try:
        data = request.get_json(silent=True) or {}
        old_status = order.order_status
        order.order_status = data.get('order_status', order.order_status)
        if data.get('payment_status'):
            order.payment_status = data.get('payment_status')
        if 'tracking_id' in data:
            order.tracking_id = data.get('tracking_id')
        order.updated_at = datetime.utcnow()
        db.session.commit()
        if order.order_status == 'delivered' and old_status != 'delivered':
            try:
                calculate_partner_commission(order_id)
            except Exception:
                pass
        try:
            if order.payment_method == 'COD' and order.order_status == 'confirmed' and old_status != 'confirmed':
                send_order_confirmation_email(order_id)
            elif order.order_status == 'shipped' and order.tracking_id and old_status != 'shipped':
                send_shipping_update_email(order_id, order.tracking_id)
            elif order.order_status == 'delivered' and old_status != 'delivered':
                send_delivery_confirmation_email(order_id)
        except Exception:
            pass
        return jsonify({'success': True, 'message': 'Order updated successfully', 'order': {
            'order_status': order.order_status,
            'payment_status': order.payment_status,
            'tracking_id': order.tracking_id,
            'payment_method': order.payment_method
        }})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update order', 'details': str(e)}), 500


@admin_bp.route('/api/admin/coupons', methods=['GET', 'POST'])
@admin_required
def admin_coupons():
    if request.method == 'GET':
        try:
            coupons = Coupon.query.order_by(Coupon.id.desc()).all()
            return jsonify([
                {
                    'id': c.id,
                    'code': c.code,
                    'type': c.type,
                    'value': c.value,
                    'min_subtotal': c.min_subtotal or 0,
                    'max_uses': c.max_uses,
                    'used_count': c.used_count or 0,
                    'expiry': c.expiry.isoformat() if c.expiry else None,
                    'active': c.active
                }
                for c in coupons
            ])
        except Exception as e:
            return jsonify({'error': 'Failed to fetch coupons', 'details': str(e)}), 500

    try:
        data = request.get_json(silent=True) or {}
        code = (data.get('code') or '').strip().upper()
        if not code:
            return jsonify({'error': 'Coupon code is required'}), 400
        if Coupon.query.filter_by(code=code).first():
            return jsonify({'error': 'Coupon code already exists'}), 400
        expiry_date = None
        expiry_str = data.get('expiry') or data.get('valid_until')
        if expiry_str:
            try:
                if 'T' in expiry_str:
                    expiry_date = datetime.fromisoformat(expiry_str.replace('Z', '+00:00')).date()
                else:
                    expiry_date = datetime.strptime(expiry_str, '%Y-%m-%d').date()
            except Exception:
                expiry_date = None
        min_subtotal_value = data.get('min_subtotal') or data.get('min_order_value') or 0
        coupon = Coupon(
            code=code,
            type=data.get('type', 'percentage'),
            value=int(data.get('value', 0)),
            min_subtotal=int(min_subtotal_value),
            max_uses=int(data.get('max_uses', 100)) if data.get('max_uses') else None,
            used_count=0,
            expiry=expiry_date,
            active=data.get('active', True)
        )
        db.session.add(coupon)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Coupon created successfully', 'coupon': {
            'id': coupon.id,
            'code': coupon.code,
            'expiry': coupon.expiry.isoformat() if coupon.expiry else None,
            'min_subtotal': coupon.min_subtotal
        }}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create coupon', 'details': str(e)}), 500


@admin_bp.route('/api/admin/coupons/<int:coupon_id>', methods=['PUT', 'DELETE'])
@admin_required
def admin_coupon(coupon_id):
    coupon = Coupon.query.get_or_404(coupon_id)
    if request.method == 'PUT':
        try:
            data = request.get_json(silent=True) or {}
            if 'active' in data:
                coupon.active = data.get('active')
            if 'value' in data:
                coupon.value = int(data.get('value'))
            if 'max_uses' in data:
                coupon.max_uses = int(data.get('max_uses')) if data.get('max_uses') else None
            db.session.commit()
            return jsonify({'success': True, 'message': 'Coupon updated'})
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': 'Failed to update coupon', 'details': str(e)}), 500

    try:
        db.session.delete(coupon)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Coupon deleted'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete coupon', 'details': str(e)}), 500


@admin_bp.route('/api/admin/users', methods=['GET'])
@admin_required
def admin_users():
    try:
        users = User.query.order_by(User.created_at.desc()).all()
        return jsonify([
            {
                'id': u.id,
                'name': u.name or 'N/A',
                'email': u.email or 'N/A',
                'phone': u.phone or 'N/A',
                'address': u.address or 'N/A',
                'is_admin': u.is_admin,
                'is_verified': u.is_verified,
                'require_2fa': u.require_2fa,
                'created_at': u.created_at.isoformat() if u.created_at else None
            }
            for u in users
        ])
    except Exception as e:
        return jsonify({'error': 'Failed to fetch users', 'details': str(e)}), 500


@admin_bp.route('/api/admin/stats', methods=['GET'])
@admin_required
def admin_stats():
    try:
        total_users = User.query.count()
        total_products = Product.query.count()
        total_orders = Order.query.count()
        pending_orders = Order.query.filter(Order.order_status.in_(['pending', 'pending confirmation'])).count()
        total_revenue = db.session.query(db.func.sum(Order.total_amount)).filter(Order.payment_status == 'completed').scalar() or 0
        return jsonify({
            'total_users': total_users,
            'total_products': total_products,
            'total_orders': total_orders,
            'pending_orders': pending_orders,
            'total_revenue': int(total_revenue)
        })
    except Exception as e:
        return jsonify({'error': 'Failed to fetch stats', 'details': str(e)}), 500


@admin_bp.route('/api/upload', methods=['POST'])
@admin_required
def upload_image():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type'}), 400
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4().hex}_{filename}"
        filepath = os.path.join(os.path.dirname(__file__), '..', 'static', 'images', 'products')
        os.makedirs(filepath, exist_ok=True)
        file.save(os.path.join(filepath, unique_filename))
        return jsonify({'success': True, 'url': f'/static/images/products/{unique_filename}'})
    except Exception as e:
        return jsonify({'error': 'Upload failed', 'details': str(e)}), 500


@admin_bp.route('/api/maintenance/status', methods=['GET'])
def maintenance_status():
    try:
        settings = AdminSettings.query.first()
        if not settings:
            return jsonify({'maintenance': False}), 200
        if settings.maintenance_enabled and settings.maintenance_ends_at and settings.maintenance_ends_at < datetime.utcnow():
            settings.maintenance_enabled = False
            db.session.commit()
        if settings.maintenance_enabled:
            return jsonify({
                'maintenance': True,
                'message': settings.maintenance_message or 'Site is under maintenance',
                'endsAt': settings.maintenance_ends_at.isoformat() if settings.maintenance_ends_at else None
            }), 200
        return jsonify({'maintenance': False}), 200
    except Exception as e:
        return jsonify({'maintenance': False, 'error': str(e)}), 500


@admin_bp.route('/api/admin/maintenance', methods=['GET', 'PUT'])
@admin_required
def admin_maintenance():
    try:
        settings = AdminSettings.query.first()
        if not settings:
            settings = AdminSettings(
                maintenance_enabled=False,
                maintenance_message="We're performing scheduled maintenance."
            )
            db.session.add(settings)
            db.session.commit()
        if request.method == 'GET':
            return jsonify({
                'enabled': settings.maintenance_enabled,
                'message': settings.maintenance_message or '',
                'endsAt': settings.maintenance_ends_at.isoformat() if settings.maintenance_ends_at else None
            }), 200
        data = request.get_json(silent=True) or {}
        enabled_raw = data.get('enabled', settings.maintenance_enabled)
        if isinstance(enabled_raw, str):
            settings.maintenance_enabled = enabled_raw.lower() in ['true', '1', 'yes', 'on']
        else:
            settings.maintenance_enabled = bool(enabled_raw)
        if 'message' in data:
            settings.maintenance_message = data.get('message')
        ends_at = data.get('endsAt')
        if ends_at:
            try:
                settings.maintenance_ends_at = parse(ends_at)
            except Exception:
                settings.maintenance_ends_at = None
        else:
            settings.maintenance_ends_at = None
        db.session.commit()
        return jsonify({
            'success': True,
            'enabled': settings.maintenance_enabled,
            'message': settings.maintenance_message,
            'endsAt': settings.maintenance_ends_at.isoformat() if settings.maintenance_ends_at else None
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update maintenance settings', 'details': str(e)}), 500
