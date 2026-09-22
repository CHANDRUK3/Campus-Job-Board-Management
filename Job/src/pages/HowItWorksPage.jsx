import React from 'react';
import PublicLayout from '../components/ui/Layout/PublicLayout';
import { Card, Badge } from '../components/ui';
import { FileCheck2, UserCheck, CalendarCheck, Award } from 'lucide-react';
import '../style.css';

const HowItWorksPage = () => {
  return (
    <PublicLayout>
      {/* Hero Header */}
      <section style={{ padding: '48px 24px 32px 24px', maxWidth: '960px', margin: '0 auto', textAlign: 'center' }}>
        <Badge tone="primary" style={{ marginBottom: '16px' }}>Campus Recruitment Workflow</Badge>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', fontWeight: '700', color: 'var(--navy-deep)', marginBottom: '16px' }}>
          How the Campus Placement System Works
        </h1>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', color: 'var(--muted)', lineHeight: 1.6 }}>
          Designed specifically for college placements. Digitizing every step from student profile verification to final company offer letters.
        </p>
      </section>

      {/* 4 Step Grid */}
      <section style={{ padding: '0 24px 60px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '24px',
          marginBottom: '60px'
        }}>
          <Card padding="lg">
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              background: 'var(--navy-tint)',
              color: 'var(--navy)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <FileCheck2 size={24} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: '700', color: 'var(--navy-deep)', marginBottom: '8px' }}>
              1. Profile Verification
            </h3>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Students register and submit academic details (CGPA, department, backlogs, PDF resume). The Placement Cell verifies records before drive access is granted.
            </p>
          </Card>

          <Card padding="lg">
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              background: 'var(--gold-tint)',
              color: 'var(--gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <UserCheck size={24} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: '700', color: 'var(--navy-deep)', marginBottom: '8px' }}>
              2. Eligibility & Opt-In
            </h3>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Active placement drives automatically evaluate student criteria. Eligible candidates can opt-in to drives with a single click.
            </p>
          </Card>

          <Card padding="lg">
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              background: 'var(--navy-tint)',
              color: 'var(--navy)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <CalendarCheck size={24} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: '700', color: 'var(--navy-deep)', marginBottom: '8px' }}>
              3. Online Tests & Interviews
            </h3>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Track real-time progress through aptitude tests, technical interviews, and HR rounds with automated notifications and schedule links.
            </p>
          </Card>

          <Card padding="lg">
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              background: 'var(--forest-tint)',
              color: 'var(--forest)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <Award size={24} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: '700', color: 'var(--navy-deep)', marginBottom: '8px' }}>
              4. Selection & Offer Letters
            </h3>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Selected candidates receive digital offer verification while placement stats are automatically aggregated in campus analytics reports.
            </p>
          </Card>
        </div>
      </section>
    </PublicLayout>
  );
};

export default HowItWorksPage;
