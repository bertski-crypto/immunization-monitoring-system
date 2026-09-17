"""
Comprehensive verification test script for SQLite migration
Tests all 8 tables, relations, constraints, and all REST API endpoints.
"""

import os
import sys
import unittest
import json
from datetime import date, datetime

# Setup path
_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

from app import create_app
from extensions import db
from models.user import User
from models.child import Guardian, Child
from models.vaccine import Vaccine, ImmunizationRecord
from models.assessment import AIAssessment, SMSNotification, AuditLog
from init_db import init_database
from sqlalchemy import inspect as sa_inspect


class TestSQLiteMigration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        """Set up test environment and initialize database"""
        cls.app = create_app('testing')
        cls.client = cls.app.test_client()

        with cls.app.app_context():
            db.create_all()

            # Seed default users
            admin = User(full_name='System Administrator', username='admin', role='administrator', status='active')
            admin.set_password('admin123')
            db.session.add(admin)

            hw = User(full_name='Health Worker', username='healthworker', role='health_worker', status='active')
            hw.set_password('worker123')
            db.session.add(hw)

            # Seed 19 vaccines
            vaccines = [
                {'vaccine_name': 'BCG', 'dose_number': 1, 'schedule_reference': 'At birth', 'description': 'BCG'},
                {'vaccine_name': 'Hepatitis B', 'dose_number': 1, 'schedule_reference': 'At birth', 'description': 'HepB 1'},
                {'vaccine_name': 'Hepatitis B', 'dose_number': 2, 'schedule_reference': '6 weeks', 'description': 'HepB 2'},
                {'vaccine_name': 'Hepatitis B', 'dose_number': 3, 'schedule_reference': '14 weeks', 'description': 'HepB 3'},
                {'vaccine_name': 'DPT', 'dose_number': 1, 'schedule_reference': '6 weeks', 'description': 'DPT 1'},
                {'vaccine_name': 'DPT', 'dose_number': 2, 'schedule_reference': '10 weeks', 'description': 'DPT 2'},
                {'vaccine_name': 'DPT', 'dose_number': 3, 'schedule_reference': '14 weeks', 'description': 'DPT 3'},
                {'vaccine_name': 'OPV', 'dose_number': 1, 'schedule_reference': '6 weeks', 'description': 'OPV 1'},
                {'vaccine_name': 'OPV', 'dose_number': 2, 'schedule_reference': '10 weeks', 'description': 'OPV 2'},
                {'vaccine_name': 'OPV', 'dose_number': 3, 'schedule_reference': '14 weeks', 'description': 'OPV 3'},
                {'vaccine_name': 'IPV', 'dose_number': 1, 'schedule_reference': '14 weeks', 'description': 'IPV'},
                {'vaccine_name': 'Hib', 'dose_number': 1, 'schedule_reference': '6 weeks', 'description': 'Hib 1'},
                {'vaccine_name': 'Hib', 'dose_number': 2, 'schedule_reference': '10 weeks', 'description': 'Hib 2'},
                {'vaccine_name': 'Hib', 'dose_number': 3, 'schedule_reference': '14 weeks', 'description': 'Hib 3'},
                {'vaccine_name': 'PCV', 'dose_number': 1, 'schedule_reference': '6 weeks', 'description': 'PCV 1'},
                {'vaccine_name': 'PCV', 'dose_number': 2, 'schedule_reference': '10 weeks', 'description': 'PCV 2'},
                {'vaccine_name': 'PCV', 'dose_number': 3, 'schedule_reference': '14 weeks', 'description': 'PCV 3'},
                {'vaccine_name': 'MMR', 'dose_number': 1, 'schedule_reference': '9 months', 'description': 'MMR 1'},
                {'vaccine_name': 'MMR', 'dose_number': 2, 'schedule_reference': '12 months', 'description': 'MMR 2'},
            ]
            for v in vaccines:
                vac = Vaccine(vaccine_name=v['vaccine_name'], dose_number=v['dose_number'],
                              schedule_reference=v['schedule_reference'], description=v['description'], status='active')
                db.session.add(vac)

            db.session.commit()

    def get_auth_header(self, username='admin', password='admin123'):
        """Helper to get JWT auth header"""
        resp = self.client.post('/api/auth/login', json={'username': username, 'password': password})
        data = resp.get_json()
        return {'Authorization': f"Bearer {data['token']}"}

    # -------------------------------------------------------------
    # 1. Schema & Table Tests
    # -------------------------------------------------------------
    def test_01_all_eight_tables_exist(self):
        """Test that all 8 required tables exist in SQLite"""
        with self.app.app_context():
            inspector = sa_inspect(db.engine)
            tables = inspector.get_table_names()
            required = [
                'users', 'guardians', 'children', 'vaccines',
                'immunization_records', 'ai_assessments',
                'sms_notifications', 'audit_logs'
            ]
            for table in required:
                self.assertIn(table, tables, f"Missing table: {table}")
            self.assertEqual(len([t for t in required if t in tables]), 8)

    def test_02_default_users_seeded(self):
        """Test default accounts exist and passwords hash properly"""
        with self.app.app_context():
            admin = User.query.filter_by(username='admin').first()
            self.assertIsNotNone(admin)
            self.assertEqual(admin.role, 'administrator')
            self.assertTrue(admin.check_password('admin123'))
            self.assertFalse(admin.check_password('wrongpass'))

            hw = User.query.filter_by(username='healthworker').first()
            self.assertIsNotNone(hw)
            self.assertEqual(hw.role, 'health_worker')
            self.assertTrue(hw.check_password('worker123'))

    def test_03_vaccines_seeded(self):
        """Test exactly 19 vaccine records exist"""
        with self.app.app_context():
            count = Vaccine.query.count()
            self.assertEqual(count, 19, f"Expected 19 vaccines, got {count}")

    # -------------------------------------------------------------
    # 2. Authentication API Tests
    # -------------------------------------------------------------
    def test_04_admin_login(self):
        """Test admin login returns token and user info"""
        resp = self.client.post('/api/auth/login', json={'username': 'admin', 'password': 'admin123'})
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertIn('token', data)
        self.assertEqual(data['user']['role'], 'administrator')

    def test_05_healthworker_login(self):
        """Test health worker login returns token and user info"""
        resp = self.client.post('/api/auth/login', json={'username': 'healthworker', 'password': 'worker123'})
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertIn('token', data)
        self.assertEqual(data['user']['role'], 'health_worker')

    def test_06_invalid_login(self):
        """Test login with wrong password fails with 401"""
        resp = self.client.post('/api/auth/login', json={'username': 'admin', 'password': 'wrongpassword'})
        self.assertEqual(resp.status_code, 401)

    def test_07_verify_token(self):
        """Test token verification endpoint"""
        headers = self.get_auth_header('admin', 'admin123')
        resp = self.client.get('/api/auth/verify', headers=headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertEqual(data['user']['username'], 'admin')

    # -------------------------------------------------------------
    # 3. Guardian CRUD Tests
    # -------------------------------------------------------------
    def test_08_guardian_crud(self):
        """Test Guardian Create, Read, Update"""
        headers = self.get_auth_header()

        # Create
        create_resp = self.client.post('/api/guardians', headers=headers, json={
            'full_name': 'Maria Santos',
            'relationship': 'Mother',
            'contact_number': '09171234567',
            'address': 'Homapon, Legazpi City',
            'notification_enabled': True
        })
        self.assertEqual(create_resp.status_code, 201)
        guardian = create_resp.get_json()['guardian']
        gid = guardian['guardian_id']

        # Read list
        list_resp = self.client.get('/api/guardians', headers=headers)
        self.assertEqual(list_resp.status_code, 200)
        self.assertGreaterEqual(list_resp.get_json()['total'], 1)

        # Read single
        get_resp = self.client.get(f'/api/guardians/{gid}', headers=headers)
        self.assertEqual(get_resp.status_code, 200)
        self.assertEqual(get_resp.get_json()['guardian']['full_name'], 'Maria Santos')

        # Update
        update_resp = self.client.put(f'/api/guardians/{gid}', headers=headers, json={
            'full_name': 'Maria S. Santos',
            'relationship': 'Mother',
            'contact_number': '09181234567'
        })
        self.assertEqual(update_resp.status_code, 200)
        self.assertEqual(update_resp.get_json()['guardian']['full_name'], 'Maria S. Santos')

    # -------------------------------------------------------------
    # 4. Child CRUD Tests
    # -------------------------------------------------------------
    def test_09_child_crud(self):
        """Test Child Create, Read, Search, Update, Archive"""
        headers = self.get_auth_header()

        # Ensure guardian exists
        with self.app.app_context():
            guardian = Guardian.query.first()
            gid = guardian.guardian_id

        # Create
        create_resp = self.client.post('/api/children', headers=headers, json={
            'first_name': 'Juan',
            'middle_name': 'Reyes',
            'last_name': 'Santos',
            'birth_date': '2025-06-01',
            'sex': 'male',
            'address': 'Homapon, Legazpi City',
            'guardian_id': gid
        })
        self.assertEqual(create_resp.status_code, 201)
        child = create_resp.get_json()['child']
        cid = child['child_id']

        # Read list
        list_resp = self.client.get('/api/children', headers=headers)
        self.assertEqual(list_resp.status_code, 200)

        # Search
        search_resp = self.client.get('/api/children?search=Juan', headers=headers)
        self.assertEqual(search_resp.status_code, 200)
        self.assertGreaterEqual(search_resp.get_json()['total'], 1)

        # Read single
        get_resp = self.client.get(f'/api/children/{cid}', headers=headers)
        self.assertEqual(get_resp.status_code, 200)
        self.assertEqual(get_resp.get_json()['child']['first_name'], 'Juan')

        # Update
        update_resp = self.client.put(f'/api/children/{cid}', headers=headers, json={
            'first_name': 'Juan Carlos'
        })
        self.assertEqual(update_resp.status_code, 200)
        self.assertEqual(update_resp.get_json()['child']['first_name'], 'Juan Carlos')

        # Archive
        archive_resp = self.client.patch(f'/api/children/{cid}/archive', headers=headers)
        self.assertEqual(archive_resp.status_code, 200)

        # Re-activate for following tests
        with self.app.app_context():
            c = Child.query.get(cid)
            c.status = 'active'
            db.session.commit()

    # -------------------------------------------------------------
    # 5. Vaccine Retrieval Tests
    # -------------------------------------------------------------
    def test_10_vaccine_endpoints(self):
        """Test Vaccine retrieval endpoints"""
        headers = self.get_auth_header()

        list_resp = self.client.get('/api/vaccines', headers=headers)
        self.assertEqual(list_resp.status_code, 200)
        vaccines = list_resp.get_json()['vaccines']
        self.assertEqual(len(vaccines), 19)

        vid = vaccines[0]['vaccine_id']
        single_resp = self.client.get(f'/api/vaccines/{vid}', headers=headers)
        self.assertEqual(single_resp.status_code, 200)

    # -------------------------------------------------------------
    # 6. Immunization Record CRUD Tests
    # -------------------------------------------------------------
    def test_11_immunization_crud(self):
        """Test Immunization record CRUD and duplicate prevention"""
        headers = self.get_auth_header()

        with self.app.app_context():
            child = Child.query.filter_by(status='active').first()
            cid = child.child_id
            vaccine = Vaccine.query.first()
            vid = vaccine.vaccine_id

        # Create
        create_resp = self.client.post('/api/immunization', headers=headers, json={
            'child_id': cid,
            'vaccine_id': vid,
            'date_administered': '2025-06-15',
            'remarks': 'First dose given at health center'
        })
        self.assertEqual(create_resp.status_code, 201)
        record = create_resp.get_json()['record']
        rid = record['record_id']

        # Prevent Duplicate
        dup_resp = self.client.post('/api/immunization', headers=headers, json={
            'child_id': cid,
            'vaccine_id': vid,
            'date_administered': '2025-06-15',
            'remarks': 'Duplicate attempt'
        })
        self.assertEqual(dup_resp.status_code, 400)

        # Read list
        list_resp = self.client.get(f'/api/immunization?child_id={cid}', headers=headers)
        self.assertEqual(list_resp.status_code, 200)
        self.assertGreaterEqual(list_resp.get_json()['total'], 1)

        # Read single
        get_resp = self.client.get(f'/api/immunization/{rid}', headers=headers)
        self.assertEqual(get_resp.status_code, 200)

        # Update
        update_resp = self.client.put(f'/api/immunization/{rid}', headers=headers, json={
            'remarks': 'Updated remarks - no adverse reactions'
        })
        self.assertEqual(update_resp.status_code, 200)

        # Child immunization history
        hist_resp = self.client.get(f'/api/children/{cid}/immunization-history', headers=headers)
        self.assertEqual(hist_resp.status_code, 200)
        self.assertGreaterEqual(len(hist_resp.get_json()['history']), 1)

    # -------------------------------------------------------------
    # 7. Schedules & Dashboard Stats Tests
    # -------------------------------------------------------------
    def test_12_schedule_endpoints(self):
        """Test schedule and dashboard statistics endpoints"""
        headers = self.get_auth_header()

        up_resp = self.client.get('/api/schedules/upcoming', headers=headers)
        self.assertEqual(up_resp.status_code, 200)

        due_resp = self.client.get('/api/schedules/due', headers=headers)
        self.assertEqual(due_resp.status_code, 200)

        overdue_resp = self.client.get('/api/schedules/overdue', headers=headers)
        self.assertEqual(overdue_resp.status_code, 200)

        stats_resp = self.client.get('/api/schedules/dashboard-stats', headers=headers)
        self.assertEqual(stats_resp.status_code, 200)
        stats = stats_resp.get_json()
        self.assertIn('total_children', stats)
        self.assertIn('total_immunizations', stats)
        self.assertIn('total_vaccines', stats)

    # -------------------------------------------------------------
    # 8. AI Assessment Tests
    # -------------------------------------------------------------
    def test_13_ai_assessment_endpoints(self):
        """Test AI risk assessment individual and batch endpoints"""
        headers = self.get_auth_header()

        with self.app.app_context():
            child = Child.query.filter_by(status='active').first()
            cid = child.child_id

        # Individual Assessment
        assess_resp = self.client.post(f'/api/ai/assess/{cid}', headers=headers)
        self.assertEqual(assess_resp.status_code, 201)
        assessment = assess_resp.get_json()['assessment']
        aid = assessment['assessment_id']
        self.assertIn(assessment['risk_level'], ['low', 'moderate', 'high'])

        # Read assessment list
        list_resp = self.client.get('/api/ai/assessments', headers=headers)
        self.assertEqual(list_resp.status_code, 200)
        self.assertGreaterEqual(list_resp.get_json()['total'], 1)

        # Read single assessment
        get_resp = self.client.get(f'/api/ai/assessments/{aid}', headers=headers)
        self.assertEqual(get_resp.status_code, 200)

        # Batch assessment
        batch_resp = self.client.post('/api/ai/batch-assess', headers=headers, json={'child_ids': [cid]})
        self.assertEqual(batch_resp.status_code, 200)

    # -------------------------------------------------------------
    # 9. SMS Notifications Tests
    # -------------------------------------------------------------
    def test_14_sms_endpoints(self):
        """Test SMS notifications send, batch, and logs"""
        headers = self.get_auth_header()

        with self.app.app_context():
            child = Child.query.filter_by(status='active').first()
            cid = child.child_id

        # Send SMS
        send_resp = self.client.post('/api/sms/send', headers=headers, json={
            'child_id': cid,
            'notification_type': 'upcoming',
            'message': 'Reminder: Vaccination is due soon.'
        })
        self.assertEqual(send_resp.status_code, 201)
        sms = send_resp.get_json()['sms']
        self.assertEqual(sms['notification_type'], 'upcoming')
        self.assertIn(sms['delivery_status'], ['sent', 'pending', 'delivered', 'failed'])

        # SMS logs
        logs_resp = self.client.get('/api/sms/logs', headers=headers)
        self.assertEqual(logs_resp.status_code, 200)
        self.assertGreaterEqual(logs_resp.get_json()['total'], 1)

        # Batch send SMS
        batch_resp = self.client.post('/api/sms/batch-send', headers=headers, json={
            'child_ids': [cid],
            'notification_type': 'due',
            'message': 'Vaccination due today'
        })
        self.assertEqual(batch_resp.status_code, 200)

    # -------------------------------------------------------------
    # 10. Reports Endpoints Tests
    # -------------------------------------------------------------
    def test_15_reports_endpoints(self):
        """Test all reports endpoints"""
        headers = self.get_auth_header()

        r_child = self.client.get('/api/reports/children', headers=headers)
        self.assertEqual(r_child.status_code, 200)

        r_imm = self.client.get('/api/reports/immunization', headers=headers)
        self.assertEqual(r_imm.status_code, 200)

        r_ai = self.client.get('/api/reports/ai-assessment', headers=headers)
        self.assertEqual(r_ai.status_code, 200)
        self.assertIn('risk_counts', r_ai.get_json())

        r_sms = self.client.get('/api/reports/sms', headers=headers)
        self.assertEqual(r_sms.status_code, 200)
        self.assertIn('status_counts', r_sms.get_json())

    # -------------------------------------------------------------
    # 11. User Management Tests
    # -------------------------------------------------------------
    def test_16_user_management(self):
        """Test User CRUD and toggle status (admin only)"""
        headers = self.get_auth_header()

        # Create user
        create_resp = self.client.post('/api/users', headers=headers, json={
            'full_name': 'Test Nurse',
            'username': 'testnurse',
            'password': 'password123',
            'role': 'health_worker'
        })
        self.assertEqual(create_resp.status_code, 201)
        uid = create_resp.get_json()['user']['user_id']

        # Get list
        list_resp = self.client.get('/api/users', headers=headers)
        self.assertEqual(list_resp.status_code, 200)

        # Get single
        get_resp = self.client.get(f'/api/users/{uid}', headers=headers)
        self.assertEqual(get_resp.status_code, 200)

        # Update
        update_resp = self.client.put(f'/api/users/{uid}', headers=headers, json={
            'full_name': 'Test Nurse Updated'
        })
        self.assertEqual(update_resp.status_code, 200)

        # Toggle status
        toggle_resp = self.client.patch(f'/api/users/{uid}/toggle-status', headers=headers)
        self.assertEqual(toggle_resp.status_code, 200)
        self.assertEqual(toggle_resp.get_json()['user']['status'], 'inactive')

    # -------------------------------------------------------------
    # 12. Audit Logging Tests
    # -------------------------------------------------------------
    def test_17_audit_logs(self):
        """Test audit logs are recorded and retrievable"""
        headers = self.get_auth_header()

        resp = self.client.get('/api/audit/logs', headers=headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertIn('logs', data)
        self.assertGreaterEqual(data['total'], 1)


if __name__ == '__main__':
    unittest.main(verbosity=2)
