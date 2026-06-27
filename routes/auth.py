from flask import Blueprint, request, jsonify, current_app
from flask_login import login_user, logout_user, current_user, login_required
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import or_
import html
import secrets
from datetime import datetime, timedelta

from extensions import limiter

from models import db
from models.user import User
from models.otp import OTP
from utils.validation import validate_email, validate_name, validate_phone, validate_password
from utils.security import sanitize_text
from utils.mailer import create_otp, verify_otp

auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route('/api/auth/register', methods=['POST'])
@limiter.limit("5 per minute; 20 per hour")
def register():
    data = request.get_json(silent=True) or {}
    raw_name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower() if data.get('email') else None
    phone = data.get('phone', '').strip() if data.get('phone') else None
    password = data.get('password', '')

    if not raw_name or not password:
        return jsonify({'error': 'Name and password are required'}), 400

    is_valid, msg = validate_password(password)
    if not is_valid:
        return jsonify({'error': msg}), 400

    if not validate_name(raw_name):
        return jsonify({'error': 'Invalid name format'}), 400

    if email and not validate_email(email):
        return jsonify({'error': 'Invalid email address'}), 400

    if phone and not validate_phone(phone):
        return jsonify({'error': 'Invalid mobile number format'}), 400

    if not email and not phone:
        return jsonify({'error': 'At least one valid identifier (email or phone) is required.'}), 400

    existing = User.query.filter(or_(User.email == email, User.phone == phone)).first() if (email or phone) else None
    if existing:
        if existing.is_verified:
            return jsonify({'error': f'{email or phone} already registered and verified. Please login.'}), 400
        OTP.query.filter_by(user_id=existing.id).delete()
        db.session.delete(existing)
        db.session.commit()

    user = User(
        name=html.escape(raw_name),
        email=email,
        phone=phone,
        password=generate_password_hash(password),
        is_verified=False
    )
    db.session.add(user)
    db.session.flush()

    create_otp(identifier=email or phone, linked_user_id=user.id, purpose='registration')
    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'OTP sent to {email or phone}. Please verify to complete registration.',
        'identifier': email or phone,
        'userId': user.id
    }), 200

@auth_bp.route('/api/auth/login', methods=['POST'])
@limiter.limit("10 per minute; 50 per hour")
def login():
    data = request.get_json(silent=True) or {}
    identifier = data.get('identifier', '').strip()
    password = data.get('password', '')

    if not identifier or not password:
        return jsonify({'error': 'Identifier and password required'}), 400

    user = User.query.filter(or_(User.email == identifier, User.phone == identifier)).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({'error': 'Invalid credentials'}), 401

    if not user.is_verified:
        create_otp(identifier=user.email or user.phone, linked_user_id=user.id, purpose='registration')
        db.session.commit()
        return jsonify({
            'error': 'Account not verified. A new verification OTP has been sent.',
            'requireVerification': True,
            'userId': user.id,
            'identifier': user.email or user.phone
        }), 403

    login_user(user, remember=True)
    return jsonify({'success': True, 'message': 'Login successful'}), 200

@auth_bp.route('/api/auth/verify-registration', methods=['POST'])
def verify_registration():
    data = request.get_json(silent=True) or {}
    identifier = data.get('identifier', '').strip()
    otp_code = data.get('otpCode', '').strip()

    if not identifier or not otp_code:
        return jsonify({'error': 'Identifier and OTP code are required.'}), 400

    user = User.query.filter(or_(User.email == identifier, User.phone == identifier)).first()
    if not user:
        return jsonify({'error': 'User not found for this identifier.'}), 404

    if user.is_verified:
        return jsonify({'error': 'User is already verified. Proceed to login.'}), 400

    success, _otp = verify_otp(identifier, otp_code, purpose='registration')
    if not success:
        return jsonify({'error': 'Invalid or expired OTP code.'}), 400

    user.is_verified = True
    login_user(user, remember=True)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Registration complete and login successful!',
        'userId': user.id
    }), 200

@auth_bp.route('/api/status', methods=['GET'])
def get_user_status():
    if current_user.is_authenticated:
        return jsonify({'isAuthenticated': True, 'isAdmin': current_user.is_admin}), 200
    return jsonify({'isAuthenticated': False, 'isAdmin': False}), 200

