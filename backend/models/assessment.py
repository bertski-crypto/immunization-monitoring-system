from app import db
from datetime import datetime

class AIAssessment(db.Model):
    """AI Assessment model for ML-based risk classification"""
    
    __tablename__ = 'ai_assessments'
    
    assessment_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    child_id = db.Column(db.Integer, db.ForeignKey('children.child_id'), nullable=False)
    assessment_date = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    risk_level = db.Column(db.Enum('low', 'moderate', 'high'), nullable=False)
    model_version = db.Column(db.String(50), nullable=False)
    prediction_score = db.Column(db.Float, nullable=True)  # Confidence score
    assessment_result = db.Column(db.Text, nullable=True)  # JSON with detailed features
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    def to_dict(self, include_child=False):
        """Convert AI assessment to dictionary"""
        data = {
            'assessment_id': self.assessment_id,
            'child_id': self.child_id,
            'assessment_date': self.assessment_date.isoformat() if self.assessment_date else None,
            'risk_level': self.risk_level,
            'model_version': self.model_version,
            'prediction_score': self.prediction_score,
            'assessment_result': self.assessment_result,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        
        if include_child and self.child:
            data['child'] = {
                'child_code': self.child.child_code,
                'full_name': self.child.get_full_name(),
                'age_months': self.child.get_age_months()
            }
        
        return data
    
    def __repr__(self):
        return f'<AIAssessment {self.assessment_id} - {self.risk_level}>'


class SMSNotification(db.Model):
    """SMS Notification model for tracking sent messages"""
    
    __tablename__ = 'sms_notifications'
    
    sms_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    child_id = db.Column(db.Integer, db.ForeignKey('children.child_id'), nullable=False)
    guardian_id = db.Column(db.Integer, db.ForeignKey('guardians.guardian_id'), nullable=False)
    recipient_number = db.Column(db.String(20), nullable=False)
    notification_type = db.Column(db.Enum('upcoming', 'due', 'overdue', 'follow_up', 'announcement', 'reminder', name='notification_type_enum'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    sent_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    delivery_status = db.Column(db.Enum('pending', 'sent', 'delivered', 'failed'), default='pending', nullable=False)
    provider_message_id = db.Column(db.String(100), nullable=True)
    error_message = db.Column(db.Text, nullable=True)
    
    def to_dict(self, include_relations=True):
        """Convert SMS notification to dictionary"""
        data = {
            'sms_id': self.sms_id,
            'child_id': self.child_id,
            'guardian_id': self.guardian_id,
            'recipient_number': self.recipient_number,
            'notification_type': self.notification_type,
            'message': self.message,
            'sent_at': self.sent_at.isoformat() if self.sent_at else None,
            'delivery_status': self.delivery_status,
            'provider_message_id': self.provider_message_id,
            'error_message': self.error_message
        }
        
        if include_relations:
            if self.child:
                data['child_name'] = self.child.get_full_name()
            if self.guardian:
                data['guardian_name'] = self.guardian.full_name
        
        return data
    
    def __repr__(self):
        return f'<SMSNotification {self.sms_id} - {self.notification_type}>'


class AuditLog(db.Model):
    """Audit Log model for tracking system activities"""
    
    __tablename__ = 'audit_logs'
    
    log_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=True)
    action = db.Column(db.String(100), nullable=False)  # e.g., 'login', 'create_child', 'update_immunization'
    module = db.Column(db.String(50), nullable=False)  # e.g., 'auth', 'children', 'immunization'
    record_id = db.Column(db.Integer, nullable=True)  # ID of the affected record
    details = db.Column(db.Text, nullable=True)  # JSON with additional details
    ip_address = db.Column(db.String(45), nullable=True)  # IPv4 or IPv6
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    def to_dict(self):
        """Convert audit log to dictionary"""
        return {
            'log_id': self.log_id,
            'user_id': self.user_id,
            'user_name': self.user.full_name if self.user else 'System',
            'action': self.action,
            'module': self.module,
            'record_id': self.record_id,
            'details': self.details,
            'ip_address': self.ip_address,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }
    
    def __repr__(self):
        return f'<AuditLog {self.log_id} - {self.action}>'
