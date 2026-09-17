from flask import Blueprint, request, jsonify
from app import db
from models.child import Guardian
from utils.decorators import auth_required
from utils.helpers import log_audit, validate_contact_number, format_contact_number, get_current_user

guardians_bp = Blueprint('guardians', __name__)

@guardians_bp.route('', methods=['GET'])
@auth_required
def get_guardians():
    """Get all guardians"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        
        query = Guardian.query
        
        if search:
            search_pattern = f'%{search}%'
            query = query.filter(
                db.or_(
                    Guardian.full_name.like(search_pattern),
                    Guardian.contact_number.like(search_pattern)
                )
            )
        
        pagination = query.order_by(Guardian.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        guardians = [guardian.to_dict() for guardian in pagination.items]
        
        return jsonify({
            'guardians': guardians,
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@guardians_bp.route('/<int:guardian_id>', methods=['GET'])
@auth_required
def get_guardian(guardian_id):
    """Get guardian by ID"""
    try:
        guardian = Guardian.query.get(guardian_id)
        
        if not guardian:
            return jsonify({'error': 'Guardian not found'}), 404
        
        # Include children information
        children = [child.to_dict(include_guardian=False) for child in guardian.children]
        
        guardian_data = guardian.to_dict()
        guardian_data['children'] = children
        
        return jsonify({'guardian': guardian_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@guardians_bp.route('', methods=['POST'])
@auth_required
def create_guardian():
    """Create new guardian"""
    try:
        data = request.get_json()
        current_user = get_current_user()
        
        # Validate required fields
        required_fields = ['full_name', 'relationship', 'contact_number']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate contact number
        contact_number = data['contact_number'].strip()
        if not validate_contact_number(contact_number):
            return jsonify({'error': 'Invalid Philippine mobile number format'}), 400
        
        # Format contact number
        formatted_number = format_contact_number(contact_number)
        
        # Create guardian
        guardian = Guardian(
            full_name=data['full_name'].strip(),
            relationship=data['relationship'].strip(),
            contact_number=formatted_number,
            address=data.get('address', ''),
            notification_enabled=data.get('notification_enabled', True)
        )
        
        db.session.add(guardian)
        db.session.commit()
        
        # Log audit
        log_audit(current_user.user_id, 'create_guardian', 'guardians', guardian.guardian_id)
        
        return jsonify({
            'message': 'Guardian created successfully',
            'guardian': guardian.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@guardians_bp.route('/<int:guardian_id>', methods=['PUT'])
@auth_required
def update_guardian(guardian_id):
    """Update guardian"""
    try:
        guardian = Guardian.query.get(guardian_id)
        
        if not guardian:
            return jsonify({'error': 'Guardian not found'}), 404
        
        data = request.get_json()
        current_user = get_current_user()
        
        # Update fields
        if 'full_name' in data:
            guardian.full_name = data['full_name'].strip()
        if 'relationship' in data:
            guardian.relationship = data['relationship'].strip()
        if 'contact_number' in data:
            contact_number = data['contact_number'].strip()
            if not validate_contact_number(contact_number):
                return jsonify({'error': 'Invalid Philippine mobile number format'}), 400
            guardian.contact_number = format_contact_number(contact_number)
        if 'address' in data:
            guardian.address = data['address']
        if 'notification_enabled' in data:
            guardian.notification_enabled = data['notification_enabled']
        
        db.session.commit()
        
        # Log audit
        log_audit(current_user.user_id, 'update_guardian', 'guardians', guardian.guardian_id)
        
        return jsonify({
            'message': 'Guardian updated successfully',
            'guardian': guardian.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
