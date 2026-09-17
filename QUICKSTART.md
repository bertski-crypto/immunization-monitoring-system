# Quick Start Guide - Run in 3 Minutes! ⚡

## Step-by-Step Instructions

### 1️⃣ Start Backend (1.5 minutes)

**Open Terminal Window #1:**
```powershell
cd backend

# Create virtual environment (first time only)
python -m venv venv

# Activate it
venv\Scripts\activate

# Install dependencies (first time only)
pip install -r requirements.txt

# Initialize SQLite database (creates 8 tables, default accounts & vaccines)
python init_db.py

# Start Flask backend server
python app.py
```

✅ Backend running on http://localhost:5000 (SQLite: `backend/immunization.db`)

---

### 2️⃣ Start Frontend (1.5 minutes)

**Open Terminal Window #2:**
```powershell
cd frontend

# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

✅ Frontend running on http://localhost:5173

---

### 3️⃣ Access the System

**Open your browser:** http://localhost:5173

**Login with:**
- Username: `admin`
- Password: `admin123`

🎉 **You're in!** Welcome to the dashboard.

---

## Returning to the Project Later

**Terminal 1 (Backend):**
```powershell
cd backend
venv\Scripts\activate
python app.py
```

**Terminal 2 (Frontend):**
```powershell
cd frontend
npm run dev
```

**Browser:** http://localhost:5173

---

## Test Accounts

| Role | Username | Password |
|------|----------|----------|
| Administrator | admin | admin123 |
| Health Worker | healthworker | worker123 |

⚠️ Change default passwords after first login!

---

**Need detailed help?** See `SETUP_GUIDE.md`
