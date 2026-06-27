from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from werkzeug.security import check_password_hash, generate_password_hash
import html

from models import db, User
from utils.validation import validate_email, validate_name, validate_phone, validate_password
from utils.security import sanitize_text
from utils.mailer import create_otp

user_bp = Blueprint('user_bp', __name__)

@user_bp.route('/api/user/request-email-verification', methods=['POST'])
@login_required
def request_email_verification():
    data = request.get_json(silent=True)
    email = data.get('email', '').strip().lower() if data else ''

    if not email or not validate_email(email):
        return jsonify({'error': 'Valid email is required'}), 400

    current_user.email = email
    db.session.commit()
    create_otp(identifier=email, linked_user_id=current_user.id, purpose='email_verify')
    return jsonify({'success': True, 'message': 'Verification OTP sent to email.'})

@user_bp.route('/api/user/add-mobile-recovery', methods=['POST'])
def add_mobile_recovery():
    data = request.get_json(silent=True)
    user_id = data.get('userId') if data else None
    phone = data.get('phone', '').strip() if data else ''

    if not user_id or not phone:
        return jsonify({'error': 'User ID and Phone required'}), 400

    if not validate_phone(phone):
        return jsonify({'error': 'Invalid mobile number format'}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    user.phone = phone
    db.session.commit()
    create_otp(identifier=phone, linked_user_id=user.id, purpose='registration')
    return jsonify({'success': True, 'message': 'OTP sent to mobile number.'})

@user_bp.route('/api/user/profile', methods=['GET', 'PUT'])
@login_required
def profile():
    if request.method == 'GET':
        return jsonify({
            'id': current_user.id,
            'name': current_user.name,
            'email': current_user.email,
            'phone': current_user.phone,
            'address': current_user.address,
            'require_2fa': current_user.require_2fa
        })

    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Invalid request format.'}), 400

    if 'name' in data:
        raw_name = data.get('name', '').strip()
        if raw_name:
            if not validate_name(raw_name):
                return jsonify({'error': 'Invalid name format'}), 400
            current_user.name = html.escape(raw_name)

    if 'email' in data:
        raw_email = data.get('email', '').strip().lower()
        if raw_email and not validate_email(raw_email):
            return jsonify({'error': 'Invalid email address'}), 400
        current_user.email = raw_email or current_user.email

    if 'phone' in data:
        raw_phone = data.get('phone', '').strip()
        if raw_phone and not validate_phone(raw_phone):
            return jsonify({'error': 'Invalid mobile number format'}), 400
        current_user.phone = raw_phone or current_user.phone

    if 'address' in data:
        current_user.address = sanitize_text(data.get('address', current_user.address) or '')

    if 'require_2fa' in data:
        current_user.require_2fa = data.get('require_2fa')

    db.session.commit()
    return jsonify({'success': True, 'message': 'Profile updated'})

@user_bp.route('/api/user/password', methods=['PUT'])
@login_required
def change_password():
    data = request.get_json(silent=True)

    if not data or not check_password_hash(current_user.password, data.get('current_password', '')):
        return jsonify({'error': 'Current password is incorrect'}), 400

    if data.get('new_password') != data.get('confirm_password'):
        return jsonify({'error': 'Passwords do not match'}), 400

    is_valid, msg = validate_password(data.get('new_password', ''))
    if not is_valid:
        return jsonify({'error': msg}), 400

    current_user.password = generate_password_hash(data['new_password'])
    db.session.commit()
    return jsonify({'success': True, 'message': 'Password changed'})
