import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UsersRound, 
  UserRound, 
  Syringe, 
  CalendarClock, 
  BrainCircuit, 
  MessageSquare, 
  BarChart3, 
  ShieldCheck, 
  Settings, 
  LogOut,
  Activity,
  X
} from 'lucide-react';
import authService from '../../services/authService';
import { toast } from 'react-toastify';

export function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const isAdmin = authService.isAdmin();

  const handleLogout = () => {
    authService.logout();
    toast.info('Logged out successfully');
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/children', label: 'Children', icon: UsersRound },
    { to: '/guardians', label: 'Guardians', icon: UserRound },
    { to: '/immunization', label: 'Immunization', icon: Syringe },
    { to: '/schedule', label: 'Schedule', icon: CalendarClock },
    { to: '/ai-assessment', label: 'AI Assessment', icon: BrainCircuit },
    { to: '/sms', label: 'SMS Notifications', icon: MessageSquare },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
  ];

  if (isAdmin) {
    navItems.push({ to: '/users', label: 'Users', icon: ShieldCheck, badge: 'Admin' });
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-lg-none"
          style={{ zIndex: 1040 }}
          onClick={onClose}
        />
      )}

      <aside className={`app-sidebar ${isOpen ? 'd-flex' : 'd-none d-lg-flex'}`}>
        {/* Brand Header */}
        <div className="sidebar-brand">
          <div className="brand-icon-box">
            <Activity size={22} strokeWidth={2.5} />
          </div>
          <div className="flex-grow-1">
            <div className="fw-bold" style={{ fontSize: '0.95rem', lineHeight: '1.2', color: 'var(--primary-dark)' }}>
              Homapon Health
            </div>
            <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
              Immunization System
            </div>
          </div>
          {/* Mobile Close Button */}
          <button 
            className="btn btn-sm btn-link text-muted p-0 d-lg-none"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="py-3 flex-grow-1 overflow-auto">
          <div className="px-3 pb-2 text-uppercase text-muted fw-bold" style={{ fontSize: '0.68rem', letterSpacing: '0.05em' }}>
            Main Menu
          </div>
          <nav className="nav flex-column">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `nav-link-health ${isActive ? 'active' : ''}`}
                  onClick={() => onClose && onClose()}
                >
                  <Icon size={18} strokeWidth={2} />
                  <span className="flex-grow-1">{item.label}</span>
                  {item.badge && (
                    <span className="badge rounded-pill bg-warning text-dark fw-bold" style={{ fontSize: '0.65rem' }}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className="px-3 pt-4 pb-2 text-uppercase text-muted fw-bold" style={{ fontSize: '0.68rem', letterSpacing: '0.05em' }}>
            System
          </div>
          <nav className="nav flex-column">
            <NavLink
              to="/settings"
              className={({ isActive }) => `nav-link-health ${isActive ? 'active' : ''}`}
              onClick={() => onClose && onClose()}
            >
              <Settings size={18} strokeWidth={2} />
              <span>Settings</span>
            </NavLink>
          </nav>
        </div>

        {/* User Footer Profile */}
        <div className="p-3 border-top" style={{ borderColor: 'var(--border-light)', backgroundColor: '#FAFCFB' }}>
          <div className="d-flex align-items-center gap-2 mb-2">
            <div className="user-avatar-badge">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden">
              <div className="fw-bold text-truncate" style={{ fontSize: '0.85rem' }}>
                {user?.full_name || 'Health Personnel'}
              </div>
              <div className="text-muted text-capitalize small" style={{ fontSize: '0.72rem' }}>
                {user?.role?.replace('_', ' ') || 'Staff'}
              </div>
            </div>
          </div>
          <button 
            className="btn btn-sm btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-1 rounded-3 py-1"
            style={{ fontSize: '0.8rem' }}
            onClick={handleLogout}
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
