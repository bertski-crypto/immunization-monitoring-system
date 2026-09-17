from flask import Blueprint, jsonify
from app import db
from models.child import Child
from models.vaccine import ImmunizationRecord, Vaccine
from models.assessment import AIAssessment, SMSNotification
from utils.decorators import auth_required
from datetime import date, timedelta

schedules_bp = Blueprint('schedules', __name__)

@schedules_bp.route('/upcoming', methods=['GET'])
@auth_required
def get_upcoming_vaccinations():
    """Get upcoming vaccinations (within 7 days)"""
    try:
        # This is a simplified version - actual implementation would need
        # a proper vaccine schedule table with expected dates
        today = date.today()
        upcoming_threshold = today + timedelta(days=7)
        
        # Get all active children
        children = Child.query.filter_by(status='active').all()
        
        upcoming = []
        # Logic to determine upcoming vaccinations would go here
        # For now, returning empty list - needs vaccine schedule implementation
        
        return jsonify({'upcoming': upcoming}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@schedules_bp.route('/due', methods=['GET'])
@auth_required
def get_due_vaccinations():
    """Get vaccinations that are due today"""
    try:
        # Similar to upcoming, requires vaccine schedule implementation
        due = []
        
        return jsonify({'due': due}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@schedules_bp.route('/overdue', methods=['GET'])
@auth_required
def get_overdue_vaccinations():
    """Get overdue vaccinations"""
    try:
        # Requires vaccine schedule implementation
        overdue = []
        
        return jsonify({'overdue': overdue}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@schedules_bp.route('/dashboard-stats', methods=['GET'])
@auth_required
def get_dashboard_stats():
    """Get dashboard statistics"""
    try:
        # Total children
        total_children = Child.query.filter_by(status='active').count()
        
        # Total immunization records
        total_immunizations = ImmunizationRecord.query.count()
        
        # AI assessments by risk level
        high_risk = AIAssessment.query.filter_by(risk_level='high').count()
        moderate_risk = AIAssessment.query.filter_by(risk_level='moderate').count()
        low_risk = AIAssessment.query.filter_by(risk_level='low').count()
        
        # SMS statistics
        total_sms = SMSNotification.query.count()
        sent_sms = SMSNotification.query.filter_by(delivery_status='sent').count()
        failed_sms = SMSNotification.query.filter_by(delivery_status='failed').count()
        
        # Vaccine statistics
        total_vaccines = Vaccine.query.filter_by(status='active').count()
        
        # Calculate fully immunized children (simplified - needs proper logic)
        # A child is considered fully immunized if they have received all required vaccines
        fully_immunized = 0  # Placeholder - needs proper implementation
        
        stats = {
            'total_children': total_children,
            'fully_immunized': fully_immunized,
            'total_immunizations': total_immunizations,
            'total_vaccines': total_vaccines,
            'upcoming': 0,  # Requires schedule implementation
            'due': 0,       # Requires schedule implementation
            'overdue': 0,   # Requires schedule implementation
            'high_risk': high_risk,
            'moderate_risk': moderate_risk,
            'low_risk': low_risk,
            'total_sms': total_sms,
            'sent_sms': sent_sms,
            'failed_sms': failed_sms
        }
        
        return jsonify(stats), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
