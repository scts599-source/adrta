from functools import wraps
from flask import request, jsonify, render_template
from flask_login import current_user


def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not getattr(current_user, 'is_authenticated', False) or not getattr(current_user, 'is_admin', False):
            if request.path.startswith('/api/'):
                return jsonify({'error': 'Unauthorized - admin required'}), 403
            return render_template('index.html')
        return f(*args, **kwargs)
    return decorated
