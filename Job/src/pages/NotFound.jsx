import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button, Card } from '../components/ui';
import '../style.css';

const NotFound = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleDashboardRedirect = () => {
    if (!user) {
      navigate('/login');
    } else if (user.role === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/student/dashboard');
    }
  };

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <Card style={{ textAlign: 'center', maxWidth: '480px', padding: '40px 24px' }}>
        <h1 style={{ fontSize: '72px', margin: 0, color: 'var(--primary)' }}>404</h1>
        <h2 style={{ fontSize: '24px', margin: '12px 0 8px 0', color: 'var(--text-primary)' }}>Page Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          The page you are looking for doesn't exist or has been moved.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Button variant="ghost" onClick={() => navigate('/')}>Return Home</Button>
          <Button onClick={handleDashboardRedirect}>Go to Dashboard</Button>
        </div>
      </Card>
    </div>
  );
};

export default NotFound;
