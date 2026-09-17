import React, { useState } from 'react';
import { 
  User, 
  Shield, 
  Bell, 
  Database, 
  Save, 
  Key, 
  CheckCircle2, 
  Building2 
} from 'lucide-react';
import authService from '../services/authService';
import { toast } from 'react-toastify';

export function Settings() {
  const user = authService.getCurrentUser();
  const isAdmin = authService.isAdmin();

  const [activeTab, setActiveTab] = useState('profile');
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    username: user?.username || '',
    role: user?.role || 'health_worker'
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [smsSettings, setSmsSettings] = useState({
    provider: 'Semaphore (Philippines)',
    senderName: 'BrgyHomapon',
    autoReminders: true,
    reminderDaysBefore: 3
  });

  const handleProfileSave = (e) => {
    e.preventDefault();
    toast.success('Profile settings updated successfully');
  };

  const handlePasswordSave = (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    toast.success('Password updated successfully');
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleSmsSave = (e) => {
    e.preventDefault();
    toast.success('SMS settings saved successfully');
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-4">
        <h2 className="fw-bold mb-1">System Settings</h2>
        <p className="text-muted small mb-0">Manage your profile, center configurations, and system security</p>
      </div>

      <div className="row g-4">
        {/* Settings Navigation Tabs */}
        <div className="col-12 col-md-3">
          <div className="health-card p-2">
            <div className="nav flex-column nav-pills">
              <button
                className={`nav-link-health text-start border-0 ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <User size={16} />
                <span>My Profile</span>
              </button>
              <button
                className={`nav-link-health text-start border-0 ${activeTab === 'security' ? 'active' : ''}`}
                onClick={() => setActiveTab('security')}
              >
                <Key size={16} />
                <span>Security</span>
              </button>
              <button
                className={`nav-link-health text-start border-0 ${activeTab === 'sms' ? 'active' : ''}`}
                onClick={() => setActiveTab('sms')}
              >
                <Bell size={16} />
                <span>SMS Gateway</span>
              </button>
              {isAdmin && (
                <button
                  className={`nav-link-health text-start border-0 ${activeTab === 'center' ? 'active' : ''}`}
                  onClick={() => setActiveTab('center')}
                >
                  <Building2 size={16} />
                  <span>Health Center</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Settings Content Area */}
        <div className="col-12 col-md-9">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="health-card">
              <h5 className="fw-bold mb-3 pb-2 border-bottom">Profile Information</h5>
              <form onSubmit={handleProfileSave}>
                <div className="row g-3">
                  <div className="col-12 col-sm-6">
                    <label className="form-label small fw-bold">Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-12 col-sm-6">
                    <label className="form-label small fw-bold">Username</label>
                    <input
                      type="text"
                      className="form-control"
                      value={profileForm.username}
                      disabled
                    />
                    <small className="text-muted">Username cannot be changed</small>
                  </div>
                  <div className="col-12 col-sm-6">
                    <label className="form-label small fw-bold">Role</label>
                    <input
                      type="text"
                      className="form-control text-capitalize"
                      value={profileForm.role.replace('_', ' ')}
                      disabled
                    />
                  </div>
                  <div className="col-12 text-end mt-4">
                    <button type="submit" className="btn-health-primary">
                      <Save size={16} />
                      <span>Save Changes</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="health-card">
              <h5 className="fw-bold mb-3 pb-2 border-bottom">Change Password</h5>
              <form onSubmit={handlePasswordSave}>
                <div className="row g-3" style={{ maxWidth: '500px' }}>
                  <div className="col-12">
                    <label className="form-label small fw-bold">Current Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-bold">New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-bold">Confirm New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-12 mt-4">
                    <button type="submit" className="btn-health-primary">
                      <Save size={16} />
                      <span>Update Password</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* SMS Tab */}
          {activeTab === 'sms' && (
            <div className="health-card">
              <h5 className="fw-bold mb-3 pb-2 border-bottom">SMS Notification Settings</h5>
              <form onSubmit={handleSmsSave}>
                <div className="row g-3">
                  <div className="col-12 col-sm-6">
                    <label className="form-label small fw-bold">SMS Gateway</label>
                    <input
                      type="text"
                      className="form-control"
                      value={smsSettings.provider}
                      disabled
                    />
                  </div>
                  <div className="col-12 col-sm-6">
                    <label className="form-label small fw-bold">Sender Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={smsSettings.senderName}
                      onChange={(e) => setSmsSettings({ ...smsSettings, senderName: e.target.value })}
                    />
                  </div>
                  <div className="col-12">
                    <div className="form-check form-switch mt-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={smsSettings.autoReminders}
                        onChange={(e) => setSmsSettings({ ...smsSettings, autoReminders: e.target.checked })}
                      />
                      <label className="form-check-label small fw-bold">
                        Enable automated reminder alerts before scheduled vaccinations
                      </label>
                    </div>
                  </div>
                  <div className="col-12 text-end mt-4">
                    <button type="submit" className="btn-health-primary">
                      <Save size={16} />
                      <span>Save SMS Settings</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Health Center Tab */}
          {activeTab === 'center' && isAdmin && (
            <div className="health-card">
              <h5 className="fw-bold mb-3 pb-2 border-bottom">Barangay Health Center Details</h5>
              <div className="row g-3">
                <div className="col-12 col-sm-6">
                  <label className="form-label small fw-bold">Health Center Name</label>
                  <input type="text" className="form-control" value="Barangay Homapon Health Center" disabled />
                </div>
                <div className="col-12 col-sm-6">
                  <label className="form-label small fw-bold">Municipality / City</label>
                  <input type="text" className="form-control" value="Legazpi City, Albay" disabled />
                </div>
                <div className="col-12 col-sm-6">
                  <label className="form-label small fw-bold">Program</label>
                  <input type="text" className="form-control" value="Philippine Expanded Program on Immunization (EPI)" disabled />
                </div>
                <div className="col-12 col-sm-6">
                  <label className="form-label small fw-bold">Database Storage</label>
                  <input type="text" className="form-control" value="SQLite Local (immunization.db)" disabled />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;
