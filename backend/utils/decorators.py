"""
Auth decorators. Use these instead of repeating the same
`if session.get('role') != 'admin': return jsonify(...), 403` check
in every route.
"""
from functools import wraps
from flask import session, jsonify


def login_required(view_func):
    """Require any logged-in user (any role)."""
    @wraps(view_func)
    def wrapped(*args, **kwargs):
        if 'username' not in session:
            return jsonify({'error': 'Unauthorized. Please log in.'}), 401
        return view_func(*args, **kwargs)
    return wrapped


def admin_required(view_func):
    """Require the logged-in user to have role == 'admin'."""
    @wraps(view_func)
    def wrapped(*args, **kwargs):
        if session.get('role') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403
        return view_func(*args, **kwargs)
    return wrapped
