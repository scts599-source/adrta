from functools import wraps
from flask import Blueprint, request, jsonify, session, render_template
from models.partner import Partner
from utils.mailer import check_partner_auth, get_partner_stats

partner_bp = Blueprint('partner_bp', __name__)


def partner_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('partner_authenticated'):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function


@partner_bp.route('/adrtapartners')
def partner_portal_page():
    return render_template('partner_portal.html')


@partner_bp.route('/api/partner/login', methods=['POST'])
def partner_login():
    data = request.get_json(silent=True) or {}
    user_id = data.get('user_id', '').strip()
    password = data.get('password', '')

    partner = check_partner_auth(user_id, password)
    if partner:
        session['partner_authenticated'] = True
        session['partner_id'] = partner.id
        session['partner_user_id'] = partner.user_id
        return jsonify({'success': True, 'message': 'Login successful', 'partner_name': partner.full_name})

    return jsonify({'error': 'Invalid credentials or account suspended'}), 401


@partner_bp.route('/api/partner/logout', methods=['POST'])
def partner_logout():
    session.pop('partner_authenticated', None)
    session.pop('partner_id', None)
    session.pop('partner_user_id', None)
    return jsonify({'success': True})


@partner_bp.route('/api/partner/check-auth', methods=['GET'])
def check_partner_auth_status():
    return jsonify({
        'authenticated': session.get('partner_authenticated', False),
        'partner_id': session.get('partner_id')
    })


@partner_bp.route('/api/partner/dashboard', methods=['GET'])
@partner_required
def get_partner_dashboard():
    partner_id = session.get('partner_id')
    partner = Partner.query.get(partner_id)
    if not partner:
        return jsonify({'error': 'Partner not found'}), 404

    stats = get_partner_stats(partner_id, visible_only=True) or {}
    return jsonify({
        'partner_name': partner.full_name,
        'coupon_code': partner.coupon_code,
        'wallet_balance': partner.wallet_balance,
        'lifetime_earnings': partner.lifetime_earnings,
        'total_sales': stats.get('total_sales', 0),
        'sales_history': stats.get('sales_history', [])
    })
