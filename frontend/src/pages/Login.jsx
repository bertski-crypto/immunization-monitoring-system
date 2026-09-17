import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Eye, 
  EyeOff, 
  Lock, 
  User, 
  ShieldCheck, 
  Sparkles, 
  Bell, 
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { toast } from 'react-toastify';
import authService from '../services/authService';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await authService.login(username.trim(), password);
      toast.success('Welcome back to Homapon Health System!');
      navigate('/dashboard');
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Invalid username or password. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-vh-100 d-flex flex-column flex-lg-row" style={{ backgroundColor: 'var(--bg-app)' }}>
      {/* Left Column: Branding / Healthcare Overview */}
      <div 
        className="d-none d-lg-flex col-lg-6 p-5 flex-column justify-content-between text-white position-relative"
        style={{
          background: 'linear-gradient(145deg, #0F5F54 0%, #147D6B 60%, #1EA886 100%)',
          boxShadow: '4px 0 24px rgba(15, 95, 84, 0.15)'
        }}
      >
        {/* Brand Header */}
        <div className="d-flex align-items-center gap-3">
          <div className="p-2 rounded-3 bg-white text-dark d-flex align-items-center justify-content-center" style={{ width: '44px', height: '44px' }}>
            <Activity size={26} color="var(--primary)" strokeWidth={2.5} />
          </div>
          <div>
            <h5 className="fw-bold mb-0 text-white">Barangay Homapon Health Center</h5>
            <small className="text-white-50">City of Legazpi, Albay</small>
          </div>
        </div>

        {/* Central Feature Highlights */}
        <div className="my-auto py-5" style={{ maxWidth: '480px' }}>
          <div className="badge px-3 py-2 rounded-pill mb-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', color: '#E8F8F1' }}>
            Philippine EPI Guidelines Compliant
          </div>
          <h1 className="fw-extrabold text-white mb-3" style={{ fontSize: '2.5rem', lineHeight: '1.2' }}>
            AI-Powered Child Immunization Health Monitoring System
          </h1>
          <p className="text-white-50 fs-6 mb-4">
            Protecting infant and child health through automated schedule monitoring, AI-assisted follow-up prioritization, and direct SMS guardian notifications.
          </p>

          <div className="d-flex flex-column gap-3">
            <div className="d-flex align-items-center gap-3 p-3 rounded-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}>
              <Sparkles size={20} className="text-warning" />
              <div className="small text-white">
                <strong>AI Risk Classification:</strong> Identifies children at risk of delayed or missed vaccinations.
              </div>
            </div>
            <div className="d-flex align-items-center gap-3 p-3 rounded-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}>
              <Bell size={20} className="text-info" />
              <div className="small text-white">
                <strong>SMS Reminders:</strong> Sends instant alerts to parents before and on scheduled dose dates.
              </div>
            </div>
            <div className="d-flex align-items-center gap-3 p-3 rounded-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}>
              <ShieldCheck size={20} className="text-success" />
              <div className="small text-white">
                <strong>EPI Schedule Tracking:</strong> 19 standard Philippine doses from birth to 12 months.
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-white-50 small">
          © {new Date().getFullYear()} Barangay Homapon Health Center. Capstone Health Information System.
        </div>
      </div>

      {/* Right Column: Modern Login Form */}
      <div className="col-12 col-lg-6 d-flex align-items-center justify-content-center p-4 p-sm-5">
        <div className="w-100" style={{ maxWidth: '440px' }}>
          {/* Mobile Brand Header */}
          <div className="d-lg-none text-center mb-4">
            <div className="brand-icon-box mx-auto mb-2">
              <Activity size={24} />
            </div>
            <h4 className="fw-bold mb-0" style={{ color: 'var(--primary-dark)' }}>Homapon Health Center</h4>
            <small className="text-muted">Child Immunization System</small>
          </div>

          <div className="health-card p-4 p-sm-5">
            <div className="mb-4">
              <h3 className="fw-bold mb-1" style={{ color: 'var(--primary-dark)' }}>Account Login</h3>
              <p className="text-muted small mb-0">Sign in with your authorized health personnel credentials</p>
            </div>

            {error && (
              <div className="alert alert-danger d-flex align-items-center gap-2 small py-2 px-3 rounded-3 mb-3">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Username Input */}
              <div className="mb-3">
                <label className="form-label small fw-bold">Username</label>
                <div className="position-relative">
                  <span className="position-absolute top-50 start-0 translate-middle-y ps-3 text-muted">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    className="form-control ps-5"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* Password Input with Show/Hide Toggle */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label small fw-bold mb-0">Password</label>
                </div>
                <div className="position-relative">
                  <span className="position-absolute top-50 start-0 translate-middle-y ps-3 text-muted">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control ps-5 pe-5"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-link position-absolute top-50 end-0 translate-middle-y pe-3 text-muted p-0 border-0"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn-health-primary w-100 justify-content-center py-2 mb-3"
                disabled={loading}
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials Fill */}
            <div className="mt-4 pt-3 border-top" style={{ borderColor: 'var(--border-light)' }}>
              <div className="text-muted small fw-semibold mb-2 text-center" style={{ fontSize: '0.75rem' }}>
                Default Capstone Accounts:
              </div>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-health-secondary w-50 py-1"
                  style={{ fontSize: '0.75rem' }}
                  onClick={() => handleQuickLogin('admin', 'admin123')}
                >
                  Admin (admin)
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-health-secondary w-50 py-1"
                  style={{ fontSize: '0.75rem' }}
                  onClick={() => handleQuickLogin('healthworker', 'worker123')}
                >
                  Health Worker
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
