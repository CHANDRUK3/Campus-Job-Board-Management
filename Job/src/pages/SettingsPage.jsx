import React from 'react';
import { Card, Button, Input } from '../components/ui';
import Sidebar from '../components/ui/Layout/Sidebar';
import Topbar from '../components/ui/Layout/Topbar';
import { useAuth } from '../contexts/AuthContext';
import '../style.css';

const SettingsPage = () => {
  const { user } = useAuth();

  return (
    <div className="app-shell" style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
      <Sidebar user={user} />
      <div className="app-content-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Topbar user={user} />
        <main style={{ padding: '24px 32px', maxWidth: '800px', width: '100%' }}>
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', color: 'var(--navy)', margin: '0 0 4px 0' }}>
              Account & Portal Settings
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              Manage notification preferences, email alerts, and security credentials.
            </p>
          </div>

          <Card style={{ padding: '24px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', color: 'var(--navy)', marginBottom: '16px' }}>Account Information</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Name:</label>
                <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>{user?.name}</div>
              </div>
              <div>
                <label style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Email:</label>
                <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>{user?.email}</div>
              </div>
              <div>
                <label style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Role:</label>
                <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--gold-deep)' }}>
                  {user?.role === 'admin' ? 'Placement Cell Admin' : 'Student'}
                </div>
              </div>
            </div>
          </Card>

          <Card style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', color: 'var(--navy)', marginBottom: '16px' }}>Notification Preferences</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="checkbox" defaultChecked />
                Receive email alerts for new recruitment drive postings
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="checkbox" defaultChecked />
                Receive 12-hour deadline reminders for eligible drives
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="checkbox" defaultChecked />
                Receive notifications when application status updates
              </label>
            </div>
            <div style={{ marginTop: '20px' }}>
              <Button onClick={() => alert('Settings saved successfully!')}>Save Preferences</Button>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;
