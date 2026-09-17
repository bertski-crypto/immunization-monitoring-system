from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from models.child import Child, Guardian
from utils.decorators import auth_required
from utils.helpers import log_audit, generate_child_code, get_current_user
from datetime import datetime

children_bp = Blueprint('children', __name__)

@children_bp.route('', methods=['GET'])
@auth_required
def get_children():
    """Get all children with optional filtering"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status = request.args.get('status', 'active')
        search = request.args.get('search', '')
        
        query = Child.query.filter_by(status=status)
        
        if search:
            search_pattern = f'%{search}%'
            query = query.filter(
                db.or_(
                    Child.first_name.like(search_pattern),
                    Child.last_name.like(search_pattern),
                    Child.child_code.like(search_pattern)
                )
            )
        
        pagination = query.order_by(Child.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        children = [child.to_dict() for child in pagination.items]
        
        return jsonify({
            'children': children,
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@children_bp.route('/<int:child_id>', methods=['GET'])
@auth_required
def get_child(child_id):
    """Get child by ID"""
    try:
        child = Child.query.get(child_id)
        
        if not child:
            return jsonify({'error': 'Child not found'}), 404
        
        return jsonify({'child': child.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@children_bp.route('', methods=['POST'])
@auth_required
def create_child():
    """Create new child record"""
    try:
        data = request.get_json()
        current_user = get_current_user()
        
        # Validate required fields
        required_fields = ['first_name', 'last_name', 'birth_date', 'sex', 'guardian_id']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if guardian exists
        guardian = Guardian.query.get(data['guardian_id'])
        if not guardian:
            return jsonify({'error': 'Guardian not found'}), 404
        
        # Generate unique child code
        child_code = generate_child_code()
        
        # Create child
        child = Child(
            child_code=child_code,
            first_name=data['first_name'].strip(),
            middle_name=data.get('middle_name', '').strip(),
            last_name=data['last_name'].strip(),
            birth_date=datetime.strptime(data['birth_date'], '%Y-%m-%d').date(),
            sex=data['sex'],
            address=data.get('address', ''),
            guardian_id=data['guardian_id'],
            status='active'
        )
        
        db.session.add(child)
        db.session.commit()
        
        # Log audit
        log_audit(current_user.user_id, 'create_child', 'children', child.child_id)
        
        return jsonify({
            'message': 'Child registered successfully',
            'child': child.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@children_bp.route('/<int:child_id>', methods=['PUT'])
@auth_required
def update_child(child_id):
    """Update child record"""
    try:
        child = Child.query.get(child_id)
        
        if not child:
            return jsonify({'error': 'Child not found'}), 404
        
        data = request.get_json()
        current_user = get_current_user()
        
        # Update fields
        if 'first_name' in data:
            child.first_name = data['first_name'].strip()
        if 'middle_name' in data:
            child.middle_name = data['middle_name'].strip()
        if 'last_name' in data:
            child.last_name = data['last_name'].strip()
        if 'birth_date' in data:
            child.birth_date = datetime.strptime(data['birth_date'], '%Y-%m-%d').date()
        if 'sex' in data:
            child.sex = data['sex']
        if 'address' in data:
            child.address = data['address']
        if 'guardian_id' in data:
            # Verify guardian exists
            guardian = Guardian.query.get(data['guardian_id'])
            if not guardian:
                return jsonify({'error': 'Guardian not found'}), 404
            child.guardian_id = data['guardian_id']
        
        db.session.commit()
        
        # Log audit
        log_audit(current_user.user_id, 'update_child', 'children', child.child_id)
        
        return jsonify({
            'message': 'Child updated successfully',
            'child': child.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@children_bp.route('/<int:child_id>/archive', methods=['PATCH'])
@auth_required
def archive_child(child_id):
    """Archive child record"""
    try:
        child = Child.query.get(child_id)
        
        if not child:
            return jsonify({'error': 'Child not found'}), 404
        
        current_user = get_current_user()
        child.status = 'archived'
        db.session.commit()
        
        # Log audit
        log_audit(current_user.user_id, 'archive_child', 'children', child.child_id)
        
        return jsonify({'message': 'Child archived successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@children_bp.route('/<int:child_id>/immunization-history', methods=['GET'])
@auth_required
def get_immunization_history(child_id):
    """Get immunization history for a child"""
    try:
        child = Child.query.get(child_id)
        
        if not child:
            return jsonify({'error': 'Child not found'}), 404
        
        records = child.immunization_records.order_by('date_administered').all()
        history = [record.to_dict() for record in records]
        
        return jsonify({'history': history}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
