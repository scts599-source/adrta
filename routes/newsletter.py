from flask import Blueprint, request, jsonify
from models import db
from models.newsletter import Newsletter
from utils.validation import validate_email

newsletter_bp = Blueprint('newsletter_bp', __name__)


@newsletter_bp.route('/api/newsletter/subscribe', methods=['POST'])
def newsletter_subscribe():
    try:
        data = request.get_json(silent=True) or {}
        email = (data.get('email') or '').strip().lower()

        if not email or not validate_email(email):
            return jsonify({'error': 'Invalid email address'}), 400

        existing = Newsletter.query.filter_by(email=email).first()
        if existing:
            if existing.is_active:
                return jsonify({'error': 'Email already subscribed'}), 400
            existing.is_active = True
            db.session.commit()
            return jsonify({'success': True, 'message': 'Subscription reactivated!'}), 200

        subscription = Newsletter(email=email)
        db.session.add(subscription)
        db.session.commit()

        return jsonify({'success': True, 'message': 'Successfully subscribed to newsletter!'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Subscription failed. Please try again.'}), 500
