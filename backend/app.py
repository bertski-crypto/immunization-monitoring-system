from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Load extensions from extensions module
from extensions import db, jwt

# Load environment variables
load_dotenv()

def create_app(config_name='development'):
    """Application factory pattern"""
    from config import config
    
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    CORS(app, origins=app.config['CORS_ORIGINS'], supports_credentials=True)
    
    # Register blueprints
    from routes.auth import auth_bp
    from routes.users import users_bp
    from routes.children import children_bp
    from routes.guardians import guardians_bp
    from routes.vaccines import vaccines_bp
    from routes.immunization import immunization_bp
    from routes.schedules import schedules_bp
    from routes.ai import ai_bp
    from routes.sms import sms_bp
    from routes.reports import reports_bp
    from routes.audit import audit_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(children_bp, url_prefix='/api/children')
    app.register_blueprint(guardians_bp, url_prefix='/api/guardians')
    app.register_blueprint(vaccines_bp, url_prefix='/api/vaccines')
    app.register_blueprint(immunization_bp, url_prefix='/api/immunization')
    app.register_blueprint(schedules_bp, url_prefix='/api/schedules')
    app.register_blueprint(ai_bp, url_prefix='/api/ai')
    app.register_blueprint(sms_bp, url_prefix='/api/sms')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
    app.register_blueprint(audit_bp, url_prefix='/api/audit')
    
    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        return {'status': 'healthy', 'message': 'API is running'}
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    return app

if __name__ == '__main__':
    app = create_app(os.getenv('FLASK_ENV', 'development'))
    app.run(host='0.0.0.0', port=5000, debug=True)
