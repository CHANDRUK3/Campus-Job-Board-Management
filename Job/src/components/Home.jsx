import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PublicLayout from './ui/Layout/PublicLayout';
import { Button } from './ui';
import { ArrowRight, CheckCircle2, Briefcase, GraduationCap, Building2 } from 'lucide-react';
import '../style.css';

const initialCoordinators = [
  { dept: 'CSE', name: 'Mr. Karthik', phone: '9876543210', cabin: 'C-101' },
  { dept: 'ECE', name: 'Ms. Priya', phone: '9876500001', cabin: 'E-202' },
  { dept: 'EEE', name: 'Mr. Arjun', phone: '9876512345', cabin: 'EE-303' },
  { dept: 'MECH', name: 'Mr. Ravi', phone: '9876567890', cabin: 'M-404' },
  { dept: 'MBA', name: 'Dr. Sneha', phone: '9876598765', cabin: 'B-505' },
  { dept: 'AIML & AIDS', name: 'Dr. Krishna', phone: '9876597654', cabin: 'A-206' },
];

const Home = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleDashboardRedirect = () => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user?.role === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/student/dashboard');
    }
  };

  return (
    <PublicLayout>
      {/* Hero Section with Deep Navy Background */}
      <section style={{
        background: 'var(--navy-deep)',
        color: '#ffffff',
        padding: '80px 32px',
        borderBottom: '1px solid var(--border)'
      }}>
        <div style={{
          maxWidth: '1240px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '48px',
          alignItems: 'center'
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--gold)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '16px'
            }}>
              INSTITUTIONAL PLACEMENT PORTAL
            </div>

            <h1 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '44px',
              fontWeight: '700',
              color: '#ffffff',
              lineHeight: 1.15,
              marginBottom: '20px'
            }}>
              Your placement season, organized like it should be.
            </h1>

            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '16px',
              color: 'var(--faint)',
              lineHeight: 1.6,
              marginBottom: '32px',
              maxWidth: '580px'
            }}>
              Centralized placement cell management for students and placement cell administrators. Real-time eligibility evaluation, verified student credentials, and 10-stage application tracking.
            </p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <button
                className="btn-gold"
                style={{ height: '48px', padding: '0 28px', fontSize: '15px' }}
                onClick={() => navigate('/placement-drives')}
              >
                <span>Explore Drives</span>
                <ArrowRight size={16} />
              </button>
              <button
                className="btn-secondary"
                style={{
                  height: '48px',
                  padding: '0 28px',
                  fontSize: '15px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  borderColor: 'rgba(255, 255, 255, 0.25)'
                }}
                onClick={handleDashboardRedirect}
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Build My Profile'}
              </button>
            </div>
          </div>

          {/* Right Statistics & Metrics Box */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '12px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '16px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gold)', textTransform: 'uppercase' }}>
                CURRENT BATCH METRICS
              </div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '38px', fontWeight: '700', color: '#ffffff', marginTop: '4px' }}>
                12,000+
              </div>
              <div style={{ fontSize: '13px', color: 'var(--faint)' }}>Registered Engineering & Management Students</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: '700', color: '#ffffff' }}>150+</div>
                <div style={{ fontSize: '12px', color: 'var(--faint)' }}>Verified Recruiting Companies</div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: '700', color: '#ffffff' }}>96%</div>
                <div style={{ fontSize: '12px', color: 'var(--faint)' }}>Verified Profile Rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Stage Placement Journey */}
      <section style={{ padding: '64px 32px', maxWidth: '1240px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gold-deep)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            SYSTEMATIC RECRUITMENT FLOW
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', color: 'var(--navy-deep)', marginTop: '6px' }}>
            Your 4-Stage Placement Journey
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
          <div className="panel-card" style={{ marginBottom: 0 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--gold-deep)', fontWeight: '700', marginBottom: '8px' }}>
              01 DISCOVER
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--navy-deep)', marginBottom: '8px' }}>Placement Drives</h3>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--text-secondary)' }}>
              Browse active recruitment drives from verified hiring partners with transparent CTC packages and deadlines.
            </p>
          </div>

          <div className="panel-card" style={{ marginBottom: 0 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--gold-deep)', fontWeight: '700', marginBottom: '8px' }}>
              02 ELIGIBILITY
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--navy-deep)', marginBottom: '8px' }}>Rule Evaluation</h3>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--text-secondary)' }}>
              Backend rules check CGPA cutoffs, backlog limits, department match, and graduation year automatically.
            </p>
          </div>

          <div className="panel-card" style={{ marginBottom: 0 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--gold-deep)', fontWeight: '700', marginBottom: '8px' }}>
              03 OPT-IN & APPLY
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--navy-deep)', marginBottom: '8px' }}>Formal Preference</h3>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--text-secondary)' }}>
              Express explicit opt-in preferences and submit your verified student resume directly to the Placement Cell.
            </p>
          </div>

          <div className="panel-card" style={{ marginBottom: 0 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--gold-deep)', fontWeight: '700', marginBottom: '8px' }}>
              04 SELECTION
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--navy-deep)', marginBottom: '8px' }}>Get Selected</h3>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--text-secondary)' }}>
              Follow test schedules, technical/HR interview rounds, shortlisted announcements, and formal offer letters.
            </p>
          </div>
        </div>
      </section>

      {/* Department Placement Coordinators */}
      <section style={{ padding: '0 32px 64px 32px', maxWidth: '1240px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', color: 'var(--navy-deep)' }}>
            Department Placement Coordinators
          </h2>
          <p style={{ fontFamily: 'var(--font-sans)', color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Contact your department coordinator for academic profile verification or drive queries.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {initialCoordinators.map((coord, idx) => (
            <div className="panel-card" key={idx} style={{ marginBottom: 0, padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span className="badge badge-navy">{coord.dept}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)' }}>Cabin {coord.cabin}</span>
              </div>
              <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', color: 'var(--navy-deep)', marginBottom: '4px' }}>{coord.name}</h4>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--text-secondary)' }}>Cabin Contact: {coord.phone}</p>
            </div>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
};

export default Home;
