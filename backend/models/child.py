from app import db
from datetime import datetime

class Guardian(db.Model):
    """Guardian model for parent/guardian information"""
    
    __tablename__ = 'guardians'
    
    guardian_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    full_name = db.Column(db.String(200), nullable=False)
    relationship = db.Column(db.String(50), nullable=False)  # e.g., Mother, Father, Grandparent
    contact_number = db.Column(db.String(20), nullable=False)
    address = db.Column(db.Text, nullable=True)
    notification_enabled = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    children = db.relationship('Child', backref='guardian', lazy='dynamic')
    sms_notifications = db.relationship('SMSNotification', backref='guardian', lazy='dynamic')
    
    def to_dict(self):
        """Convert guardian to dictionary"""
        return {
            'guardian_id': self.guardian_id,
            'full_name': self.full_name,
            'relationship': self.relationship,
            'contact_number': self.contact_number,
            'address': self.address,
            'notification_enabled': self.notification_enabled,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'children_count': self.children.count() if self.children else 0
        }
    
    def __repr__(self):
        return f'<Guardian {self.full_name}>'


class Child(db.Model):
    """Child model for child registration and information"""
    
    __tablename__ = 'children'
    
    child_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    child_code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    first_name = db.Column(db.String(100), nullable=False)
    middle_name = db.Column(db.String(100), nullable=True)
    last_name = db.Column(db.String(100), nullable=False)
    birth_date = db.Column(db.Date, nullable=False)
    sex = db.Column(db.Enum('male', 'female'), nullable=False)
    address = db.Column(db.Text, nullable=True)
    guardian_id = db.Column(db.Integer, db.ForeignKey('guardians.guardian_id'), nullable=False)
    status = db.Column(db.Enum('active', 'archived'), default='active', nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    immunization_records = db.relationship('ImmunizationRecord', backref='child', lazy='dynamic', cascade='all, delete-orphan')
    ai_assessments = db.relationship('AIAssessment', backref='child', lazy='dynamic', cascade='all, delete-orphan')
    sms_notifications = db.relationship('SMSNotification', backref='child', lazy='dynamic', cascade='all, delete-orphan')
    
    def get_full_name(self):
        """Get child's full name"""
        if self.middle_name:
            return f"{self.first_name} {self.middle_name} {self.last_name}"
        return f"{self.first_name} {self.last_name}"
    
    def get_age_months(self):
        """Calculate age in months"""
        from datetime import date
        today = date.today()
        months = (today.year - self.birth_date.year) * 12 + (today.month - self.birth_date.month)
        if today.day < self.birth_date.day:
            months -= 1
        return months
    
    def to_dict(self, include_guardian=True):
        """Convert child to dictionary"""
        data = {
            'child_id': self.child_id,
            'child_code': self.child_code,
            'first_name': self.first_name,
            'middle_name': self.middle_name,
            'last_name': self.last_name,
            'full_name': self.get_full_name(),
            'birth_date': self.birth_date.isoformat() if self.birth_date else None,
            'age_months': self.get_age_months(),
            'sex': self.sex,
            'address': self.address,
            'guardian_id': self.guardian_id,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_guardian and self.guardian:
            data['guardian'] = self.guardian.to_dict()
        
        return data
    
    def __repr__(self):
        return f'<Child {self.get_full_name()}>'
