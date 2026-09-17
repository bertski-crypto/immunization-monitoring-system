# Setup and Installation Guide
## AI-Powered Child Immunization Health Monitoring System

This guide will help you set up and run the system on your local machine.

---

## Prerequisites

Before starting, ensure you have the following installed:

1. **Python 3.9+** - [Download Python](https://www.python.org/downloads/)
2. **Node.js 18+** - [Download Node.js](https://nodejs.org/)
3. **Git** (optional) - [Download Git](https://git-scm.com/)

*Note: No MySQL, XAMPP, or phpMyAdmin server is required. The project uses SQLite for local development.*

---

## Step 1: Backend Setup (Flask + SQLite)

### 1.1 Navigate to Backend Directory
```powershell
cd backend
```

### 1.2 Create Python Virtual Environment
```powershell
python -m venv venv
```

### 1.3 Activate Virtual Environment
```powershell
# Windows PowerShell
venv\Scripts\activate

# macOS / Linux
# source venv/bin/activate
```

You should see `(venv)` prefix in your terminal.

### 1.4 Install Python Dependencies
```powershell
pip install -r requirements.txt
```

This will install Flask, Flask-SQLAlchemy, Flask-JWT-Extended, bcrypt, scikit-learn, and other required packages.

### 1.5 Environment Configuration
Copy `.env.example` to `.env` if not already present:
```powershell
copy .env.example .env
```

The default configuration uses SQLite automatically:
```env
SECRET_KEY=dev-secret-key-change-in-production
FLASK_ENV=development
```

### 1.6 Initialize the Database
Initialize the SQLite database with all 8 tables and default data:
```powershell
python init_db.py
```

This will:
- Create `backend/immunization.db`
- Create all 8 required tables
- Seed default users (`admin` and `healthworker`)
- Seed the Philippine EPI vaccine schedule (19 vaccine records)

### 1.7 Start Backend Server
```powershell
python app.py
```

You should see:
```
 * Running on http://127.0.0.1:5000
 * Running on http://0.0.0.0:5000
```

**Keep this terminal window open.**

---

## Step 2: Frontend Setup (React + Vite)

### 2.1 Open New Terminal Window
Open a **new** PowerShell or Command Prompt window (keep backend running).

### 2.2 Navigate to Frontend Directory
```powershell
cd frontend
```

### 2.3 Install Node.js Dependencies
```powershell
npm install
```

### 2.4 Start Frontend Development Server
```powershell
npm run dev
```

You should see:
```
  VITE v5.3.4  ready in XXX ms

  ➜  Local:   http://localhost:5173/
```

**Keep this terminal window open.**

---

## Step 3: Access the Application

### 3.1 Open Your Browser
Navigate to: **http://localhost:5173**

### 3.2 Login with Default Credentials

**Administrator Account:**
- Username: `admin`
- Password: `admin123`
- Role: administrator

**Health Worker Account:**
- Username: `healthworker`
- Password: `worker123`
- Role: health_worker

⚠️ **IMPORTANT:** Change these default passwords immediately after first login!

---

## Step 4: Verify Installation

After logging in, you should see:
1. ✅ Dashboard with statistics
2. ✅ Navigation sidebar with all modules
3. ✅ User profile in sidebar
4. ✅ Child management, Immunizations, AI Assessment, SMS, and Reports

---

## Troubleshooting

### Problem: Backend won't start

**Error: "No module named 'flask'"**
```powershell
venv\Scripts\activate
pip install -r requirements.txt
```

### Problem: Frontend won't start

**Error: "npm: command not found"**
- Install Node.js from https://nodejs.org/

**Error: Module not found errors**
```powershell
npm install
```

### Problem: Login fails

**Check Backend is Running:**
- Open http://localhost:5000/api/health in browser
- Should return: `{"status":"healthy","message":"API is running"}`

**Reinitialize SQLite Database:**
```powershell
cd backend
venv\Scripts\activate
python init_db.py
```

### Problem: CORS errors
Ensure both frontend (port 5173) and backend (port 5000) are running.

---

## Quick Start Summary

**Terminal 1 - Backend:**
```powershell
cd backend
venv\Scripts\activate
python init_db.py
python app.py
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm install
npm run dev
```

**Browser:** http://localhost:5173

---

## Stopping the System

1. **Stop Frontend:** Press `Ctrl+C` in the frontend terminal
2. **Stop Backend:** Press `Ctrl+C` in the backend terminal
3. **Deactivate Virtual Environment:** Type `deactivate` in backend terminal

---

**Last Updated:** September 2026  
**Database:** SQLite (`backend/immunization.db`)  
**Project:** AI-Powered Child Immunization Health Monitoring and Management System
