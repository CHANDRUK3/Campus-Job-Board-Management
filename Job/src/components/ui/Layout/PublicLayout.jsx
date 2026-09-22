import React from 'react';
import PublicNavbar from './PublicNavbar';
import '../../../style.css';

const PublicLayout = ({ children, hideNavbar = false }) => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--paper)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {!hideNavbar && <PublicNavbar />}
      <main style={{ flex: 1 }}>
        {children}
      </main>
      <footer style={{
        padding: '24px 32px',
        borderTop: '1px solid var(--border)',
        background: '#ffffff',
        textAlign: 'center',
        color: 'var(--muted)',
        fontSize: '13px',
        fontFamily: 'var(--font-mono)'
      }}>
        © {new Date().getFullYear()} Campus Placement Management System · Kongu Engineering College
      </footer>
    </div>
  );
};

export default PublicLayout;
