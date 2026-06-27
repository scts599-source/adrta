import os
import json
import random
import traceback
from datetime import datetime, timedelta
import requests
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
from werkzeug.security import check_password_hash
from models import db
from models.otp import OTP
from models.user import User
from models.order import Order
from models.order_item import OrderItem
from models.coupon import Coupon
from models.partner import Partner
from models.partner_commission import PartnerCommission

from config.settings import Config
from utils.validation import validate_email, validate_phone


def get_mail_client():
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = Config.BREVO_API_KEY
    return sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))


def send_email_otp(recipient_email, otp_code, purpose):
    if not Config.BREVO_API_KEY:
        raise Exception('Brevo API key is missing.')

    mail_client = get_mail_client()
    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
        to=[{'email': recipient_email}],
        sender={'email': Config.BREVO_SENDER_EMAIL, 'name': 'ADRTA'},
        template_id=Config.BREVO_TEMPLATE_ID,
        params={
            'otp_code': otp_code,
            'purpose': purpose
        }
    )
    try:
        mail_client.send_transac_email(send_smtp_email)
        return True
    except ApiException as e:
        raise


def send_sms_otp(phone, otp, purpose='verification'):
    if not Config.FAST2SMS_API_KEY:
        return False

    url = 'https://www.fast2sms.com/dev/bulkV2'
    payload = {
        'variables_values': str(otp),
        'route': 'otp',
        'numbers': str(phone)
    }
    headers = {
        'authorization': Config.FAST2SMS_API_KEY,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        result = response.json()
        return bool(result.get('return'))
    except Exception:
        return False


def create_otp(identifier, linked_user_id=None, purpose='registration'):
    email = identifier if validate_email(identifier) else None
    phone = identifier if validate_phone(identifier) else None

    if not email and not phone:
        raise ValueError('Identifier must be a valid email or a valid mobile number.')

    OTP.query.filter(
        (OTP.email == email) | (OTP.phone == phone),
        OTP.purpose == purpose,
        OTP.is_used == False
    ).delete()

    otp_code = ''.join(random.choices('0123456789', k=6))
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    new_otp = OTP(
        user_id=linked_user_id,
        email=email,
        phone=phone,
        otp_code=otp_code,
        purpose=purpose,
        is_used=False,
        expires_at=expires_at,
        created_at=datetime.utcnow()
    )
    db.session.add(new_otp)
    db.session.flush()

    if email:
        send_email_otp(email, otp_code, purpose)
    elif phone:
        sent = send_sms_otp(phone, otp_code, purpose)
        if not sent:
            raise Exception('SMS system failed to send OTP.')

    return new_otp, otp_code


def verify_otp(identifier, otp_code, purpose):
    try:
        otp = OTP.query.filter(
            (OTP.email == identifier) | (OTP.phone == identifier),
            OTP.otp_code == otp_code,
            OTP.purpose == purpose,
            OTP.is_used == False,
            OTP.expires_at > datetime.utcnow()
        ).order_by(OTP.created_at.desc()).first()

        if otp:
            otp.is_used = True
            db.session.commit()
            return True, otp
        return False, None
    except Exception:
        db.session.rollback()
        return False, None


def compress_image_base64(base64_string, max_size_kb=500, quality=80):
    try:
        from PIL import Image
        from io import BytesIO
        import base64

        if ',' in base64_string:
            base64_string = base64_string.split(',', 1)[1]

        decoded = base64.b64decode(base64_string)
        with Image.open(BytesIO(decoded)) as image:
            image_format = image.format or 'JPEG'
            output = BytesIO()
            image.save(output, format=image_format, quality=quality, optimize=True)
            compressed_bytes = output.getvalue()

        if len(compressed_bytes) > max_size_kb * 1024:
            with Image.open(BytesIO(compressed_bytes)) as image:
                scale_ratio = (max_size_kb * 1024) / len(compressed_bytes)
                if scale_ratio < 1:
                    new_width = int(image.width * scale_ratio ** 0.5)
                    new_height = int(image.height * scale_ratio ** 0.5)
                    image = image.resize((max(1, new_width), max(1, new_height)), Image.LANCZOS)
                    output = BytesIO()
                    image.save(output, format=image_format, quality=max(10, int(quality * scale_ratio)), optimize=True)
                    compressed_bytes = output.getvalue()

        return f"data:image/{image_format.lower()};base64,{base64.b64encode(compressed_bytes).decode('utf-8')}"
    except Exception:
        return base64_string


def send_cod_order_email(order_id):
    order = Order.query.get(order_id)
    if not order:
        return False

    items_list = []
    subtotal = 0
    for item in order.items:
        item_total = (item.unit_price or 0) * (item.quantity or 0)
        subtotal += item_total
        items_list.append({
            'name': item.product_name or 'Product',
            'size': item.selected_size or 'N/A',
            'color': item.variant_info or 'N/A',
            'quantity': item.quantity,
            'unit_price': item.unit_price,
            'total_price': item_total
        })

    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = Config.BREVO_API_KEY
    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))

    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
        to=[{'email': order.email, 'name': order.customer_name}],
        sender={'email': Config.BREVO_SENDER_EMAIL, 'name': 'ADRTA'},
        template_id=6,
        params={
            'customer_name': order.customer_name or 'Valued Customer',
            'order_id': order.id,
            'order_date': order.created_at.strftime('%B %d, %Y') if order.created_at else 'N/A',
            'payment_method': 'Cash on Delivery (COD)',
            'items': items_list,
            'subtotal': f'{subtotal:.2f}',
            'shipping': f'{order.shipping or 0:.2f}',
            'discount': f'{order.discount or 0:.2f}',
            'cod_fee': '0.00',
            'total_amount': f'{order.total_amount or 0:.2f}',
            'phone': order.phone or 'N/A',
            'email': order.email or 'N/A',
            'address': order.address or 'N/A',
            'confirmation_time': '24-48 hours'
        }
    )

    try:
        api_instance.send_transac_email(send_smtp_email)
        return True
    except Exception:
        return False


