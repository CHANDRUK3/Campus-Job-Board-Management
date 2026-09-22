import React from 'react';
import Button from './ui/Button';
import { MapPin, Briefcase, Building2, CheckCircle2, CircleX, ArrowRight, IndianRupee } from 'lucide-react';
import '../style.css';

const DriveCard = ({ drive, profile, applications = [], onOptIn, onView }) => {
  const isAlreadyApplied = applications.some(app => (app.drive?._id || app.drive) === drive._id);
  const registrationDaysLeft = Math.max(0, Math.ceil((new Date(drive.importantDates?.registrationDeadline || Date.now() + 14 * 24 * 60 * 60 * 1000) - new Date()) / (1000 * 60 * 60 * 24)));
  const formattedDate = new Date(drive.importantDates?.registrationDeadline || Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Reference code format: DRIVE-2026-E0B
  const refCode = `DRIVE-2026-${(drive._id || 'E0B').substring(drive._id ? drive._id.length - 3 : 0).toUpperCase()}`;

  // Eligibility evaluation logic
  const checkDriveEligibility = () => {
    if (!profile) return { eligible: false, reasons: ['Profile not found'] };
    if (profile.profileStatus !== 'verified') return { eligible: false, reasons: ['Profile pending verification by Placement Cell'] };
    const reasons = [];
    const minCgpa = drive.eligibilityRules?.minCgpa || 0;
    if (profile.cgpa < minCgpa) reasons.push(`CGPA (${profile.cgpa}) below cutoff (${minCgpa})`);
    const maxBacklogs = drive.eligibilityRules?.maxBacklogs ?? 0;
    if (profile.backlogs > maxBacklogs) reasons.push(`Active backlogs (${profile.backlogs}) exceed limit (${maxBacklogs})`);
    const allowedDepts = drive.eligibilityRules?.allowedDepartments || [];
    if (allowedDepts.length > 0 && profile.department) {
      const ok = allowedDepts.some(d => d.toLowerCase().trim() === profile.department.toLowerCase().trim());
      if (!ok) reasons.push(`Dept ${profile.department} not in allowed list (${allowedDepts.join(', ')})`);
    }
    return { eligible: reasons.length === 0, reasons };
  };

  const elig = checkDriveEligibility();

  return (
    <div className="ticket-card" style={{
      background: '#ffffff',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      display: 'grid',
      gridTemplateColumns: '1fr 220px',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(12, 27, 54, 0.04)',
      marginBottom: '20px',
      position: 'relative'
    }}>
      {/* Main Ticket Body */}
      <div style={{
        padding: '24px 28px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Left Sub-Column: Company, Role, Package, Eligibility */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Company Brand Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: 'var(--navy-tint)',
              color: 'var(--navy)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Building2 size={18} />
            </div>
            <span style={{ fontFamily: 'var(--font-sans)', fontWeight: '700', fontSize: '15px', color: 'var(--navy-deep)' }}>
              {drive.companyId?.name || drive.company || 'Partner Company'}
            </span>
          </div>

          {/* Primary Role Heading */}
          <h3 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '22px',
            fontWeight: '700',
            color: 'var(--navy-deep)',
            margin: 0,
            lineHeight: 1.2
          }}>
            {drive.role || drive.jobTitle}
          </h3>

          {/* Package CTC & Location Metadata */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '13px', color: 'var(--text-secondary)', alignItems: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--forest)', fontSize: '16px' }}>
              <IndianRupee size={15} /> {drive.package} LPA
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={14} style={{ color: 'var(--muted)' }} /> {Array.isArray(drive.location) ? drive.location.join(', ') : drive.location}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Briefcase size={14} style={{ color: 'var(--muted)' }} /> {drive.workMode || 'On-site'}
            </span>
          </div>

          {/* Clean Eligibility Indicator Box */}
          <div style={{
            marginTop: '4px',
            display: 'inline-flex',
            alignItems: 'flex-start',
            gap: '10px',
            padding: '10px 14px',
            borderRadius: '8px',
            background: elig.eligible ? 'var(--forest-tint)' : 'var(--brick-tint)',
            border: elig.eligible ? '1px solid rgba(47, 111, 79, 0.2)' : '1px solid rgba(161, 61, 43, 0.2)',
            color: elig.eligible ? 'var(--forest)' : 'var(--brick)'
          }}>
            {elig.eligible ? (
              <>
                <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '13px', fontWeight: '600', fontFamily: 'var(--font-sans)' }}>
                  ELIGIBLE FOR DRIVE
                </div>
              </>
            ) : (
              <>
                <CircleX size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', fontFamily: 'var(--font-sans)', letterSpacing: '0.3px' }}>
                    NOT ELIGIBLE
                  </div>
                  {elig.reasons.length > 0 && (
                    <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px', fontWeight: '400' }}>
                      {elig.reasons[0]}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Sub-Column: Ref Code, Work Type, Skills & Requirements */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start' }}>
          {/* Ref Code & Work Type Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', justifyContent: 'flex-end' }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--muted)',
              letterSpacing: '0.05em'
            }}>
              {refCode}
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              padding: '4px 10px',
              borderRadius: '6px',
              background: 'var(--navy-tint)',
              color: 'var(--navy)',
              border: '1px solid rgba(20, 40, 80, 0.12)',
              fontWeight: '600'
            }}>
              <Briefcase size={12} />
              {(drive.jobType || 'full-time').toUpperCase()}
            </span>
          </div>

          {/* Skill Tag Label */}
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>
            REQUIRED TECH STACK
          </div>

          {/* Compact Neutral Skill Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {(drive.skills || []).slice(0, 6).map(skill => (
              <span key={skill} style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '12px',
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'var(--paper)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
                fontWeight: '500'
              }}>
                {skill}
              </span>
            ))}
          </div>

          {/* Cutoff criteria summary */}
          <div style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', marginTop: '4px' }}>
            Cutoffs: <strong>{drive.eligibilityRules?.minCgpa || 6.0} CGPA</strong> · Max Backlogs: <strong>{drive.eligibilityRules?.maxBacklogs ?? 0}</strong>
          </div>
        </div>
      </div>

      {/* Perforated Admit Stub Right Section */}
      <div className="ticket-stub" style={{
        background: 'var(--paper)',
        borderLeft: '2px dashed var(--border)',
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative'
      }}>
        {/* Ticket Circle Cutouts */}
        <div style={{
          position: 'absolute',
          top: '-8px',
          left: '-8px',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          background: 'var(--paper)',
          border: '1px solid var(--border)'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-8px',
          left: '-8px',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          background: 'var(--paper)',
          border: '1px solid var(--border)'
        }} />

        {/* Deadline Countdown */}
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
            REGISTRATION CLOSES
          </div>
          
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', fontWeight: '700', color: registrationDaysLeft <= 3 ? 'var(--gold)' : 'var(--navy-deep)' }}>
              {registrationDaysLeft <= 0 ? '0' : registrationDaysLeft}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: '600', color: 'var(--muted)', textTransform: 'uppercase' }}>
              {registrationDaysLeft === 1 ? 'DAY LEFT' : 'DAYS LEFT'}
            </span>
          </div>

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--muted)' }}>
            {formattedDate}
          </div>
        </div>

        {/* Action CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
          {isAlreadyApplied ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                onClick={() => onView && onView(drive)}
              >
                <span>View Details</span>
                <ArrowRight size={14} />
              </Button>
              <Button variant="secondary" size="sm" style={{ width: '100%' }} disabled>
                ✓ Applied
              </Button>
            </>
          ) : elig.eligible && registrationDaysLeft > 0 ? (
            <>
              <Button
                className="btn-gold"
                size="sm"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                onClick={() => onOptIn && onOptIn(drive)}
              >
                <span>Opt In & Apply</span>
                <ArrowRight size={14} />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                style={{ width: '100%' }}
                onClick={() => onView && onView(drive)}
              >
                <span>View Details</span>
              </Button>
            </>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              onClick={() => onView && onView(drive)}
            >
              <span>View Details</span>
              <ArrowRight size={14} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriveCard;
