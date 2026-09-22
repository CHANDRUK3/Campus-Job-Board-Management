import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { Bell, ChevronDown, User, Settings, CircleHelp, LogOut } from 'lucide-react';
import '../../../style.css';

const Topbar = ({ user: propUser, onToggleSidebar }) => {
  const { user: authUser, logout } = useAuth();
  const user = propUser || authUser;
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Compute breadcrumb title from path
  const getBreadcrumbTitle = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'Dashboard';
    if (path.includes('/drives')) return 'Placement Drives';
    if (path.includes('/applications')) return 'My Applications';
    if (path.includes('/calendar')) return 'Recruitment Calendar';
    if (path.includes('/profile')) return 'My Profile';
    if (path.includes('/documents')) return 'Documents';
    if (path.includes('/career-preparation')) return 'Career Preparation';
    if (path.includes('/notifications')) return 'Notifications';
    if (path.includes('/analytics')) return 'Analytics';
    if (path.includes('/students')) return 'Students Verification';
    if (path.includes('/companies')) return 'Companies Management';
    if (path.includes('/recruitment-events')) return 'Recruitment Events';
    if (path.includes('/reports')) return 'Reports & Exports';
    if (path.includes('/settings')) return 'Settings';
    return 'Dashboard';
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const role = user?.role || 'student';
  const notifPath = role === 'admin' ? '/admin/notifications' : '/student/notifications';
  const profilePath = role === 'admin' ? '/admin/dashboard' : '/student/profile';
  const settingsPath = role === 'admin' ? '/admin/settings' : '/student/settings';

  return (
    <header className="app-topbar">
      {/* Left Breadcrumb */}
      <div className="topbar-breadcrumb">
        <span className="root-title">Campus Placement</span>
        <span>/</span>
        <span style={{ color: 'var(--ink)', fontWeight: '600' }}>{getBreadcrumbTitle()}</span>
      </div>

      {/* Right Actions & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>
        {/* Notification Bell */}
        <button
          onClick={() => navigate(notifPath)}
          style={{
            background: 'var(--paper)',
            border: '1px solid var(--border)',
            width: '38px',
            height: '38px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--ink-soft)'
          }}
          title="Notifications"
        >
          <Bell size={18} />
        </button>

        {/* User Pill & Avatar */}
        <div
          onClick={() => setDropdownOpen(!dropdownOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '4px 12px 4px 6px',
            borderRadius: '20px',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            background: 'var(--navy)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: '700',
            fontFamily: 'var(--font-serif)'
          }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--ink)', lineHeight: 1.2 }}>
              {user?.name || 'John Doe'}
            </span>
            <span style={{ fontSize: '10px', color: 'var(--gold-deep)', fontWeight: '600', fontFamily: 'var(--font-mono)' }}>
              {role === 'admin' ? 'Placement Cell' : 'Student'}
            </span>
          </div>
          <ChevronDown size={14} style={{ color: 'var(--muted)', marginLeft: '2px' }} />
        </div>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div style={{
            position: 'absolute',
            top: '48px',
            right: 0,
            width: '210px',
            background: '#ffffff',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            boxShadow: 'var(--shadow-md)',
            padding: '6px 0',
            zIndex: 200
          }}>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-soft)', fontSize: '12px' }}>
              <div style={{ fontWeight: '600', color: 'var(--ink)' }}>{user?.name}</div>
              <div style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{user?.email}</div>
            </div>
            <Link
              to={profilePath}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', color: 'var(--ink)', textDecoration: 'none', fontSize: '13px' }}
              onClick={() => setDropdownOpen(false)}
            >
              <User size={16} /> Profile / Account
            </Link>
            <Link
              to={settingsPath}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', color: 'var(--ink)', textDecoration: 'none', fontSize: '13px' }}
              onClick={() => setDropdownOpen(false)}
            >
              <Settings size={16} /> Settings
            </Link>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', color: 'var(--ink)', cursor: 'pointer', fontSize: '13px' }}
              onClick={() => { setDropdownOpen(false); alert('Campus Placement Help Center: Contact placement@campus.edu'); }}
            >
              <CircleHelp size={16} /> Help & Support
            </div>
            <div style={{ borderTop: '1px solid var(--border-soft)', marginTop: '4px' }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', color: 'var(--brick)', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                onClick={handleLogout}
              >
                <LogOut size={16} /> Logout
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Topbar;
