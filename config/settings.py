import os

ENVIRONMENT = os.environ.get('ENVIRONMENT', 'development')
IS_PRODUCTION = ENVIRONMENT == 'production'


def _require_env(var_name: str, default: str = None) -> str:
    """Get env var, raise in production if missing, else return default."""
    value = os.environ.get(var_name, default)
    if IS_PRODUCTION and value in (None, ''):
        raise RuntimeError(
            f"Required environment variable '{var_name}' is not set in production."
        )
    return value


class Config:
    SECRET_KEY = _require_env('SECRET_KEY')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JSON_AS_ASCII = False

    SESSION_COOKIE_SECURE = IS_PRODUCTION
    REMEMBER_COOKIE_SECURE = IS_PRODUCTION
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    REMEMBER_COOKIE_SAMESITE = 'Lax'
    SESSION_COOKIE_NAME = 'adrta_sess'

    UPLOAD_FOLDER = 'static/images/products'
    MAX_CONTENT_LENGTH = 100 * 1024 * 1024
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:5000')

    DATABASE_URL = os.environ.get('DATABASE_URL')
    if DATABASE_URL and DATABASE_URL.startswith('postgres://'):
        SQLALCHEMY_DATABASE_URI = DATABASE_URL.replace('postgres://', 'postgresql+psycopg://', 1)
    else:
        SQLALCHEMY_DATABASE_URI = DATABASE_URL or os.environ.get('SQLALCHEMY_DATABASE_URI', 'sqlite:///adrta.db')

    BREVO_API_KEY = os.environ.get('BREVO_API_KEY', '')
    BREVO_SENDER_EMAIL = os.environ.get('BREVO_SENDER_EMAIL', 'adrtashop@gmail.com')
    BREVO_TEMPLATE_ID = int(os.environ.get('BREVO_TEMPLATE_ID', 2))
    BREVO_ORDER_CONFIRMATION_TEMPLATE = int(os.environ.get('BREVO_ORDER_CONFIRMATION_TEMPLATE', 3))
    BREVO_SHIPPING_UPDATE_TEMPLATE = int(os.environ.get('BREVO_SHIPPING_UPDATE_TEMPLATE', 4))
    BREVO_DELIVERY_CONFIRMATION_TEMPLATE = int(os.environ.get('BREVO_DELIVERY_CONFIRMATION_TEMPLATE', 5))
    FAST2SMS_API_KEY = os.environ.get('FAST2SMS_API_KEY', '')

    TEAM_PORTAL_USER = _require_env('TEAM_PORTAL_USER')
    TEAM_PORTAL_PASSWORD = _require_env('TEAM_PORTAL_PASSWORD')

    RAZORPAY_KEY_ID = _require_env('RAZORPAY_KEY_ID')
    RAZORPAY_KEY_SECRET = _require_env('RAZORPAY_KEY_SECRET')

    REDIS_URL = os.environ.get('REDIS_URL', '')
