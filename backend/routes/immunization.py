from flask import Blueprint, request, jsonify
from app import db
from models.vaccine import ImmunizationRecord, Vaccine
from models.child import Child
from utils.decorators import auth_required
from utils.helpers import log_audit, get_current_user
from datetime import datetime

immunization_bp = Blueprint('immunization', __name__)

@immunization_bp.route('', methods=['GET'])
@auth_required
def get_immunization_records():
    """Get all immunization records with filtering"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        child_id = request.args.get('child_id', type=int)
        vaccine_id = request.args.get('vaccine_id', type=int)
        
        query = ImmunizationRecord.query
        
        if child_id:
            query = query.filter_by(child_id=child_id)
        if vaccine_id:
            query = query.filter_by(vaccine_id=vaccine_id)
        
        pagination = query.order_by(ImmunizationRecord.date_administered.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        records = [record.to_dict() for record in pagination.items]
        
        return jsonify({
            'records': records,
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@immunization_bp.route('/<int:record_id>', methods=['GET'])
@auth_required
def get_immunization_record(record_id):
    """Get immunization record by ID"""
    try:
        record = ImmunizationRecord.query.get(record_id)
        
        if not record:
            return jsonify({'error': 'Immunization record not found'}), 404
        
        return jsonify({'record': record.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@immunization_bp.route('', methods=['POST'])
@auth_required
def create_immunization_record():
    """Create new immunization record"""
    try:
        data = request.get_json()
        current_user = get_current_user()
        
        # Validate required fields
        required_fields = ['child_id', 'vaccine_id', 'date_administered']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Verify child exists
        child = Child.query.get(data['child_id'])
        if not child:
            return jsonify({'error': 'Child not found'}), 404
        
        # Verify vaccine exists
        vaccine = Vaccine.query.get(data['vaccine_id'])
        if not vaccine:
            return jsonify({'error': 'Vaccine not found'}), 404
        
        # Parse date
        date_administered = datetime.strptime(data['date_administered'], '%Y-%m-%d').date()
        
        # Check if this vaccination already exists
        existing = ImmunizationRecord.query.filter_by(
            child_id=data['child_id'],
            vaccine_id=data['vaccine_id']
        ).first()
        
        if existing:
            return jsonify({'error': 'This vaccination has already been recorded for this child'}), 400
        
        # Create immunization record
        record = ImmunizationRecord(
            child_id=data['child_id'],
            vaccine_id=data['vaccine_id'],
            date_administered=date_administered,
            recorded_by=current_user.user_id,
            remarks=data.get('remarks', '')
        )
        
        db.session.add(record)
        db.session.commit()
        
        # Log audit
        log_audit(current_user.user_id, 'create_immunization', 'immunization', record.record_id)
        
        return jsonify({
            'message': 'Immunization record created successfully',
            'record': record.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@immunization_bp.route('/<int:record_id>', methods=['PUT'])
@auth_required
def update_immunization_record(record_id):
    """Update immunization record"""
    try:
        record = ImmunizationRecord.query.get(record_id)
        
        if not record:
            return jsonify({'error': 'Immunization record not found'}), 404
        
        data = request.get_json()
        current_user = get_current_user()
        
        # Update fields
        if 'date_administered' in data:
            record.date_administered = datetime.strptime(data['date_administered'], '%Y-%m-%d').date()
        if 'remarks' in data:
            record.remarks = data['remarks']
        
        db.session.commit()
        
        # Log audit
        log_audit(current_user.user_id, 'update_immunization', 'immunization', record.record_id)
        
        return jsonify({
            'message': 'Immunization record updated successfully',
            'record': record.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@immunization_bp.route('/<int:record_id>', methods=['DELETE'])
@auth_required
def delete_immunization_record(record_id):
    """Delete immunization record"""
    try:
        record = ImmunizationRecord.query.get(record_id)
        
        if not record:
            return jsonify({'error': 'Immunization record not found'}), 404
        
        current_user = get_current_user()
        
        db.session.delete(record)
        db.session.commit()
        
        # Log audit
        log_audit(current_user.user_id, 'delete_immunization', 'immunization', record_id)
        
        return jsonify({'message': 'Immunization record deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
