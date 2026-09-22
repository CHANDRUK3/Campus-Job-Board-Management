import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import {
  LayoutDashboard,
  BriefcaseBusiness,
  ClipboardList,
  CalendarDays,
  UserRound,
  FileText,
  GraduationCap,
  Bell,
  BarChart3,
  Building2,
  Settings,
  CircleHelp,
  LogOut
} from 'lucide-react';
import '../../../style.css';

const Sidebar = ({ user: propUser }) => {
  const location = useLocation();
  const { user: authUser, logout } = useAuth();
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user?.role || user?.user?.role || authUser?.role || storedUser?.role || (location.pathname.startsWith('/admin') ? 'admin' : 'student');

  const isActive = (path) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  const handleLogout = async (e) => {
    e.preventDefault();
    await logout();
    window.location.href = '/login';
  };

  return (
    <aside className="app-sidebar">
      <div>
        {/* Brand Header */}
        <div className="sidebar-brand">
          <div className="brand-badge">CP</div>
          <div>
            <div className="brand-title">Campus Placement</div>
            <div className="brand-subtitle">
              {role === 'admin' ? 'PLACEMENT CELL' : 'STUDENT PORTAL'}
            </div>
          </div>
        </div>

        {/* Navigation Groups */}
        <nav style={{ padding: '16px 0' }}>
          {role === 'student' ? (
            <>
              <div className="sidebar-group-label">OVERVIEW</div>
              <Link className={`sidebar-link ${isActive('/student/dashboard') ? 'active' : ''}`} to="/student/dashboard">
                <LayoutDashboard className="nav-icon" /> Dashboard
              </Link>

              <div className="sidebar-group-label">PLACEMENT</div>
              <Link className={`sidebar-link ${isActive('/student/drives') ? 'active' : ''}`} to="/student/drives">
                <BriefcaseBusiness className="nav-icon" /> Placement Drives
              </Link>
              <Link className={`sidebar-link ${isActive('/student/applications') ? 'active' : ''}`} to="/student/applications">
                <ClipboardList className="nav-icon" /> My Applications
              </Link>
              <Link className={`sidebar-link ${isActive('/student/calendar') ? 'active' : ''}`} to="/student/calendar">
                <CalendarDays className="nav-icon" /> Calendar
              </Link>

              <div className="sidebar-group-label">PROFILE</div>
              <Link className={`sidebar-link ${isActive('/student/profile') ? 'active' : ''}`} to="/student/profile">
                <UserRound className="nav-icon" /> My Profile
              </Link>
              <Link className={`sidebar-link ${isActive('/student/documents') ? 'active' : ''}`} to="/student/documents">
                <FileText className="nav-icon" /> Documents
              </Link>
              <Link className={`sidebar-link ${isActive('/student/career-preparation') ? 'active' : ''}`} to="/student/career-preparation">
                <GraduationCap className="nav-icon" /> Career Preparation
              </Link>

              <div className="sidebar-group-label">COMMUNICATION</div>
              <Link className={`sidebar-link ${isActive('/student/notifications') ? 'active' : ''}`} to="/student/notifications">
                <Bell className="nav-icon" /> Notifications
              </Link>

              <div className="sidebar-group-label">INSIGHTS</div>
              <Link className={`sidebar-link ${isActive('/student/analytics') ? 'active' : ''}`} to="/student/analytics">
                <BarChart3 className="nav-icon" /> Analytics
              </Link>
            </>
          ) : (
            <>
              <div className="sidebar-group-label">OVERVIEW</div>
              <Link className={`sidebar-link ${isActive('/admin/dashboard') ? 'active' : ''}`} to="/admin/dashboard">
                <LayoutDashboard className="nav-icon" /> Dashboard
              </Link>

              <div className="sidebar-group-label">PLACEMENT MANAGEMENT</div>
              <Link className={`sidebar-link ${isActive('/admin/students') ? 'active' : ''}`} to="/admin/students">
                <GraduationCap className="nav-icon" /> Students
              </Link>
              <Link className={`sidebar-link ${isActive('/admin/companies') ? 'active' : ''}`} to="/admin/companies">
                <Building2 className="nav-icon" /> Companies
              </Link>
              <Link className={`sidebar-link ${isActive('/admin/drives') ? 'active' : ''}`} to="/admin/drives">
                <BriefcaseBusiness className="nav-icon" /> Placement Drives
              </Link>
              <Link className={`sidebar-link ${isActive('/admin/applications') ? 'active' : ''}`} to="/admin/applications">
                <ClipboardList className="nav-icon" /> Applications
              </Link>
              <Link className={`sidebar-link ${isActive('/admin/recruitment-events') ? 'active' : ''}`} to="/admin/recruitment-events">
                <CalendarDays className="nav-icon" /> Recruitment Events
              </Link>

              <div className="sidebar-group-label">COMMUNICATION</div>
              <Link className={`sidebar-link ${isActive('/admin/notifications') ? 'active' : ''}`} to="/admin/notifications">
                <Bell className="nav-icon" /> Notifications
              </Link>

              <div className="sidebar-group-label">INSIGHTS</div>
              <Link className={`sidebar-link ${isActive('/admin/analytics') ? 'active' : ''}`} to="/admin/analytics">
                <BarChart3 className="nav-icon" /> Analytics
              </Link>
              <Link className={`sidebar-link ${isActive('/admin/reports') ? 'active' : ''}`} to="/admin/reports">
                <FileText className="nav-icon" /> Reports
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* Bottom Footer Section */}
      <div style={{
        padding: '16px 0',
        borderTop: '1px solid var(--border-soft)'
      }}>
        <Link className={`sidebar-link ${isActive('/student/settings') || isActive('/admin/settings') ? 'active' : ''}`} to={role === 'admin' ? '/admin/settings' : '/student/settings'}>
          <Settings className="nav-icon" /> Settings
        </Link>
        <button
          className="sidebar-link"
          style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', color: 'var(--brick)' }}
          onClick={(e) => {
            if (window.confirm('Are you sure you want to log out?')) {
              handleLogout(e);
            }
          }}
        >
          <CircleHelp className="nav-icon" style={{ color: 'var(--muted)' }} /> Help
        </button>
        <button
          className="sidebar-link"
          style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', color: 'var(--brick)' }}
          onClick={handleLogout}
        >
          <LogOut className="nav-icon" style={{ color: 'var(--brick)' }} /> Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
