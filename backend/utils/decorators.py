from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from models.user import User

def admin_required(fn):
    """Decorator to require administrator role"""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user or user.status != 'active':
            return jsonify({'error': 'User account is inactive'}), 403
        
        if user.role != 'administrator':
            return jsonify({'error': 'Administrator access required'}), 403
        
        return fn(*args, **kwargs)
    return wrapper

def auth_required(fn):
    """Decorator to require authentication (any active user)"""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user or user.status != 'active':
            return jsonify({'error': 'User account is inactive'}), 403
        
        return fn(*args, **kwargs)
    return wrapper

def get_current_user():
    """Get current authenticated user"""
    current_user_id = int(get_jwt_identity())
    return User.query.get(current_user_id)
