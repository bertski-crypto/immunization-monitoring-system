# AI-Powered Child Immunization Health Monitoring and Management System

## Project Overview

A web-based health information and monitoring system designed for Barangay Homapon, Legazpi City to manage child immunization records, monitor vaccination schedules, and send SMS notifications to parents/guardians.

## Technology Stack

### Frontend
- **React.js** with Vite
- **Bootstrap 5** for UI components
- **Recharts** for data visualization
- **Axios** for API communication

### Backend
- **Python Flask** for REST API
- **SQLite** for database (no server required)
- **Flask-SQLAlchemy** for ORM
- **Scikit-learn** for AI/ML model
- **SMS Gateway API** for notifications

## Features

- Child and guardian record management
- Immunization record tracking
- Vaccination schedule monitoring
- AI-assisted risk classification
- SMS notifications for reminders
- Dashboard analytics and reports
- User management and access control
- Audit logging

## Project Structure

```
system/
├── frontend/           # React application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── layouts/
│   │   └── utils/
│   └── public/
│
├── backend/           # Flask application
│   ├── routes/       # API endpoints
│   ├── models/       # Database models
│   ├── services/     # Business logic
│   ├── ai/           # ML model and training
│   ├── utils/        # Helper functions
│   ├── init_db.py    # Database initialization script
│   └── immunization.db  # SQLite database (auto-created)
│
└── database/         # Legacy MySQL scripts (obsolete)
```

## Quick Start

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- Git

No MySQL, XAMPP, or phpMyAdmin required. The application uses SQLite which is built into Python.

---

### Terminal 1 — Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS / Linux
pip install -r requirements.txt
python init_db.py
python app.py
```

### Terminal 2 — Frontend

```bash
cd frontend
npm install
npm run dev
```

### Access the Application

| Service  | URL                     |
|----------|-------------------------|
| Frontend | http://localhost:5173   |
| Backend  | http://localhost:5000   |

---

## Default Credentials

| Role           | Username      | Password   |
|----------------|---------------|------------|
| Administrator  | admin         | admin123   |
| Health Worker  | healthworker  | worker123  |

**Change these passwords immediately after first login.**

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and update as needed.

### Backend `.env` (minimum required)
```
SECRET_KEY=your-secret-key-change-in-production
FLASK_ENV=development
```

### Optional — Override SQLite path
```
DATABASE_URL=sqlite:////absolute/path/to/immunization.db
```

### Optional — SMS Gateway
```
SMS_API_KEY=your_sms_api_key
SMS_API_URL=your_sms_gateway_url
SMS_SENDER_NAME=BrgyHomapon
```
Without SMS credentials configured, the application runs in development SMS mode (mock delivery).

### Frontend `.env`
```
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## Database Initialization

Run once to create the database, tables, and seed data:

```bash
cd backend
python init_db.py
```

Output:
```
Database: SQLite
Location: .../backend/immunization.db

Creating tables...
  ✓ users
  ✓ guardians
  ✓ children
  ✓ vaccines
  ✓ immunization_records
  ✓ ai_assessments
  ✓ sms_notifications
  ✓ audit_logs

Creating default users...
  ✓ admin
  ✓ healthworker

Seeding vaccines...
  ✓ Vaccine data initialized (19 records inserted, 0 skipped)

Database initialization completed successfully.
```

Safe to run multiple times — existing data is not duplicated.

---

## User Roles

- **Administrator**: Full system access, user management
- **Health Worker**: Operational access, child/immunization management

## Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Role-based access control
- API endpoint protection
- Audit logging
- SQLite foreign key enforcement (PRAGMA foreign_keys=ON)

## Development Phases

1. ✅ Project Setup
2. ✅ Authentication & Authorization
3. ✅ Child & Guardian Management
4. ✅ Immunization Management
5. ✅ Schedule Monitoring
6. ✅ AI Risk Assessment
7. ✅ SMS Notifications
8. ✅ Dashboard & Reports
9. ✅ Security Hardening
10. ✅ SQLite Migration

## Important Notes

- AI predictions are decision support tools only, not medical diagnoses
- Health professionals remain responsible for all medical decisions
- SMS delivery is dependent on gateway availability
- System complies with Philippine data protection requirements
- The `database/init_database.sql` file is **obsolete** (legacy MySQL script, do not execute)

## License

This is a capstone project for educational purposes.

## Contact

Barangay Homapon Health Center, Legazpi City
