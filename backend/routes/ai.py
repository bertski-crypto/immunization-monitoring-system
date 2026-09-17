from flask import Blueprint, request, jsonify
from app import db
from models.assessment import AIAssessment
from models.child import Child
from utils.decorators import auth_required
from utils.helpers import log_audit, get_current_user
from datetime import datetime
import json

ai_bp = Blueprint('ai', __name__)

@ai_bp.route('/assess/<int:child_id>', methods=['POST'])
@auth_required
def assess_child(child_id):
    """Run AI risk assessment for a child"""
    try:
        child = Child.query.get(child_id)
        
        if not child:
            return jsonify({'error': 'Child not found'}), 404
        
        current_user = get_current_user()
        
        # Import AI service
        from services.ai_service import predict_risk
        
        # Run prediction
        result = predict_risk(child)
        
        if 'error' in result:
            return jsonify({'error': result['error']}), 500
        
        # Save assessment
        assessment = AIAssessment(
            child_id=child_id,
            assessment_date=datetime.utcnow(),
            risk_level=result['risk_level'],
            model_version=result.get('model_version', '1.0.0'),
            prediction_score=result.get('score'),
            assessment_result=json.dumps(result.get('features', {}))
        )
        
        db.session.add(assessment)
        db.session.commit()
        
        # Log audit
        log_audit(current_user.user_id, 'ai_assessment', 'ai', assessment.assessment_id)
        
        return jsonify({
            'message': 'Assessment completed successfully',
            'assessment': assessment.to_dict(include_child=True)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@ai_bp.route('/assessments', methods=['GET'])
@auth_required
def get_assessments():
    """Get all AI assessments with filtering"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        risk_level = request.args.get('risk_level')
        child_id = request.args.get('child_id', type=int)
        
        query = AIAssessment.query
        
        if risk_level:
            query = query.filter_by(risk_level=risk_level)
        if child_id:
            query = query.filter_by(child_id=child_id)
        
        pagination = query.order_by(AIAssessment.assessment_date.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        assessments = [assessment.to_dict(include_child=True) for assessment in pagination.items]
        
        return jsonify({
            'assessments': assessments,
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ai_bp.route('/assessments/<int:assessment_id>', methods=['GET'])
@auth_required
def get_assessment(assessment_id):
    """Get specific assessment"""
    try:
        assessment = AIAssessment.query.get(assessment_id)
        
        if not assessment:
            return jsonify({'error': 'Assessment not found'}), 404
        
        return jsonify({'assessment': assessment.to_dict(include_child=True)}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ai_bp.route('/batch-assess', methods=['POST'])
@auth_required
def batch_assess():
    """Run AI assessment for multiple children"""
    try:
        current_user = get_current_user()
        
        # Get all active children or specified children
        data = request.get_json()
        child_ids = data.get('child_ids', [])
        
        if child_ids:
            children = Child.query.filter(
                Child.child_id.in_(child_ids),
                Child.status == 'active'
            ).all()
        else:
            children = Child.query.filter_by(status='active').all()
        
        if not children:
            return jsonify({'error': 'No children found'}), 404
        
        # Import AI service
        from services.ai_service import predict_risk
        
        results = []
        errors = []
        
        for child in children:
            try:
                result = predict_risk(child)
                
                if 'error' in result:
                    errors.append({
                        'child_id': child.child_id,
                        'error': result['error']
                    })
                    continue
                
                # Save assessment
                assessment = AIAssessment(
                    child_id=child.child_id,
                    assessment_date=datetime.utcnow(),
                    risk_level=result['risk_level'],
                    model_version=result.get('model_version', '1.0.0'),
                    prediction_score=result.get('score'),
                    assessment_result=json.dumps(result.get('features', {}))
                )
                
                db.session.add(assessment)
                results.append(assessment.to_dict(include_child=True))
                
            except Exception as e:
                errors.append({
                    'child_id': child.child_id,
                    'error': str(e)
                })
        
        db.session.commit()
        
        # Log audit
        log_audit(current_user.user_id, 'batch_ai_assessment', 'ai', 
                 details=f'Assessed {len(results)} children')
        
        return jsonify({
            'message': f'Assessed {len(results)} children',
            'results': results,
            'errors': errors
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
