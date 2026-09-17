"""
AI Service for risk assessment prediction

This module provides functions for:
- Loading trained ML model
- Extracting features from child immunization data
- Running predictions
- Classifying risk levels

Note: The model must be trained first using actual data.
This is a placeholder implementation that requires a trained model file.
"""

import os
import joblib
import numpy as np
from datetime import date

def load_model():
    """Load trained ML model"""
    try:
        from config import Config
        model_path = Config.AI_MODEL_PATH
        
        if not os.path.exists(model_path):
            return None
        
        model = joblib.load(model_path)
        return model
    except Exception as e:
        print(f"Error loading model: {str(e)}")
        return None

def extract_features(child):
    """
    Extract features from child data for prediction
    
    Args:
        child: Child model instance
    
    Returns:
        dict: Feature dictionary
    """
    from models.vaccine import ImmunizationRecord, Vaccine
    
    # Calculate age in months
    age_months = child.get_age_months()
    
    # Get immunization records
    records = ImmunizationRecord.query.filter_by(child_id=child.child_id).all()
    received_doses = len(records)
    
    # Get total expected vaccines (simplified - should use proper schedule)
    total_vaccines = Vaccine.query.filter_by(status='active').count()
    
    # Calculate missed doses
    missed_doses = max(0, total_vaccines - received_doses)
    
    # Calculate overdue days (simplified)
    overdue_days = 0
    if age_months > 0:
        expected_by_age = min(age_months // 2, total_vaccines)  # Rough estimate
        if received_doses < expected_by_age:
            overdue_days = (age_months - expected_by_age) * 30
    
    # Completion rate
    completion_rate = received_doses / total_vaccines if total_vaccines > 0 else 0
    
    # Check for delayed vaccinations
    delayed_count = 0
    for record in records:
        # Simplified delay check
        expected_month = 2  # Placeholder
        actual_months = (record.date_administered.year - child.birth_date.year) * 12 + \
                       (record.date_administered.month - child.birth_date.month)
        if actual_months > expected_month + 1:
            delayed_count += 1
    
    features = {
        'age_months': age_months,
        'received_doses': received_doses,
        'total_expected_doses': total_vaccines,
        'missed_doses': missed_doses,
        'overdue_days': overdue_days,
        'completion_rate': completion_rate,
        'delayed_count': delayed_count
    }
    
    return features

def predict_risk(child):
    """
    Predict risk level for a child
    
    Args:
        child: Child model instance
    
    Returns:
        dict: Prediction result with risk level and score
    """
    try:
        # Extract features
        features = extract_features(child)
        
        # Load model
        model = load_model()
        
        # If no model is available, use rule-based classification
        if model is None:
            return rule_based_classification(features)
        
        # Prepare feature vector for model
        feature_vector = np.array([[
            features['age_months'],
            features['received_doses'],
            features['missed_doses'],
            features['overdue_days'],
            features['completion_rate'],
            features['delayed_count']
        ]])
        
        # Make prediction
        prediction = model.predict(feature_vector)[0]
        
        # Get probability/confidence if available
        score = None
        if hasattr(model, 'predict_proba'):
            probabilities = model.predict_proba(feature_vector)[0]
            score = float(max(probabilities))
        
        # Map prediction to risk level
        risk_mapping = {
            0: 'low',
            1: 'moderate',
            2: 'high'
        }
        risk_level = risk_mapping.get(prediction, 'moderate')
        
        from config import Config
        
        return {
            'risk_level': risk_level,
            'score': score,
            'features': features,
            'model_version': Config.AI_MODEL_VERSION
        }
        
    except Exception as e:
        return {'error': str(e)}

def rule_based_classification(features):
    """
    Fallback rule-based risk classification when ML model is not available
    
    Args:
        features: Feature dictionary
    
    Returns:
        dict: Classification result
    """
    completion_rate = features['completion_rate']
    missed_doses = features['missed_doses']
    overdue_days = features['overdue_days']
    delayed_count = features['delayed_count']
    
    # High risk conditions
    if completion_rate < 0.5 or missed_doses >= 3 or overdue_days > 60:
        risk_level = 'high'
        score = 0.85
    # Moderate risk conditions
    elif completion_rate < 0.75 or missed_doses >= 1 or overdue_days > 30 or delayed_count >= 2:
        risk_level = 'moderate'
        score = 0.65
    # Low risk
    else:
        risk_level = 'low'
        score = 0.45
    
    return {
        'risk_level': risk_level,
        'score': score,
        'features': features,
        'model_version': '1.0.0-rule-based'
    }
