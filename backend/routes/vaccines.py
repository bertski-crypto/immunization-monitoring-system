from flask import Blueprint, request, jsonify
from app import db
from models.vaccine import Vaccine
from utils.decorators import auth_required, admin_required
from utils.helpers import log_audit, get_current_user

vaccines_bp = Blueprint('vaccines', __name__)

@vaccines_bp.route('', methods=['GET'])
@auth_required
def get_vaccines():
    """Get all vaccines"""
    try:
        status = request.args.get('status', 'active')
        
        query = Vaccine.query
        if status:
            query = query.filter_by(status=status)
        
        vaccines = query.order_by(Vaccine.vaccine_name, Vaccine.dose_number).all()
        
        return jsonify({
            'vaccines': [vaccine.to_dict() for vaccine in vaccines]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@vaccines_bp.route('/<int:vaccine_id>', methods=['GET'])
@auth_required
def get_vaccine(vaccine_id):
    """Get vaccine by ID"""
    try:
        vaccine = Vaccine.query.get(vaccine_id)
        
        if not vaccine:
            return jsonify({'error': 'Vaccine not found'}), 404
        
        return jsonify({'vaccine': vaccine.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@vaccines_bp.route('', methods=['POST'])
@admin_required
def create_vaccine():
    """Create new vaccine (admin only)"""
    try:
        data = request.get_json()
        current_user = get_current_user()
        
        # Validate required fields
        required_fields = ['vaccine_name', 'dose_number']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Create vaccine
        vaccine = Vaccine(
            vaccine_name=data['vaccine_name'].strip(),
            dose_number=data['dose_number'],
            schedule_reference=data.get('schedule_reference', ''),
            description=data.get('description', ''),
            status='active'
        )
        
        db.session.add(vaccine)
        db.session.commit()
        
        # Log audit
        log_audit(current_user.user_id, 'create_vaccine', 'vaccines', vaccine.vaccine_id)
        
        return jsonify({
            'message': 'Vaccine created successfully',
            'vaccine': vaccine.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@vaccines_bp.route('/<int:vaccine_id>', methods=['PUT'])
@admin_required
def update_vaccine(vaccine_id):
    """Update vaccine (admin only)"""
    try:
        vaccine = Vaccine.query.get(vaccine_id)
        
        if not vaccine:
            return jsonify({'error': 'Vaccine not found'}), 404
        
        data = request.get_json()
        current_user = get_current_user()
        
        # Update fields
        if 'vaccine_name' in data:
            vaccine.vaccine_name = data['vaccine_name'].strip()
        if 'dose_number' in data:
            vaccine.dose_number = data['dose_number']
        if 'schedule_reference' in data:
            vaccine.schedule_reference = data['schedule_reference']
        if 'description' in data:
            vaccine.description = data['description']
        if 'status' in data:
            vaccine.status = data['status']
        
        db.session.commit()
        
        # Log audit
        log_audit(current_user.user_id, 'update_vaccine', 'vaccines', vaccine.vaccine_id)
        
        return jsonify({
            'message': 'Vaccine updated successfully',
            'vaccine': vaccine.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
