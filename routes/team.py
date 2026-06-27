
import os
import json
from functools import wraps
from flask import Blueprint, request, jsonify, session, render_template
from flask_login import current_user
from werkzeug.security import generate_password_hash

from config.settings import Config
from extensions import limiter
from models import db
from models.partner import Partner
from models.coupon import Coupon
from models.admin_settings import AdminSettings
from utils.mailer import get_partner_stats, process_partner_payout

team_bp = Blueprint('team_bp', __name__)


def check_team_auth(user_id, password):
    expected_user = Config.TEAM_PORTAL_USER
    expected_password = Config.TEAM_PORTAL_PASSWORD
    return user_id == expected_user and password == expected_password


def team_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('team_authenticated'):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function


@team_bp.route('/adrtateam')
def team_portal_page():
    return render_template('team_portal.html')


@team_bp.route('/api/team/login', methods=['POST'])
@limiter.limit("5 per minute")
def team_login():
    data = request.get_json(silent=True) or {}
    user_id = data.get('user_id', '').strip()
    password = data.get('password', '')
    if check_team_auth(user_id, password):
        session['team_authenticated'] = True
        session['team_user_id'] = user_id
        return jsonify({'success': True, 'message': 'Login successful'})
    return jsonify({'error': 'Invalid credentials'}), 401


@team_bp.route('/api/team/logout', methods=['POST'])
def team_logout():
    session.pop('team_authenticated', None)
    session.pop('team_user_id', None)
    return jsonify({'success': True})


@team_bp.route('/api/team/check-auth', methods=['GET'])
def check_team_auth_status():
    return jsonify({'authenticated': session.get('team_authenticated', False)})


@team_bp.route('/api/team/verify', methods=['GET'])
def verify_team_access():
    return jsonify({
        'authenticated': session.get('is_modifier', False),
        'role': 'modifier' if session.get('is_modifier') else None
    })


@team_bp.route('/api/modifier/save', methods=['POST'])
def modifier_save():
    if not session.get('is_modifier') and not (current_user.is_authenticated and current_user.is_admin):
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.get_json(silent=True) or {}
    section = data.get('section')
    settings = data.get('settings', {})
    if not section:
        return jsonify({'error': 'Section is required'}), 400
    try:
        admin_settings = AdminSettings.query.first()
        if not admin_settings:
            admin_settings = AdminSettings(
                maintenance_enabled=False,
                maintenance_message=''
            )
            db.session.add(admin_settings)
        existing = {}
        if admin_settings.maintenance_message and admin_settings.maintenance_message.startswith('{'):
            try:
                existing = json.loads(admin_settings.maintenance_message)
            except Exception:
                existing = {}
        existing[f'modifier_{section}'] = settings
        admin_settings.maintenance_message = json.dumps(existing)
        db.session.commit()
        return jsonify({'success': True, 'message': f'{section} settings saved'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to save settings', 'details': str(e)}), 500


@team_bp.route('/api/team/partners', methods=['GET'])
@team_required
def get_all_partners():
    partners = Partner.query.order_by(Partner.created_at.desc()).all()
    partner_data = []
    for partner in partners:
        stats = get_partner_stats(partner.id, visible_only=False) or {}
        partner_data.append({
            'id': partner.id,
            'full_name': partner.full_name,
            'user_id': partner.user_id,
            'coupon_code': partner.coupon_code,
            'wallet_balance': partner.actual_wallet_balance,
            'lifetime_earnings': partner.actual_lifetime_earnings,
            'total_sales': stats.get('total_sales', 0),
            'visible_sales': sum(c['commission'] for c in stats.get('sales_history', []) if c['visible']),
            'hidden_sales': sum(c['commission'] for c in stats.get('sales_history', []) if not c['visible']),
            'is_active': partner.is_active,
            'created_at': partner.created_at.strftime('%Y-%m-%d') if partner.created_at else None
        })
    return jsonify({'partners': partner_data})


@team_bp.route('/api/team/partners/create', methods=['POST'])
@team_required
def create_partner():
    data = request.get_json(silent=True) or {}
    full_name = data.get('full_name', '').strip()
    user_id = data.get('user_id', '').strip()
    password = data.get('password', '').strip()
    coupon_code = data.get('coupon_code', '').strip().upper()
    if not all([full_name, user_id, password, coupon_code]):
        return jsonify({'error': 'All fields are required'}), 400
    if Partner.query.filter_by(user_id=user_id).first():
        return jsonify({'error': 'User ID already exists'}), 400
    if Coupon.query.filter_by(code=coupon_code).first():
        return jsonify({'error': 'Coupon code already exists'}), 400
    partner = Partner(
        full_name=full_name,
        user_id=user_id,
        password_hash=generate_password_hash(password),
        coupon_code=coupon_code,
        is_active=True
    )
    db.session.add(partner)
    db.session.flush()
    coupon = Coupon(
        code=coupon_code,
        type='percentage',
        value=5,
        min_subtotal=0,
        max_uses=999999,
        used_count=0,
        active=True,
        partner_id=partner.id
    )
    db.session.add(coupon)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Partner created successfully', 'partner': {
        'id': partner.id,
        'full_name': partner.full_name,
        'user_id': partner.user_id,
        'coupon_code': partner.coupon_code
    }})


@team_bp.route('/api/team/partners/<int:partner_id>', methods=['DELETE'])
@team_required
def delete_partner(partner_id):
    partner = Partner.query.get(partner_id)
    if not partner:
        return jsonify({'error': 'Partner not found'}), 404
    partner.is_active = False
    coupon = Coupon.query.filter_by(code=partner.coupon_code).first()
    if coupon:
        coupon.active = False
    db.session.commit()
    return jsonify({'success': True, 'message': 'Partner suspended successfully'})


@team_bp.route('/api/team/partners/<int:partner_id>/payout', methods=['POST'])
@team_required
def mark_partner_paid(partner_id):
    if process_partner_payout(partner_id):
        return jsonify({'success': True, 'message': 'Payout marked successfully'})
    return jsonify({'error': 'Failed to process payout'}), 500
