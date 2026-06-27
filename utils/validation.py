import re

EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
PHONE_REGEX = re.compile(r'^[6-9]\d{9}$')
# Unicode-aware name regex: supports letters, marks, numbers, spaces, hyphens, dots, apostrophes from any script
NAME_REGEX = re.compile(r'^[\w\s\-\.\'\’]{1,100}$', re.UNICODE)


def validate_email(email):
    if not email or not isinstance(email, str):
        return False
    return EMAIL_REGEX.match(email) is not None


def validate_phone(phone):
    if not phone or not isinstance(phone, str):
        return False
    return PHONE_REGEX.match(phone) is not None


def validate_name(name):
    if not name or not isinstance(name, str) or len(name) > 100:
        return False
    name = name.strip()
    if not name:
        return False
    if len(name) < 2:
        return False
    return NAME_REGEX.match(name) is not None


def validate_password(password):
    if not password or not isinstance(password, str):
        return False, 'Password is required'
    if len(password) < 8:
        return False, 'Password must be at least 8 characters long'
    if not re.search(r'[A-Z]', password):
        return False, 'Password must contain at least one uppercase letter'
    if not re.search(r'[a-z]', password):
        return False, 'Password must contain at least one lowercase letter'
    if not re.search(r'\d', password):
        return False, 'Password must contain at least one number'
    return True, 'Password is valid'
