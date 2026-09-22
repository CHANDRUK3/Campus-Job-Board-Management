import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, allowUnverified = false }) => {
  const location = useLocation();
  const token = localStorage.getItem('accessToken');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [profileStatus, setProfileStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !(user.id || user._id)) {
      setLoading(false);
      return;
    }

    if (user.role !== 'student') {
      setLoading(false);
      return;
    }

    // Fetch profile to verify status
    fetch(`http://localhost:5000/api/profile/${user.id || user._id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (res.status === 404) {
          // No profile created yet
          return { profileStatus: 'pending' };
        }
        return res.json();
      })
      .then(data => {
        setProfileStatus(data.profileStatus || 'pending');
      })
      .catch(err => {
        console.error('Error fetching profile status:', err);
        setProfileStatus('pending');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, user.id, user._id, user.role]);

  if (!token || !user.email) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        color: '#f8fafc',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #38bdf8',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p>Verifying profile status...</p>
        </div>
      </div>
    );
  }

  // Redirect student to onboarding if not verified and not on the profile-setup page
  if (user.role === 'student' && profileStatus !== 'verified' && !allowUnverified) {
    return <Navigate to="/profile-setup" replace />;
  }

  // Redirect student away from profile-setup if already verified
  if (user.role === 'student' && profileStatus === 'verified' && allowUnverified) {
    return <Navigate to="/jobs" replace />;
  }

  return children;
};

export default ProtectedRoute;