from flask import Blueprint, jsonify
from utils.decorators import auth_required
from models.assessment import AuditLog

audit_bp = Blueprint('audit', __name__)

@audit_bp.route('/logs', methods=['GET'])
@auth_required
def get_audit_logs():
    """Get audit logs"""
    try:
        from flask import request
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        module = request.args.get('module')
        user_id = request.args.get('user_id', type=int)
        
        query = AuditLog.query
        
        if module:
            query = query.filter_by(module=module)
        if user_id:
            query = query.filter_by(user_id=user_id)
        
        pagination = query.order_by(AuditLog.timestamp.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        logs = [log.to_dict() for log in pagination.items]
        
        return jsonify({
            'logs': logs,
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
