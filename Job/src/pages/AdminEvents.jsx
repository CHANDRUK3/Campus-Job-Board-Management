import React from 'react';
import { Card, Button, Badge } from '../components/ui';
import Sidebar from '../components/ui/Layout/Sidebar';
import Topbar from '../components/ui/Layout/Topbar';
import { useAuth } from '../contexts/AuthContext';
import { CalendarDays, Plus, Clock, MapPin } from 'lucide-react';
import '../style.css';

const AdminEvents = () => {
  const { user } = useAuth();

  return (
    <div className="app-shell">
      <Sidebar user={user} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar user={user} />
        <main style={{ padding: '32px 40px', maxWidth: 'var(--content-max-width)', width: '100%', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: 'var(--gold)',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '8px'
              }}>
                <CalendarDays size={14} />
                <span>EVENT MANAGEMENT</span>
              </div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: '700', color: 'var(--navy-deep)', margin: '0 0 4px 0' }}>
                Recruitment Events & Scheduling
              </h1>
              <p style={{ color: 'var(--muted)', fontSize: '15px' }}>
                Schedule aptitude tests, coding rounds, technical interviews, and HR sessions for placement drives.
              </p>
            </div>
            <Button className="btn-gold" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={() => alert('Schedule event modal...')}>
              <Plus size={16} />
              <span>Schedule New Event</span>
            </Button>
          </div>

          <Card padding="lg">
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--navy-deep)', marginBottom: '20px' }}>
              Scheduled Placement Events
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                display: 'flex',
                justify: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                background: 'var(--paper)',
                borderRadius: '8px',
                border: '1px solid var(--border)'
              }}>
                <div>
                  <h4 style={{ fontFamily: 'var(--font-serif)', margin: '0 0 4px 0', fontSize: '16px', color: 'var(--navy-deep)' }}>
                    Technical Interview — TechCorp Solutions
                  </h4>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--muted)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} /> Oct 04, 2026 | 10:30 AM IST
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={14} /> Placement Block Auditorium / Google Meet
                    </span>
                  </div>
                </div>
                <Badge tone="success">Scheduled</Badge>
              </div>

              <div style={{
                display: 'flex',
                justify: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                background: 'var(--paper)',
                borderRadius: '8px',
                border: '1px solid var(--border)'
              }}>
                <div>
                  <h4 style={{ fontFamily: 'var(--font-serif)', margin: '0 0 4px 0', fontSize: '16px', color: 'var(--navy-deep)' }}>
                    Online Coding Test — DataFlow Inc
                  </h4>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--muted)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} /> Oct 10, 2026 | 02:00 PM IST
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={14} /> Online Assessment Portal
                    </span>
                  </div>
                </div>
                <Badge tone="info">Pending Proctor Setup</Badge>
              </div>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default AdminEvents;
