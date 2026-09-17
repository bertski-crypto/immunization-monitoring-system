from app import db
from models.assessment import AuditLog
from flask import request
import json

def get_current_user():
    """Get current authenticated user (re-exported from decorators for convenience)"""
    from flask_jwt_extended import get_jwt_identity
    from models.user import User
    current_user_id = int(get_jwt_identity())
    return User.query.get(current_user_id)

def log_audit(user_id, action, module, record_id=None, details=None):
    """
    Log an audit trail entry
    
    Args:
        user_id: ID of the user performing the action
        action: Action performed (e.g., 'login', 'create_child')
        module: Module/feature (e.g., 'auth', 'children')
        record_id: ID of the affected record (optional)
        details: Additional details as dict or string (optional)
    """
    try:
        # Convert details to JSON string if it's a dict
        if isinstance(details, dict):
            details = json.dumps(details)
        
        # Get IP address from request
        ip_address = request.remote_addr if request else None
        
        # Create audit log entry
        audit = AuditLog(
            user_id=user_id,
            action=action,
            module=module,
            record_id=record_id,
            details=details,
            ip_address=ip_address
        )
        
        db.session.add(audit)
        db.session.commit()
        
        return True
    except Exception as e:
        print(f"Error logging audit: {str(e)}")
        db.session.rollback()
        return False

def validate_contact_number(contact_number):
    """
    Validate Philippine mobile number format
    
    Args:
        contact_number: Phone number string
    
    Returns:
        bool: True if valid, False otherwise
    """
    import re
    
    # Remove common formatting characters
    cleaned = re.sub(r'[\s\-\(\)]', '', contact_number)
    
    # Philippine mobile number patterns:
    # 09XX-XXX-XXXX (11 digits starting with 09)
    # +639XX-XXX-XXXX (13 digits with country code)
    # 639XX-XXX-XXXX (12 digits with country code, no +)
    
    patterns = [
        r'^09\d{9}$',           # 09XXXXXXXXX
        r'^\+639\d{9}$',        # +639XXXXXXXXX
        r'^639\d{9}$'           # 639XXXXXXXXX
    ]
    
    return any(re.match(pattern, cleaned) for pattern in patterns)

def format_contact_number(contact_number):
    """
    Format contact number to standard format (09XXXXXXXXX)
    
    Args:
        contact_number: Phone number string
    
    Returns:
        str: Formatted phone number
    """
    import re
    
    # Remove formatting
    cleaned = re.sub(r'[\s\-\(\)]', '', contact_number)
    
    # Convert to 09XX format
    if cleaned.startswith('+639'):
        cleaned = '0' + cleaned[3:]
    elif cleaned.startswith('639'):
        cleaned = '0' + cleaned[2:]
    
    return cleaned

def generate_child_code():
    """
    Generate unique child code
    Format: CHD-YYYYMMDD-XXXX
    
    Returns:
        str: Unique child code
    """
    from datetime import datetime
    from models.child import Child
    import random
    
    while True:
        date_part = datetime.now().strftime('%Y%m%d')
        random_part = str(random.randint(1000, 9999))
        child_code = f"CHD-{date_part}-{random_part}"
        
        # Check if code already exists
        existing = Child.query.filter_by(child_code=child_code).first()
        if not existing:
            return child_code

def calculate_immunization_status(child, vaccine_schedule):
    """
    Calculate immunization status for a child
    
    Args:
        child: Child model instance
        vaccine_schedule: List of expected vaccines with timing
    
    Returns:
        dict: Status summary with completed, upcoming, due, overdue counts
    """
    from datetime import date, timedelta
    from models.vaccine import ImmunizationRecord
    
    # Get all immunization records for the child
    records = ImmunizationRecord.query.filter_by(child_id=child.child_id).all()
    administered_vaccines = {r.vaccine_id for r in records}
    
    status = {
        'completed': 0,
        'upcoming': 0,
        'due': 0,
        'overdue': 0
    }
    
    today = date.today()
    child_age_months = child.get_age_months()
    
    for schedule_item in vaccine_schedule:
        vaccine_id = schedule_item.get('vaccine_id')
        due_age_months = schedule_item.get('due_age_months', 0)
        
        # Check if vaccine has been administered
        if vaccine_id in administered_vaccines:
            status['completed'] += 1
            continue
        
        # Calculate due date based on child's birth date and vaccine schedule
        due_date = child.birth_date.replace(
            month=child.birth_date.month + due_age_months
        ) if due_age_months > 0 else child.birth_date
        
        # Determine status
        days_until_due = (due_date - today).days
        
        if days_until_due > 7:
            status['upcoming'] += 1
        elif days_until_due >= 0:
            status['due'] += 1
        else:
            status['overdue'] += 1
    
    return status
