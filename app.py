from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
import os
import sys

if sys.version_info[0] >= 3:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

from extensions import limiter, login_manager, db


def create_app(config_object=None):
    """Application factory. Pass a config object or leave None to use env-driven Config."""
    from config.settings import Config
    from models import User
    from routes import register_blueprints

    app = Flask(__name__, template_folder='.')

    # Load config
    cfg = config_object or Config
    app.config.from_object(cfg)

    # Ensure upload folder exists
    upload_folder = app.config.get('UPLOAD_FOLDER', 'static/images/products')
    app.config['UPLOAD_FOLDER'] = upload_folder
    os.makedirs(upload_folder, exist_ok=True)

    # Initialize extensions
    CORS(app, supports_credentials=True,
         resources={r"/api/*": {"origins": app.config['CORS_ORIGINS']}})
    db.init_app(app)
    limiter.init_app(app)
    limiter.storage_uri = os.environ.get('REDIS_URL', 'memory://')

    login_manager.init_app(app)
    login_manager.login_view = 'auth_bp.login'
    login_manager.session_protection = 'strong'

    # Register all blueprints
    register_blueprints(app)

    # ── User loader ────────────────────────────────────────────
    @login_manager.user_loader
    def load_user(user_id):
        if not user_id:
            return None
        try:
            return User.query.get(int(user_id))
        except (ValueError, TypeError):
            return None

    # ── Unauthorized handler ───────────────────────────────────
    @login_manager.unauthorized_handler
    def handle_unauthorized():
        if request.path.startswith('/api/'):
            return jsonify({'error': 'Unauthorized access. Please log in.', 'status': 401}), 401
        return render_template('index.html'), 401

    # ── Error handlers ─────────────────────────────────────────
    @app.errorhandler(404)
    def handle_404(error):
        if request.path.startswith('/api/'):
            return jsonify({'error': 'Not found'}), 404
        return render_template('index.html')

    @app.errorhandler(500)
    def handle_500(error):
        if request.path.startswith('/api/'):
            return jsonify({'error': 'Internal server error'}), 500
        return render_template('index.html'), 500

    @app.errorhandler(429)
    def handle_429(error):
        return jsonify({'error': 'Too many requests. Please slow down.'}), 429

    # ── SPA catch-all ──────────────────────────────────────────
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_frontend(path):
        return render_template('index.html')

    return app


# ── Entry point ────────────────────────────────────────────────
if __name__ == '__main__':
    app = create_app()
    debug_mode = os.environ.get('FLASK_DEBUG', '0') in ['1', 'true', 'True', 'yes', 'on']
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=debug_mode)