def send_order_confirmation_email(order_id):
    order = Order.query.get(order_id)
    if not order:
        return False

    items_list = []
    subtotal = 0
    for item in order.items:
        item_total = (item.unit_price or 0) * (item.quantity or 0)
        subtotal += item_total
        items_list.append({
            'name': item.product_name or 'Product',
            'size': item.selected_size or 'N/A',
            'color': item.variant_info or 'N/A',
            'quantity': item.quantity,
            'unit_price': item.unit_price,
            'total_price': item_total
        })

    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = Config.BREVO_API_KEY
    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))

    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
        to=[{'email': order.email, 'name': order.customer_name}],
        sender={'email': Config.BREVO_SENDER_EMAIL, 'name': 'ADRTA'},
        template_id=Config.BREVO_ORDER_CONFIRMATION_TEMPLATE,
        params={
            'customer_name': order.customer_name or 'Valued Customer',
            'order_id': order.id,
            'order_date': order.created_at.strftime('%B %d, %Y') if order.created_at else 'N/A',
            'payment_method': order.payment_method or 'Online Payment',
            'items': items_list,
            'subtotal': f'{subtotal:.2f}',
            'shipping': f'{order.shipping or 0:.2f}',
            'discount': f'{order.discount or 0:.2f}',
            'total_amount': f'{order.total_amount or 0:.2f}',
            'phone': order.phone or 'N/A',
            'email': order.email or 'N/A',
            'address': order.address or 'N/A'
        }
    )

    try:
        api_instance.send_transac_email(send_smtp_email)
        return True
    except Exception:
        return False


def send_shipping_update_email(order_id, tracking_id, expected_delivery_days=5):
    order = Order.query.get(order_id)
    if not order:
        return False

    items_list = []
    for item in order.items:
        items_list.append({
            'name': item.product_name or 'Product',
            'size': item.selected_size or 'N/A',
            'color': item.variant_info or 'N/A',
            'quantity': item.quantity,
            'unit_price': item.unit_price,
            'total_price': (item.unit_price or 0) * (item.quantity or 0)
        })

    shipped_date = datetime.utcnow()
    expected_delivery = shipped_date + timedelta(days=expected_delivery_days)

    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = Config.BREVO_API_KEY
    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))

    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
        to=[{'email': order.email, 'name': order.customer_name}],
        sender={'email': Config.BREVO_SENDER_EMAIL, 'name': 'ADRTA'},
        template_id=Config.BREVO_SHIPPING_UPDATE_TEMPLATE,
        params={
            'customer_name': order.customer_name,
            'order_id': order.id,
            'tracking_id': tracking_id,
            'shipped_date': shipped_date.strftime('%B %d, %Y'),
            'expected_delivery': expected_delivery.strftime('%B %d, %Y'),
            'items': items_list,
            'subtotal': f'{order.subtotal or 0:.2f}',
            'total_amount': f'{order.total_amount or 0:.2f}',
            'phone': order.phone or 'N/A',
            'address': order.address or 'N/A',
            'tracking_url': f'https://adrta.onrender.com/track/{tracking_id}'
        }
    )

    try:
        api_instance.send_transac_email(send_smtp_email)
        return True
    except Exception:
        return False


