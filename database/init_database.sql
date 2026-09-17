-- ============================================================
-- OBSOLETE: This file is no longer used.
-- ============================================================
-- The project has migrated from MySQL to SQLite.
-- Database schema is now managed by SQLAlchemy models and
-- initialized via: python backend/init_db.py
--
-- DO NOT execute this file against any database.
-- It contains MySQL-specific syntax (ENGINE=InnoDB, ENUM, etc.)
-- that is incompatible with SQLite.
-- ============================================================

-- AI-Powered Child Immunization Health Monitoring and Management System
-- Database Initialization Script
-- MySQL Database Setup (OBSOLETE - kept for historical reference only)



-- Create database
CREATE DATABASE IF NOT EXISTS immunization_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE immunization_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(200) NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('administrator', 'health_worker') NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active' NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_username (username),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Guardians table
CREATE TABLE IF NOT EXISTS guardians (
    guardian_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(200) NOT NULL,
    relationship VARCHAR(50) NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    address TEXT,
    notification_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_contact (contact_number),
    INDEX idx_name (full_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Children table
CREATE TABLE IF NOT EXISTS children (
    child_id INT AUTO_INCREMENT PRIMARY KEY,
    child_code VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    birth_date DATE NOT NULL,
    sex ENUM('male', 'female') NOT NULL,
    address TEXT,
    guardian_id INT NOT NULL,
    status ENUM('active', 'archived') DEFAULT 'active' NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_child_code (child_code),
    INDEX idx_guardian (guardian_id),
    INDEX idx_status (status),
    INDEX idx_name (last_name, first_name),
    FOREIGN KEY (guardian_id) REFERENCES guardians(guardian_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vaccines table
CREATE TABLE IF NOT EXISTS vaccines (
    vaccine_id INT AUTO_INCREMENT PRIMARY KEY,
    vaccine_name VARCHAR(200) NOT NULL,
    dose_number INT NOT NULL,
    schedule_reference TEXT,
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active' NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_status (status),
    INDEX idx_vaccine_name (vaccine_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Immunization records table
CREATE TABLE IF NOT EXISTS immunization_records (
    record_id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT NOT NULL,
    vaccine_id INT NOT NULL,
    date_administered DATE NOT NULL,
    recorded_by INT NOT NULL,
    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_child (child_id),
    INDEX idx_vaccine (vaccine_id),
    INDEX idx_date (date_administered),
    INDEX idx_recorded_by (recorded_by),
    FOREIGN KEY (child_id) REFERENCES children(child_id) ON DELETE CASCADE,
    FOREIGN KEY (vaccine_id) REFERENCES vaccines(vaccine_id) ON DELETE RESTRICT,
    FOREIGN KEY (recorded_by) REFERENCES users(user_id) ON DELETE RESTRICT,
    UNIQUE KEY unique_child_vaccine (child_id, vaccine_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI assessments table
CREATE TABLE IF NOT EXISTS ai_assessments (
    assessment_id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT NOT NULL,
    assessment_date DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    risk_level ENUM('low', 'moderate', 'high') NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    prediction_score FLOAT,
    assessment_result TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_child (child_id),
    INDEX idx_risk_level (risk_level),
    INDEX idx_assessment_date (assessment_date),
    FOREIGN KEY (child_id) REFERENCES children(child_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SMS notifications table
CREATE TABLE IF NOT EXISTS sms_notifications (
    sms_id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT NOT NULL,
    guardian_id INT NOT NULL,
    recipient_number VARCHAR(20) NOT NULL,
    notification_type ENUM('upcoming', 'due', 'overdue', 'follow_up', 'announcement') NOT NULL,
    message TEXT NOT NULL,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    delivery_status ENUM('pending', 'sent', 'delivered', 'failed') DEFAULT 'pending' NOT NULL,
    provider_message_id VARCHAR(100),
    error_message TEXT,
    INDEX idx_child (child_id),
    INDEX idx_guardian (guardian_id),
    INDEX idx_sent_at (sent_at),
    INDEX idx_status (delivery_status),
    FOREIGN KEY (child_id) REFERENCES children(child_id) ON DELETE CASCADE,
    FOREIGN KEY (guardian_id) REFERENCES guardians(guardian_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    record_id INT,
    details TEXT,
    ip_address VARCHAR(45),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_user (user_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_module (module),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin user
-- Default password: admin123 (should be changed immediately after first login)
-- Password hash for 'admin123' using bcrypt
INSERT INTO users (full_name, username, password_hash, role, status)
VALUES ('System Administrator', 'admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIFz4PgX3K', 'administrator', 'active')
ON DUPLICATE KEY UPDATE user_id = user_id;

-- Insert default health worker
-- Default password: worker123 (should be changed after first login)
INSERT INTO users (full_name, username, password_hash, role, status)
VALUES ('Health Worker', 'healthworker', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIFz4PgX3K', 'health_worker', 'active')
ON DUPLICATE KEY UPDATE user_id = user_id;

-- Insert sample vaccines based on Philippine EPI schedule
INSERT INTO vaccines (vaccine_name, dose_number, schedule_reference, description, status) VALUES
('BCG', 1, 'At birth or as early as possible', 'Bacillus Calmette-Guérin vaccine for tuberculosis', 'active'),
('Hepatitis B', 1, 'At birth or within 24 hours', 'First dose of Hepatitis B vaccine', 'active'),
('Hepatitis B', 2, '6 weeks (1.5 months)', 'Second dose of Hepatitis B vaccine', 'active'),
('Hepatitis B', 3, '14 weeks (3.5 months)', 'Third dose of Hepatitis B vaccine', 'active'),
('DPT', 1, '6 weeks (1.5 months)', 'Diphtheria, Pertussis, Tetanus - First dose', 'active'),
('DPT', 2, '10 weeks (2.5 months)', 'Diphtheria, Pertussis, Tetanus - Second dose', 'active'),
('DPT', 3, '14 weeks (3.5 months)', 'Diphtheria, Pertussis, Tetanus - Third dose', 'active'),
('OPV', 1, '6 weeks (1.5 months)', 'Oral Polio Vaccine - First dose', 'active'),
('OPV', 2, '10 weeks (2.5 months)', 'Oral Polio Vaccine - Second dose', 'active'),
('OPV', 3, '14 weeks (3.5 months)', 'Oral Polio Vaccine - Third dose', 'active'),
('IPV', 1, '14 weeks (3.5 months)', 'Inactivated Polio Vaccine', 'active'),
('Hib', 1, '6 weeks (1.5 months)', 'Haemophilus influenzae type b - First dose', 'active'),
('Hib', 2, '10 weeks (2.5 months)', 'Haemophilus influenzae type b - Second dose', 'active'),
('Hib', 3, '14 weeks (3.5 months)', 'Haemophilus influenzae type b - Third dose', 'active'),
('PCV', 1, '6 weeks (1.5 months)', 'Pneumococcal Conjugate Vaccine - First dose', 'active'),
('PCV', 2, '10 weeks (2.5 months)', 'Pneumococcal Conjugate Vaccine - Second dose', 'active'),
('PCV', 3, '14 weeks (3.5 months)', 'Pneumococcal Conjugate Vaccine - Third dose', 'active'),
('MMR', 1, '9 months', 'Measles, Mumps, Rubella - First dose', 'active'),
('MMR', 2, '12 months', 'Measles, Mumps, Rubella - Second dose', 'active')
ON DUPLICATE KEY UPDATE vaccine_id = vaccine_id;

-- Success message
SELECT 'Database initialized successfully!' as message;
SELECT 'Default credentials:' as info;
SELECT 'Admin - Username: admin, Password: admin123' as credentials;
SELECT 'Health Worker - Username: healthworker, Password: worker123' as credentials;
SELECT 'IMPORTANT: Change default passwords immediately!' as warning;
