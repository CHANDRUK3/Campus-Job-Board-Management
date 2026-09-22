import React from 'react';
import { Card, Badge } from '../components/ui';
import Sidebar from '../components/ui/Layout/Sidebar';
import Topbar from '../components/ui/Layout/Topbar';
import { useAuth } from '../contexts/AuthContext';
import { CalendarDays, Clock, MapPin, Calendar as CalendarIcon, Video } from 'lucide-react';
import '../style.css';

const events = [
  { date: 'Oct 04, 2026', time: '10:30 AM IST', title: 'Technical Interview — TechCorp Solutions', type: 'Interview', venue: 'Placement Block Auditorium / Google Meet' },
  { date: 'Oct 10, 2026', time: '02:00 PM IST', title: 'Data Analytics Coding Test — DataFlow Inc', type: 'Assessment', venue: 'Online Assessment Portal' },
  { date: 'Oct 15, 2026', time: '11:59 PM IST', title: 'CloudTech Systems Registration Deadline', type: 'Deadline', venue: 'Portal Opt-In' },
];

const StudentCalendar = () => {
  const { user } = useAuth();

  return (
    <div className="app-shell">
      <Sidebar user={user} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar user={user} />
        <main style={{ padding: '32px 40px', maxWidth: 'var(--content-max-width)', width: '100%', margin: '0 auto' }}>
          <div style={{ marginBottom: '28px' }}>
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
              <CalendarIcon size={14} />
              <span>RECRUITMENT SCHEDULE</span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: '700', color: 'var(--navy-deep)', margin: '0 0 4px 0' }}>
              Recruitment Calendar & Schedule
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '15px' }}>
              Upcoming test schedules, interview dates, and registration deadlines.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {events.map((evt, index) => (
              <Card key={index} padding="lg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1, minWidth: '280px' }}>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    background: 'var(--navy-tint)',
                    color: 'var(--navy)',
                    textAlign: 'center',
                    fontWeight: '700',
                    fontSize: '13px',
                    minWidth: '120px'
                  }}>
                    {evt.date}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--navy-deep)', margin: 0 }}>{evt.title}</h3>
                      <Badge tone={evt.type === 'Interview' ? 'success' : evt.type === 'Assessment' ? 'info' : 'warning'}>
                        {evt.type}
                      </Badge>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--muted)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={14} /> {evt.time}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={14} /> {evt.venue}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentCalendar;