def send_delivery_confirmation_email(order_id):
    order = Order.query.get(order_id)
    if not order:
        return False

    items_list = []
    for item in order.items:
        items_list.append({
            'name': item.product_name or 'Product',
            'size': item.selected_size or 'N/A',
            'color': item.variant_info or 'N/A',
            'quantity': item.quantity,
            'unit_price': item.unit_price,
            'total_price': (item.unit_price or 0) * (item.quantity or 0)
        })

    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = Config.BREVO_API_KEY
    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))

    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
        to=[{'email': order.email, 'name': order.customer_name}],
        sender={'email': Config.BREVO_SENDER_EMAIL, 'name': 'ADRTA'},
        template_id=Config.BREVO_DELIVERY_CONFIRMATION_TEMPLATE,
        params={
            'customer_name': order.customer_name,
            'order_id': order.id,
            'items': items_list,
            'subtotal': f'{order.subtotal or 0:.2f}',
            'total_amount': f'{order.total_amount or 0:.2f}',
            'phone': order.phone or 'N/A',
            'address': order.address or 'N/A'
        }
    )

    try:
        api_instance.send_transac_email(send_smtp_email)
        return True
    except Exception:
        return False


def calculate_partner_commission(order_id):
    order = Order.query.get(order_id)
    if not order:
        return None

    partner_coupon = Coupon.query.filter_by(code=order.coupon_code, active=True).first() if order.coupon_code else None
    if not partner_coupon or not partner_coupon.partner_id:
        return None

    partner = Partner.query.get(partner_coupon.partner_id)
    if not partner:
        return None

    commission_amount = int((order.total_amount or 0) * 0.05)
    partner.wallet_balance = (partner.wallet_balance or 0) + commission_amount
    partner.actual_wallet_balance = (partner.actual_wallet_balance or 0) + commission_amount
    partner.lifetime_earnings = (partner.lifetime_earnings or 0) + commission_amount
    partner.actual_lifetime_earnings = (partner.actual_lifetime_earnings or 0) + commission_amount

    commission_record = PartnerCommission(
        partner_id=partner.id,
        order_id=order.id,
        commission_amount=commission_amount,
        visible_to_partner=False,
        order_subtotal=order.subtotal or 0,
        commission_rate=5.0
    )
    db.session.add(commission_record)
    db.session.commit()
    return commission_record


def process_partner_payout(partner_id):
    partner = Partner.query.get(partner_id)
    if not partner or not partner.is_active:
        return False

    partner.wallet_balance = 0
    db.session.commit()
    return True


def get_partner_stats(partner_id, visible_only=True):
    partner = Partner.query.get(partner_id)
    if not partner:
        return None

    query = PartnerCommission.query.filter_by(partner_id=partner_id)
    if visible_only:
        query = query.filter_by(visible_to_partner=True)

    commissions = query.order_by(PartnerCommission.created_at.desc()).all()
    total_sales = sum(c.commission_amount for c in commissions)
    return {
        'total_sales': total_sales,
        'sales_history': [
            {
                'date': c.created_at.strftime('%Y-%m-%d'),
                'commission': c.commission_amount,
                'order_id': c.order_id,
                'visible': c.visible_to_partner
            }
            for c in commissions
        ]
    }


def check_partner_auth(user_id, password):
    partner = Partner.query.filter_by(user_id=user_id, is_active=True).first()
    if partner and check_password_hash(partner.password_hash, password):
        return partner
    return None
