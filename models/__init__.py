from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

from .user import User
from .product import Product
from .product_variant import ProductVariant
from .cart_item import CartItem
from .order import Order
from .order_item import OrderItem
from .otp import OTP
from .coupon import Coupon
from .newsletter import Newsletter
from .admin_settings import AdminSettings
from .partner import Partner
from .partner_commission import PartnerCommission