@auth_bp.route('/api/auth/forgot-password', methods=['POST'])
@limiter.limit("5 per 15 minutes")
def forgot_password():
    data = request.get_json(silent=True) or {}
    identifier = data.get('identifier', '').strip()

    if not identifier:
        return jsonify({'error': 'Email or phone number is required.'}), 400

    user = User.query.filter(or_(User.email == identifier, User.phone == identifier)).first()
    if not user:
        return jsonify({'success': True, 'message': 'If an account exists, a reset code has been sent.'}), 200

    create_otp(identifier=identifier, linked_user_id=user.id, purpose='password_reset')
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'A verification code has been sent to your email/phone.',
        'identifier': identifier
    }), 200

@auth_bp.route('/api/auth/verify-reset-otp', methods=['POST'])
def verify_reset_otp():
    data = request.get_json(silent=True) or {}
    identifier = data.get('identifier', '').strip()
    otp_code = data.get('otpCode', '').strip()

    if not identifier or not otp_code:
        return jsonify({'error': 'Missing identifier or OTP code.'}), 400

    success, _otp = verify_otp(identifier, otp_code, purpose='password_reset')
    if not success:
        return jsonify({'error': 'Invalid, used, or expired OTP code.'}), 400

    user = User.query.filter(or_(User.email == identifier, User.phone == identifier)).first()
    if not user:
        return jsonify({'error': 'User not found.'}), 404

    reset_token = secrets.token_urlsafe(32)
    user.reset_token = reset_token
    user.reset_token_expires = datetime.utcnow() + timedelta(minutes=15)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'OTP verified. Proceed to reset your password.',
        'resetToken': reset_token,
        'identifier': identifier
    }), 200

@auth_bp.route('/api/auth/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json(silent=True) or {}
    token = data.get('resetToken', '').strip()
    new_password = data.get('newPassword', '')
    confirm_password = data.get('confirmPassword', '')

    if not all([token, new_password, confirm_password]):
        return jsonify({'error': 'Missing password or reset token.'}), 400

    if new_password != confirm_password:
        return jsonify({'error': 'Passwords do not match.'}), 400

    is_valid, msg = validate_password(new_password)
    if not is_valid:
        return jsonify({'error': msg}), 400

    user = User.query.filter_by(reset_token=token).first()
    if not user:
        return jsonify({'error': 'Invalid or expired reset token.'}), 400

    if not user.reset_token_expires or user.reset_token_expires < datetime.utcnow():
        return jsonify({'error': 'Reset token has expired. Please restart the process.'}), 400

    user.password = generate_password_hash(new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.session.commit()

    return jsonify({'success': True, 'message': 'Password reset successful. You can now log in with your new password.'}), 200

@auth_bp.route('/api/auth/resend-otp', methods=['POST'])
@limiter.limit("3 per 10 minutes")
def resend_otp():
    data = request.get_json(silent=True) or {}
    identifier = data.get('identifier', '').strip()
    purpose = data.get('purpose', 'registration').strip()

    if not identifier:
        return jsonify({'error': 'Identifier required'}), 400

    user = User.query.filter(or_(User.email == identifier, User.phone == identifier)).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    if purpose == 'registration' and user.is_verified:
        return jsonify({'message': 'User already verified. Please login.'}), 200

    create_otp(identifier=identifier, linked_user_id=user.id, purpose=purpose)
    db.session.commit()

    return jsonify({'success': True, 'message': f'OTP resent to {identifier}'}), 200

@auth_bp.route('/api/auth/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'success': True, 'message': 'Logged out successfully'}), 200

@auth_bp.route('/api/auth/current', methods=['GET'])
def current():
    if current_user.is_authenticated:
        return jsonify({
            'authenticated': True,
            'user': {
                'id': current_user.id,
                'name': current_user.name,
                'email': current_user.email,
                'phone': current_user.phone,
                'address': current_user.address,
                'is_admin': current_user.is_admin,
                'require_2fa': current_user.require_2fa,
                'is_verified': current_user.is_verified
            }
        }), 200

    return jsonify({'authenticated': False}), 200
