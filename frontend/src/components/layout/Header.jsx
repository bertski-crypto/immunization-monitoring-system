import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Bell, 
  Menu, 
  ChevronDown, 
  User, 
  LogOut, 
  Settings,
  ShieldAlert
} from 'lucide-react';
import authService from '../../services/authService';

export function Header({ onToggleSidebar }) {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/children?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <header className="app-header d-flex align-items-center justify-content-between">
      {/* Mobile Menu Button + Search */}
      <div className="d-flex align-items-center gap-3 flex-grow-1">
        <button 
          className="btn btn-sm btn-health-outline p-2 d-lg-none"
          onClick={onToggleSidebar}
          aria-label="Toggle Navigation"
        >
          <Menu size={20} />
        </button>

        <form onSubmit={handleSearch} className="header-search-box d-none d-md-block">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search children, guardians, or records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>

      {/* Right User & Notification Controls */}
      <div className="d-flex align-items-center gap-3">
        {/* Notification Bell */}
        <button 
          className="btn btn-sm p-2 rounded-circle border-0 position-relative"
          style={{ backgroundColor: 'var(--mint)', color: 'var(--primary)' }}
          onClick={() => navigate('/schedule')}
          title="Vaccination Alerts"
        >
          <Bell size={18} />
          <span 
            className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle"
            style={{ width: '8px', height: '8px' }}
          />
        </button>

        {/* User Badge Dropdown */}
        <div className="position-relative">
          <button 
            className="btn btn-sm d-flex align-items-center gap-2 p-1 border-0 bg-transparent"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div className="user-avatar-badge">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'H'}
            </div>
            <div className="text-start d-none d-sm-block">
              <div className="fw-bold" style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.2' }}>
                {user?.full_name || 'Health Personnel'}
              </div>
              <div className="text-muted text-capitalize" style={{ fontSize: '0.72rem' }}>
                {user?.role?.replace('_', ' ') || 'Health Center Staff'}
              </div>
            </div>
            <ChevronDown size={14} className="text-muted d-none d-sm-block" />
          </button>

          {/* User Menu */}
          {showDropdown && (
            <div 
              className="position-absolute end-0 mt-2 py-2 bg-white rounded-3 shadow-lg border"
              style={{ width: '200px', zIndex: 1050, borderColor: 'var(--border-color)' }}
            >
              <div className="px-3 py-2 border-bottom" style={{ borderColor: 'var(--border-light)' }}>
                <div className="fw-bold small">{user?.full_name}</div>
                <div className="text-muted small">@{user?.username}</div>
              </div>
              <button 
                className="dropdown-item d-flex align-items-center gap-2 px-3 py-2 small text-secondary"
                onClick={() => { setShowDropdown(false); navigate('/settings'); }}
              >
                <Settings size={15} />
                <span>Settings</span>
              </button>
              <button 
                className="dropdown-item d-flex align-items-center gap-2 px-3 py-2 small text-danger"
                onClick={handleLogout}
              >
                <LogOut size={15} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
