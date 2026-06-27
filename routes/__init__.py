from .auth import auth_bp
from .user import user_bp
from .product import product_bp
from .cart import cart_bp
from .order import order_bp
from .coupons import coupons_bp
from .newsletter import newsletter_bp
from .admin import admin_bp
from .team import team_bp
from .partner import partner_bp


def register_blueprints(app):
    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(product_bp)
    app.register_blueprint(cart_bp)
    app.register_blueprint(order_bp)
    app.register_blueprint(coupons_bp)
    app.register_blueprint(newsletter_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(team_bp)
    app.register_blueprint(partner_bp)
