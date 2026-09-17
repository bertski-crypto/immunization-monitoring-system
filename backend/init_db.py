"""
Database initialization script for SQLite

Run from inside the backend directory:
    python init_db.py

Creates all 8 tables, seeds default users and vaccines.
Safe to run multiple times - skips existing data.
"""

import os
import sys

# Ensure we can import from the backend directory
_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

from app import create_app, db
from models.user import User
from models.child import Guardian, Child
from models.vaccine import Vaccine, ImmunizationRecord
from models.assessment import AIAssessment, SMSNotification, AuditLog


def enable_foreign_keys(connection):
    """Enable SQLite foreign key enforcement for this connection."""
    import sqlite3
    if isinstance(connection, sqlite3.Connection):
        connection.execute("PRAGMA foreign_keys=ON")


def init_database():
    """Initialize the SQLite database with tables and seed data."""

    app = create_app()

    with app.app_context():
        # Determine DB path for display
        db_url = app.config.get('SQLALCHEMY_DATABASE_URI', '')
        if db_url.startswith('sqlite:///'):
            db_path = db_url[len('sqlite:///'):]
            if not os.path.isabs(db_path):
                db_path = os.path.join(_BACKEND_DIR, db_path)
        else:
            db_path = db_url

        print()
        print("Database: SQLite")
        print(f"Location: {db_path}")
        print()

        # Force PRAGMA foreign_keys=ON on the raw connection
        with db.engine.connect() as raw_conn:
            try:
                raw_conn.connection.execute("PRAGMA foreign_keys=ON")
            except Exception:
                pass  # Non-SQLite engines skip silently

        # ------------------------------------------------------------------
        # Create tables
        # ------------------------------------------------------------------
        print("Creating tables...")

        # We call create_all which uses the models - idempotent if tables exist
        db.create_all()

        # Verify each table was created by checking inspector
        from sqlalchemy import inspect as sa_inspect
        inspector = sa_inspect(db.engine)
        existing_tables = set(inspector.get_table_names())

        expected_tables = [
            'users',
            'guardians',
            'children',
            'vaccines',
            'immunization_records',
            'ai_assessments',
            'sms_notifications',
            'audit_logs',
        ]

        all_ok = True
        for table in expected_tables:
            if table in existing_tables:
                print(f"  [OK]     {table}")
            else:
                print(f"  [MISS]   {table}  <-- MISSING")
                all_ok = False

        if not all_ok:
            print()
            print("ERROR: Some tables were not created. Check your models.")
            sys.exit(1)

        # ------------------------------------------------------------------
        # Default users
        # ------------------------------------------------------------------
        print()
        print("Creating default users...")

        default_users = [
            {
                'full_name': 'System Administrator',
                'username': 'admin',
                'password': 'admin123',
                'role': 'administrator',
                'status': 'active',
            },
            {
                'full_name': 'Health Worker',
                'username': 'healthworker',
                'password': 'worker123',
                'role': 'health_worker',
                'status': 'active',
            },
        ]

        for ud in default_users:
            existing = User.query.filter_by(username=ud['username']).first()
            if existing:
                print(f"  - {ud['username']} (already exists, skipped)")
            else:
                user = User(
                    full_name=ud['full_name'],
                    username=ud['username'],
                    role=ud['role'],
                    status=ud['status'],
                )
                user.set_password(ud['password'])
                db.session.add(user)
                db.session.flush()  # get user_id before commit
                print(f"  [OK]     {ud['username']}")

        db.session.commit()

        # ------------------------------------------------------------------
        # Vaccine seed data (Philippine EPI schedule - 19 records)
        # ------------------------------------------------------------------
        print()
        print("Seeding vaccines...")

        vaccines_data = [
            {'vaccine_name': 'BCG',        'dose_number': 1, 'schedule_reference': 'At birth or as early as possible',  'description': 'Bacillus Calmette-Guerin vaccine for tuberculosis'},
            {'vaccine_name': 'Hepatitis B', 'dose_number': 1, 'schedule_reference': 'At birth or within 24 hours',        'description': 'First dose of Hepatitis B vaccine'},
            {'vaccine_name': 'Hepatitis B', 'dose_number': 2, 'schedule_reference': '6 weeks (1.5 months)',               'description': 'Second dose of Hepatitis B vaccine'},
            {'vaccine_name': 'Hepatitis B', 'dose_number': 3, 'schedule_reference': '14 weeks (3.5 months)',              'description': 'Third dose of Hepatitis B vaccine'},
            {'vaccine_name': 'DPT',        'dose_number': 1, 'schedule_reference': '6 weeks (1.5 months)',               'description': 'Diphtheria, Pertussis, Tetanus - First dose'},
            {'vaccine_name': 'DPT',        'dose_number': 2, 'schedule_reference': '10 weeks (2.5 months)',              'description': 'Diphtheria, Pertussis, Tetanus - Second dose'},
            {'vaccine_name': 'DPT',        'dose_number': 3, 'schedule_reference': '14 weeks (3.5 months)',              'description': 'Diphtheria, Pertussis, Tetanus - Third dose'},
            {'vaccine_name': 'OPV',        'dose_number': 1, 'schedule_reference': '6 weeks (1.5 months)',               'description': 'Oral Polio Vaccine - First dose'},
            {'vaccine_name': 'OPV',        'dose_number': 2, 'schedule_reference': '10 weeks (2.5 months)',              'description': 'Oral Polio Vaccine - Second dose'},
            {'vaccine_name': 'OPV',        'dose_number': 3, 'schedule_reference': '14 weeks (3.5 months)',              'description': 'Oral Polio Vaccine - Third dose'},
            {'vaccine_name': 'IPV',        'dose_number': 1, 'schedule_reference': '14 weeks (3.5 months)',              'description': 'Inactivated Polio Vaccine'},
            {'vaccine_name': 'Hib',        'dose_number': 1, 'schedule_reference': '6 weeks (1.5 months)',               'description': 'Haemophilus influenzae type b - First dose'},
            {'vaccine_name': 'Hib',        'dose_number': 2, 'schedule_reference': '10 weeks (2.5 months)',              'description': 'Haemophilus influenzae type b - Second dose'},
            {'vaccine_name': 'Hib',        'dose_number': 3, 'schedule_reference': '14 weeks (3.5 months)',              'description': 'Haemophilus influenzae type b - Third dose'},
            {'vaccine_name': 'PCV',        'dose_number': 1, 'schedule_reference': '6 weeks (1.5 months)',               'description': 'Pneumococcal Conjugate Vaccine - First dose'},
            {'vaccine_name': 'PCV',        'dose_number': 2, 'schedule_reference': '10 weeks (2.5 months)',              'description': 'Pneumococcal Conjugate Vaccine - Second dose'},
            {'vaccine_name': 'PCV',        'dose_number': 3, 'schedule_reference': '14 weeks (3.5 months)',              'description': 'Pneumococcal Conjugate Vaccine - Third dose'},
            {'vaccine_name': 'MMR',        'dose_number': 1, 'schedule_reference': '9 months',                           'description': 'Measles, Mumps, Rubella - First dose'},
            {'vaccine_name': 'MMR',        'dose_number': 2, 'schedule_reference': '12 months',                          'description': 'Measles, Mumps, Rubella - Second dose'},
        ]

        inserted = 0
        skipped = 0
        for vd in vaccines_data:
            existing = Vaccine.query.filter_by(
                vaccine_name=vd['vaccine_name'],
                dose_number=vd['dose_number']
            ).first()
            if existing:
                skipped += 1
            else:
                vaccine = Vaccine(
                    vaccine_name=vd['vaccine_name'],
                    dose_number=vd['dose_number'],
                    schedule_reference=vd['schedule_reference'],
                    description=vd['description'],
                    status='active',
                )
                db.session.add(vaccine)
                inserted += 1

        db.session.commit()

        if skipped > 0 and inserted == 0:
            print("  - Vaccine data already seeded (skipped)")
        else:
            print(f"  [OK]     Vaccine data initialized ({inserted} records inserted, {skipped} skipped)")

        # ------------------------------------------------------------------
        # Final summary
        # ------------------------------------------------------------------
        print()
        print("=" * 55)
        print("Database initialization completed successfully.")
        print("=" * 55)
        print()
        print(f"  Users    : {User.query.count()}")
        print(f"  Vaccines : {Vaccine.query.count()}")
        print()
        print("Login credentials:")
        print("  Admin       - username: admin       / password: admin123")
        print("  Health Worker - username: healthworker / password: worker123")
        print()
        print("IMPORTANT: Change default passwords after first login!")
        print()


if __name__ == '__main__':
    init_database()
