import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import Button from '../Button';
import { LogIn, UserPlus, LayoutDashboard, LogOut, GraduationCap } from 'lucide-react';
import '../../../style.css';

const PublicNavbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleDashboardRedirect = () => {
    if (user?.role === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/student/dashboard');
    }
  };

  const navItems = [
    { label: 'Placement Drives', path: '/placement-drives' },
    { label: 'Companies', path: '/companies' },
    { label: 'How It Works', path: '/how-it-works' },
    { label: 'Career Resources', path: '/career-resources' },
  ];

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      height: '68px',
      background: '#ffffff',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Left: Brand Identity */}
      <div 
        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        onClick={() => navigate('/')}
      >
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '6px',
          background: 'var(--navy-deep)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-serif)',
          fontWeight: '700',
          fontSize: '17px',
          boxShadow: '0 2px 4px rgba(12, 27, 54, 0.15)'
        }}>
          CP
        </div>
        <div>
          <span style={{ 
            fontFamily: 'var(--font-serif)', 
            fontWeight: '700', 
            fontSize: '18px', 
            color: 'var(--navy-deep)',
            letterSpacing: '-0.3px',
            display: 'block',
            lineHeight: 1.1
          }}>
            Campus Placement
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            display: 'block'
          }}>
            Institutional Portal
          </span>
        </div>
      </div>

      {/* Middle: Navigation Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                fontWeight: isActive ? '600' : '500',
                color: isActive ? 'var(--navy)' : 'var(--text-secondary)',
                textDecoration: 'none',
                padding: '8px 12px',
                borderRadius: '6px',
                background: isActive ? 'var(--navy-tint)' : 'transparent',
                transition: 'all 0.15s ease'
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Right: Auth Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {!isAuthenticated ? (
          <>
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <Button variant="ghost" size="sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <LogIn size={15} />
                <span>Sign In</span>
              </Button>
            </Link>
            <Link to="/signup" style={{ textDecoration: 'none' }}>
              <Button className="btn-gold" size="sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <UserPlus size={15} />
                <span>Sign Up</span>
              </Button>
            </Link>
          </>
        ) : (
          <>
            <Button
              className="btn-gold"
              size="sm"
              onClick={handleDashboardRedirect}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <LayoutDashboard size={15} />
              <span>Go to Dashboard</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--brick)' }}
            >
              <LogOut size={15} />
              <span>Logout</span>
            </Button>
          </>
        )}
      </div>
    </nav>
  );
};

export default PublicNavbar;
