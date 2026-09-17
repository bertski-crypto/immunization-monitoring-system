from app import db
from datetime import datetime

class Vaccine(db.Model):
    """Vaccine model for vaccine types and configurations"""
    
    __tablename__ = 'vaccines'
    
    vaccine_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    vaccine_name = db.Column(db.String(200), nullable=False)
    dose_number = db.Column(db.Integer, nullable=False)  # 1, 2, 3, etc.
    schedule_reference = db.Column(db.Text, nullable=True)  # Age/timing reference
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.Enum('active', 'inactive'), default='active', nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    immunization_records = db.relationship('ImmunizationRecord', backref='vaccine', lazy='dynamic')
    
    def to_dict(self):
        """Convert vaccine to dictionary"""
        return {
            'vaccine_id': self.vaccine_id,
            'vaccine_name': self.vaccine_name,
            'dose_number': self.dose_number,
            'schedule_reference': self.schedule_reference,
            'description': self.description,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<Vaccine {self.vaccine_name} Dose {self.dose_number}>'


class ImmunizationRecord(db.Model):
    """Immunization record model for tracking vaccinations"""
    
    __tablename__ = 'immunization_records'
    
    record_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    child_id = db.Column(db.Integer, db.ForeignKey('children.child_id'), nullable=False)
    vaccine_id = db.Column(db.Integer, db.ForeignKey('vaccines.vaccine_id'), nullable=False)
    date_administered = db.Column(db.Date, nullable=False)
    recorded_by = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    remarks = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def to_dict(self, include_relations=True):
        """Convert immunization record to dictionary"""
        data = {
            'record_id': self.record_id,
            'child_id': self.child_id,
            'vaccine_id': self.vaccine_id,
            'date_administered': self.date_administered.isoformat() if self.date_administered else None,
            'recorded_by': self.recorded_by,
            'remarks': self.remarks,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_relations:
            if self.child:
                data['child_name'] = self.child.get_full_name()
            if self.vaccine:
                data['vaccine_name'] = self.vaccine.vaccine_name
                data['dose_number'] = self.vaccine.dose_number
            if self.recorded_by_user:
                data['recorded_by_name'] = self.recorded_by_user.full_name
        
        return data
    
    def __repr__(self):
        return f'<ImmunizationRecord {self.record_id}>'
