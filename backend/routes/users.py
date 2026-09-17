from flask import Blueprint, request, jsonify
from app import db
from models.user import User
from utils.decorators import admin_required
from utils.helpers import log_audit, get_current_user

users_bp = Blueprint('users', __name__)

@users_bp.route('', methods=['GET'])
@admin_required
def get_users():
    """Get all users (admin only)"""
    try:
        users = User.query.order_by(User.created_at.desc()).all()
        return jsonify({
            'users': [user.to_dict() for user in users]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@users_bp.route('/<int:user_id>', methods=['GET'])
@admin_required
def get_user(user_id):
    """Get user by ID (admin only)"""
    try:
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({'user': user.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@users_bp.route('', methods=['POST'])
@admin_required
def create_user():
    """Create new user (admin only)"""
    try:
        data = request.get_json()
        current_user = get_current_user()
        
        # Validate required fields
        required_fields = ['full_name', 'username', 'password', 'role']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if username already exists
        existing = User.query.filter_by(username=data['username']).first()
        if existing:
            return jsonify({'error': 'Username already exists'}), 400
        
        # Validate role
        if data['role'] not in ['administrator', 'health_worker']:
            return jsonify({'error': 'Invalid role'}), 400
        
        # Create user
        user = User(
            full_name=data['full_name'].strip(),
            username=data['username'].strip(),
            role=data['role'],
            status='active'
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        # Log audit
        log_audit(current_user.user_id, 'create_user', 'users', user.user_id)
        
        return jsonify({
            'message': 'User created successfully',
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@users_bp.route('/<int:user_id>', methods=['PUT'])
@admin_required
def update_user(user_id):
    """Update user (admin only)"""
    try:
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        current_user = get_current_user()
        
        # Update fields
        if 'full_name' in data:
            user.full_name = data['full_name'].strip()
        if 'username' in data:
            # Check if username is taken by another user
            existing = User.query.filter(
                User.username == data['username'],
                User.user_id != user_id
            ).first()
            if existing:
                return jsonify({'error': 'Username already exists'}), 400
            user.username = data['username'].strip()
        if 'role' in data:
            if data['role'] not in ['administrator', 'health_worker']:
                return jsonify({'error': 'Invalid role'}), 400
            user.role = data['role']
        if 'status' in data:
            if data['status'] not in ['active', 'inactive']:
                return jsonify({'error': 'Invalid status'}), 400
            user.status = data['status']
        if 'password' in data and data['password']:
            user.set_password(data['password'])
        
        db.session.commit()
        
        # Log audit
        log_audit(current_user.user_id, 'update_user', 'users', user.user_id)
        
        return jsonify({
            'message': 'User updated successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@users_bp.route('/<int:user_id>/toggle-status', methods=['PATCH'])
@admin_required
def toggle_user_status(user_id):
    """Toggle user active/inactive status (admin only)"""
    try:
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        current_user = get_current_user()
        
        # Prevent admin from deactivating themselves
        if user.user_id == current_user.user_id:
            return jsonify({'error': 'Cannot deactivate your own account'}), 400
        
        # Toggle status
        user.status = 'inactive' if user.status == 'active' else 'active'
        db.session.commit()
        
        # Log audit
        log_audit(current_user.user_id, 'toggle_user_status', 'users', user.user_id)
        
        return jsonify({
            'message': f'User {user.status}',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
