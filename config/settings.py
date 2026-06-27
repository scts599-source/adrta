import os

ENVIRONMENT = os.environ.get('ENVIRONMENT', 'development')
IS_PRODUCTION = ENVIRONMENT == 'production'




class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production-12345678901234567890')
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

    DATABASE_URL = os.environ.get('DATABASE_URL', '')
    if DATABASE_URL and DATABASE_URL.startswith('postgres://'):
        db_uri = DATABASE_URL.replace('postgres://', 'postgresql+psycopg://', 1)
    else:
        db_uri = DATABASE_URL or os.environ.get('SQLALCHEMY_DATABASE_URI', 'sqlite:///adrta.db')
    SQLALCHEMY_DATABASE_URI = db_uri

    BREVO_API_KEY = os.environ.get('BREVO_API_KEY', '')
    BREVO_SENDER_EMAIL = os.environ.get('BREVO_SENDER_EMAIL', 'adrtashop@gmail.com')
    BREVO_TEMPLATE_ID = int(os.environ.get('BREVO_TEMPLATE_ID', 2))
    BREVO_ORDER_CONFIRMATION_TEMPLATE = int(os.environ.get('BREVO_ORDER_CONFIRMATION_TEMPLATE', 3))
    BREVO_SHIPPING_UPDATE_TEMPLATE = int(os.environ.get('BREVO_SHIPPING_UPDATE_TEMPLATE', 4))
    BREVO_DELIVERY_CONFIRMATION_TEMPLATE = int(os.environ.get('BREVO_DELIVERY_CONFIRMATION_TEMPLATE', 5))
    FAST2SMS_API_KEY = os.environ.get('FAST2SMS_API_KEY', '')

    TEAM_PORTAL_USER = os.environ.get('TEAM_PORTAL_USER', 'admin')
    TEAM_PORTAL_PASSWORD = os.environ.get('TEAM_PORTAL_PASSWORD', 'admin123')

    RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', '')
    RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', '')

    REDIS_URL = os.environ.get('REDIS_URL', '')
