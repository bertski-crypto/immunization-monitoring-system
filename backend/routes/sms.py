from flask import Blueprint, request, jsonify
from app import db
from models.assessment import SMSNotification
from models.child import Child, Guardian
from utils.decorators import auth_required
from utils.helpers import log_audit, get_current_user
from datetime import datetime

sms_bp = Blueprint('sms', __name__)

@sms_bp.route('/send', methods=['POST'])
@auth_required
def send_sms():
    """Send SMS notification"""
    try:
        data = request.get_json()
        current_user = get_current_user()
        
        # Validate required fields
        required_fields = ['child_id', 'notification_type', 'message']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Get child and guardian
        child = Child.query.get(data['child_id'])
        if not child:
            return jsonify({'error': 'Child not found'}), 404
        
        guardian = child.guardian
        if not guardian:
            return jsonify({'error': 'Guardian not found for this child'}), 404
        
        if not guardian.notification_enabled:
            return jsonify({'error': 'Notifications are disabled for this guardian'}), 400
        
        # Import SMS service
        from services.sms_service import send_sms_notification
        
        # Send SMS
        result = send_sms_notification(
            recipient_number=guardian.contact_number,
            message=data['message']
        )
        
        # Create SMS log
        sms = SMSNotification(
            child_id=child.child_id,
            guardian_id=guardian.guardian_id,
            recipient_number=guardian.contact_number,
            notification_type=data['notification_type'],
            message=data['message'],
            delivery_status=result.get('status', 'pending'),
            provider_message_id=result.get('message_id'),
            error_message=result.get('error')
        )
        
        db.session.add(sms)
        db.session.commit()
        
        # Log audit
        log_audit(current_user.user_id, 'send_sms', 'sms', sms.sms_id)
        
        return jsonify({
            'message': 'SMS sent successfully',
            'sms': sms.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@sms_bp.route('/logs', methods=['GET'])
@auth_required
def get_sms_logs():
    """Get SMS notification logs"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        notification_type = request.args.get('notification_type')
        delivery_status = request.args.get('delivery_status')
        child_id = request.args.get('child_id', type=int)
        
        query = SMSNotification.query
        
        if notification_type:
            query = query.filter_by(notification_type=notification_type)
        if delivery_status:
            query = query.filter_by(delivery_status=delivery_status)
        if child_id:
            query = query.filter_by(child_id=child_id)
        
        pagination = query.order_by(SMSNotification.sent_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        logs = [sms.to_dict() for sms in pagination.items]
        
        return jsonify({
            'logs': logs,
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sms_bp.route('/batch-send', methods=['POST'])
@auth_required
def batch_send_sms():
    """Send SMS to multiple recipients"""
    try:
        data = request.get_json()
        current_user = get_current_user()
        
        child_ids = data.get('child_ids', [])
        notification_type = data.get('notification_type')
        message = data.get('message')
        
        if not child_ids or not notification_type or not message:
            return jsonify({'error': 'child_ids, notification_type, and message are required'}), 400
        
        # Get children with guardians
        children = Child.query.filter(Child.child_id.in_(child_ids)).all()
        
        # Import SMS service
        from services.sms_service import send_sms_notification
        
        results = []
        errors = []
        
        for child in children:
            try:
                guardian = child.guardian
                
                if not guardian or not guardian.notification_enabled:
                    errors.append({
                        'child_id': child.child_id,
                        'error': 'Guardian not found or notifications disabled'
                    })
                    continue
                
                # Send SMS
                result = send_sms_notification(
                    recipient_number=guardian.contact_number,
                    message=message
                )
                
                # Create SMS log
                sms = SMSNotification(
                    child_id=child.child_id,
                    guardian_id=guardian.guardian_id,
                    recipient_number=guardian.contact_number,
                    notification_type=notification_type,
                    message=message,
                    delivery_status=result.get('status', 'pending'),
                    provider_message_id=result.get('message_id'),
                    error_message=result.get('error')
                )
                
                db.session.add(sms)
                results.append(sms.to_dict())
                
            except Exception as e:
                errors.append({
                    'child_id': child.child_id,
                    'error': str(e)
                })
        
        db.session.commit()
        
        # Log audit
        log_audit(current_user.user_id, 'batch_send_sms', 'sms',
                 details=f'Sent to {len(results)} recipients')
        
        return jsonify({
            'message': f'SMS sent to {len(results)} recipients',
            'results': results,
            'errors': errors
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
