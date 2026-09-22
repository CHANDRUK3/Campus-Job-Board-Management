import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { drivesAPI, profileAPI, applicationAPI } from '../utils/api';
import PublicLayout from '../components/ui/Layout/PublicLayout';
import Sidebar from '../components/ui/Layout/Sidebar';
import Topbar from '../components/ui/Layout/Topbar';
import { Button, Badge, Card } from '../components/ui';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Briefcase,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  IndianRupee,
  FileText,
  AlertCircle
} from 'lucide-react';
import '../style.css';

const DriveDetailsPage = () => {
  const { driveId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [drive, setDrive] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    fetchDriveAndProfile();
  }, [driveId]);

  const fetchDriveAndProfile = async () => {
    try {
      setLoading(true);
      const allDrives = await drivesAPI.getAll();
      const targetDrive = allDrives.find(d => d._id === driveId);
      setDrive(targetDrive);

      if (user && user.role === 'student') {
        const userId = user.id || user._id;
        const profileData = await profileAPI.getProfile(userId).catch(() => null);
        setProfile(profileData);

        const appsRes = await applicationAPI.getMyApplications().catch(() => null);
        const apps = appsRes?.applications || appsRes || [];
        const existingApp = Array.isArray(apps) && apps.find(a => (a.drive?._id || a.drive) === driveId);
        if (existingApp) {
          setHasApplied(true);
        }
      }
    } catch (err) {
      console.error('Error fetching drive details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOptIn = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setApplying(true);
      await applicationAPI.applyForDrive(drive._id, {});
      alert(`Successfully opted-in and applied for ${drive.role}!`);
      setHasApplied(true);
    } catch (err) {
      alert('Failed to apply: ' + (err.message || 'Server error'));
    } finally {
      setApplying(false);
    }
  };

  const checkEligibility = () => {
    if (!profile) return { eligible: false, reasons: ['Student profile not verified'] };
    if (profile.profileStatus !== 'verified') {
      return { eligible: false, reasons: ['Profile pending verification by Placement Cell'] };
    }
    const reasons = [];
    const minCgpa = drive?.eligibilityRules?.minCgpa || 0;
    if (profile.cgpa < minCgpa) reasons.push(`CGPA ${profile.cgpa} is below cutoff (${minCgpa})`);
    const maxBacklogs = drive?.eligibilityRules?.maxBacklogs ?? 0;
    if (profile.backlogs > maxBacklogs) reasons.push(`Active backlogs (${profile.backlogs}) exceed limit (${maxBacklogs})`);
    const allowedDepts = drive?.eligibilityRules?.allowedDepartments || [];
    if (allowedDepts.length > 0 && profile.department) {
      const ok = allowedDepts.some(d => d.toLowerCase().trim() === profile.department.toLowerCase().trim());
      if (!ok) reasons.push(`Department ${profile.department} not in allowed list (${allowedDepts.join(', ')})`);
    }
    return { eligible: reasons.length === 0, reasons };
  };

  const eligibility = checkEligibility();
  const companyName = drive?.companyId?.name || drive?.company || 'Partner Company';
  const refCode = `DRIVE-2026-${(drive?._id || '014').substring(drive?._id ? drive._id.length - 3 : 0).toUpperCase()}`;

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--muted)' }}>
          <p>Loading placement drive details...</p>
        </div>
      );
    }

    if (!drive) {
      return (
        <div style={{ maxWidth: '600px', margin: '60px auto', textAlign: 'center' }}>
          <Card padding="lg">
            <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--navy-deep)', marginBottom: '12px' }}>Drive Not Found</h2>
            <p style={{ color: 'var(--muted)', marginBottom: '20px' }}>The requested placement drive could not be located.</p>
            <Button className="btn-gold" onClick={() => navigate(-1)}>Go Back</Button>
          </Card>
        </div>
      );
    }

    return (
      <div style={{ maxWidth: '1140px', margin: '0 auto', padding: user ? '32px 40px' : '36px 24px' }}>
        {/* Navigation back button */}
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
          <ArrowLeft size={16} /> Back to Drives
        </Button>

        {/* Hero Ticket Header */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          padding: '32px',
          marginBottom: '28px',
          boxShadow: '0 4px 12px rgba(12, 27, 54, 0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <Building2 size={18} style={{ color: 'var(--navy)' }} />
                <span style={{ fontFamily: 'var(--font-sans)', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '15px' }}>{companyName}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--muted)', background: 'var(--paper)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                  {refCode}
                </span>
              </div>

              <h1 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '32px',
                fontWeight: '700',
                color: 'var(--navy-deep)',
                margin: '0 0 16px 0'
              }}>
                {drive.role}
              </h1>

              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--forest)', fontSize: '16px' }}>
                  <IndianRupee size={16} /> {drive.package} LPA
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={16} style={{ color: 'var(--muted)' }} /> {Array.isArray(drive.location) ? drive.location.join(', ') : drive.location}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Briefcase size={16} style={{ color: 'var(--muted)' }} /> {drive.workMode || 'Hybrid'}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={16} style={{ color: 'var(--muted)' }} /> {(drive.jobType || 'full-time').toUpperCase()}
                </span>
              </div>
            </div>

            <div style={{ textAlign: 'right', minWidth: '220px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                padding: '6px 12px',
                borderRadius: '6px',
                background: eligibility.eligible ? 'var(--forest-tint)' : 'var(--brick-tint)',
                color: eligibility.eligible ? 'var(--forest)' : 'var(--brick)',
                fontWeight: '600',
                marginBottom: '16px'
              }}>
                {eligibility.eligible ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                <span>{eligibility.eligible ? '✓ Eligible for Drive' : '✕ Not Eligible'}</span>
              </div>

              <div>
                {hasApplied ? (
                  <Button variant="secondary" disabled style={{ width: '100%' }}>✓ Opted In & Applied</Button>
                ) : (
                  <Button
                    className={eligibility.eligible ? 'btn-gold' : 'btn-secondary'}
                    disabled={!eligibility.eligible || applying}
                    onClick={handleOptIn}
                    style={{ width: '100%', height: '48px', fontSize: '15px' }}
                  >
                    {applying ? 'Submitting...' : eligibility.eligible ? 'Opt In & Apply Now' : 'Ineligible'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Two-Column Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '28px' }}>
          {/* Main Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Card padding="lg">
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--navy-deep)', marginBottom: '14px' }}>About the Role</h3>
              <p style={{ fontFamily: 'var(--font-sans)', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-line', fontSize: '15px' }}>
                {drive.description}
              </p>
            </Card>

            <Card padding="lg">
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--navy-deep)', marginBottom: '14px' }}>Required Skills</h3>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {(drive.skills || []).map((skill, idx) => (
                  <span key={idx} style={{
                    fontSize: '13px',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    background: 'var(--paper)',
                    border: '1px solid var(--border)',
                    color: 'var(--navy-deep)',
                    fontWeight: '500'
                  }}>
                    {skill}
                  </span>
                ))}
              </div>
            </Card>

            <Card padding="lg">
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--navy-deep)', marginBottom: '14px' }}>Selection Process</h3>
              <ol style={{ paddingLeft: '20px', color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '15px' }}>
                {(drive.selectionProcess || ['Online Aptitude Test', 'Technical Round 1', 'HR Interview']).map((step, idx) => (
                  <li key={idx} style={{ marginBottom: '6px' }}>
                    <strong style={{ color: 'var(--navy-deep)' }}>{step}</strong>
                  </li>
                ))}
              </ol>
            </Card>
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Card padding="lg">
              <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--navy-deep)', marginBottom: '16px' }}>Eligibility Criteria</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--muted)' }}>Min CGPA:</span>
                  <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--navy-deep)' }}>{drive.eligibilityRules?.minCgpa || 0}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--muted)' }}>Max Backlogs:</span>
                  <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--navy-deep)' }}>{drive.eligibilityRules?.maxBacklogs ?? 0}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--muted)' }}>Allowed Depts:</span>
                  <strong style={{ color: 'var(--navy-deep)' }}>{(drive.eligibilityRules?.allowedDepartments || []).join(', ') || 'All'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Graduation Years:</span>
                  <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--navy-deep)' }}>{(drive.eligibilityRules?.gradYears || []).join(', ') || 'All'}</strong>
                </div>
              </div>

              {!eligibility.eligible && eligibility.reasons.length > 0 && (
                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: 'var(--brick-tint)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: 'var(--brick)',
                  border: '1px solid rgba(161, 61, 43, 0.2)'
                }}>
                  <div style={{ fontWeight: '600', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertCircle size={14} /> Ineligibility Reasons:
                  </div>
                  <ul style={{ paddingLeft: '18px', margin: 0 }}>
                    {eligibility.reasons.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
            </Card>

            <Card padding="lg">
              <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--navy-deep)', marginBottom: '16px' }}>Important Dates</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase' }}>Registration Deadline</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--gold)', fontSize: '15px', marginTop: '2px' }}>
                    {drive.importantDates?.registrationDeadline ? new Date(drive.importantDates.registrationDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Open'}
                  </div>
                </div>
                {drive.importantDates?.testDate && (
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase' }}>Assessment Date</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: '600', color: 'var(--navy-deep)', marginTop: '2px' }}>
                      {new Date(drive.importantDates.testDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                )}
                {drive.importantDates?.interviewDate && (
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase' }}>Interview Date</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: '600', color: 'var(--navy-deep)', marginTop: '2px' }}>
                      {new Date(drive.importantDates.interviewDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  if (user) {
    return (
      <div className="app-shell">
        <Sidebar user={user} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Topbar user={user} />
          <main style={{ flex: 1 }}>{renderContent()}</main>
        </div>
      </div>
    );
  }

  return (
    <PublicLayout>
      {renderContent()}
    </PublicLayout>
  );
};

export default DriveDetailsPage;
