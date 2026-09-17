import os
from datetime import timedelta
from dotenv import load_dotenv

# Absolute path to the backend directory
_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))

# Load environment variables from backend/.env explicitly
load_dotenv(os.path.join(_BACKEND_DIR, '.env'))

# Default SQLite database path: backend/immunization.db
# Default SQLite database path: backend/immunization.db
_DEFAULT_DB_PATH = os.path.join(_BACKEND_DIR, 'immunization.db').replace('\\', '/')
_DEFAULT_DATABASE_URL = f'sqlite:///{_DEFAULT_DB_PATH}'

def _resolve_database_url():
    """Resolve database URL ensuring robust absolute path for SQLite"""
    url = os.getenv('DATABASE_URL')
    if not url:
        return _DEFAULT_DATABASE_URL
    if url.startswith('sqlite:///') and not url.startswith('sqlite:///:memory:'):
        raw_path = url[len('sqlite:///'):]
        if not os.path.isabs(raw_path):
            abs_path = os.path.join(_BACKEND_DIR, raw_path).replace('\\', '/')
            return f'sqlite:///{abs_path}'
    return url

class Config:
    """Base configuration"""
    
    # Secret key for JWT
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # Database configuration - Using SQLite
    SQLALCHEMY_DATABASE_URI = _resolve_database_url()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False
    
    # JWT Configuration
    JWT_SECRET_KEY = SECRET_KEY
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # SMS Configuration (Philippine SMS Gateway - ridvanbaluyos/sms provider architecture)
    # Default provider: Semaphore (https://semaphore.co) / PromoTexter
    # Use SMS_API_KEY=mock for local dev / testing without consuming credits
    SMS_API_KEY = os.getenv('SMS_API_KEY', 'mock')
    SMS_API_URL = os.getenv('SMS_API_URL', 'https://api.semaphore.co/api/v4/messages')
    SMS_SENDER_NAME = os.getenv('SMS_SENDER_NAME', 'BrgyHomapon')
    
    # AI Model Configuration
    AI_MODEL_PATH = os.path.join(os.path.dirname(__file__), 'ai', 'model', 'risk_classifier.pkl')
    AI_MODEL_VERSION = '1.0.0'
    
    # Application Settings
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:5173,http://localhost:3000').split(',')
    
    # Pagination
    ITEMS_PER_PAGE = 20
    
    # Schedule Settings
    UPCOMING_DAYS_THRESHOLD = 7  # Days before vaccination is considered "upcoming"
    DUE_DAYS_THRESHOLD = 0       # On the exact date
    
class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    SQLALCHEMY_ECHO = True

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    SQLALCHEMY_ECHO = False

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'

# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
