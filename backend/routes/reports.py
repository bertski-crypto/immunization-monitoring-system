from flask import Blueprint, request, jsonify
from utils.decorators import auth_required
from models.child import Child
from models.vaccine import ImmunizationRecord, Vaccine
from models.assessment import AIAssessment, SMSNotification
from datetime import datetime, timedelta

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/children', methods=['GET'])
@auth_required
def children_report():
    """Generate children registration report"""
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        query = Child.query.filter_by(status='active')
        
        if start_date:
            query = query.filter(Child.created_at >= datetime.strptime(start_date, '%Y-%m-%d'))
        if end_date:
            query = query.filter(Child.created_at <= datetime.strptime(end_date, '%Y-%m-%d'))
        
        children = query.all()
        
        return jsonify({
            'total': len(children),
            'children': [child.to_dict() for child in children]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/immunization', methods=['GET'])
@auth_required
def immunization_report():
    """Generate immunization report"""
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        vaccine_id = request.args.get('vaccine_id', type=int)
        
        query = ImmunizationRecord.query
        
        if start_date:
            query = query.filter(ImmunizationRecord.date_administered >= datetime.strptime(start_date, '%Y-%m-%d').date())
        if end_date:
            query = query.filter(ImmunizationRecord.date_administered <= datetime.strptime(end_date, '%Y-%m-%d').date())
        if vaccine_id:
            query = query.filter_by(vaccine_id=vaccine_id)
        
        records = query.all()
        
        return jsonify({
            'total': len(records),
            'records': [record.to_dict() for record in records]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/ai-assessment', methods=['GET'])
@auth_required
def ai_assessment_report():
    """Generate AI assessment report"""
    try:
        risk_level = request.args.get('risk_level')
        
        query = AIAssessment.query
        
        if risk_level:
            query = query.filter_by(risk_level=risk_level)
        
        assessments = query.order_by(AIAssessment.assessment_date.desc()).all()
        
        # Count by risk level
        risk_counts = {
            'high': AIAssessment.query.filter_by(risk_level='high').count(),
            'moderate': AIAssessment.query.filter_by(risk_level='moderate').count(),
            'low': AIAssessment.query.filter_by(risk_level='low').count()
        }
        
        return jsonify({
            'total': len(assessments),
            'risk_counts': risk_counts,
            'assessments': [assessment.to_dict(include_child=True) for assessment in assessments]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/sms', methods=['GET'])
@auth_required
def sms_report():
    """Generate SMS notification report"""
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        query = SMSNotification.query
        
        if start_date:
            query = query.filter(SMSNotification.sent_at >= datetime.strptime(start_date, '%Y-%m-%d'))
        if end_date:
            query = query.filter(SMSNotification.sent_at <= datetime.strptime(end_date, '%Y-%m-%d'))
        
        notifications = query.all()
        
        # Count by status
        status_counts = {
            'sent': SMSNotification.query.filter_by(delivery_status='sent').count(),
            'delivered': SMSNotification.query.filter_by(delivery_status='delivered').count(),
            'failed': SMSNotification.query.filter_by(delivery_status='failed').count(),
            'pending': SMSNotification.query.filter_by(delivery_status='pending').count()
        }
        
        return jsonify({
            'total': len(notifications),
            'status_counts': status_counts,
            'notifications': [sms.to_dict() for sms in notifications]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
