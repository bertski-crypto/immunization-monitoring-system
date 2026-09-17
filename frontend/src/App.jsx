import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import authService from './services/authService';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Children from './pages/Children';
import ChildProfile from './pages/ChildProfile';
import Guardians from './pages/Guardians';
import Immunization from './pages/Immunization';
import Schedule from './pages/Schedule';
import AIAssessment from './pages/AIAssessment';
import SMSNotifications from './pages/SMSNotifications';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Settings from './pages/Settings';

// Layout
import MainLayout from './components/layout/MainLayout';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Admin Only Route Component
const AdminRoute = ({ children }) => {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  if (!authService.isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="children" element={<Children />} />
          <Route path="children/:id" element={<ChildProfile />} />
          <Route path="guardians" element={<Guardians />} />
          <Route path="immunization" element={<Immunization />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="ai-assessment" element={<AIAssessment />} />
          <Route path="sms" element={<SMSNotifications />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route
            path="users"
            element={
              <AdminRoute>
                <Users />
              </AdminRoute>
            }
          />
        </Route>
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
