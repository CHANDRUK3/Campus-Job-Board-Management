import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ApplicationTimeline from './ApplicationTimeline';
import Sidebar from './ui/Layout/Sidebar';
import Topbar from './ui/Layout/Topbar';
import DriveCard from './DriveCard';
import { profileAPI, driveAPI, applicationAPI, studentAPI, notificationAPI } from '../utils/api';
import { Button, Badge } from './ui';
import {
  BriefcaseBusiness,
  ClipboardList,
  CheckCircle2,
  Bell,
  Clock,
  ArrowRight,
  ChevronRight,
  FileCheck
} from 'lucide-react';
import '../style.css';

const StudentDashboard = ({ user, initialTab = 'drives' }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [drives, setDrives] = useState([]);
  const [applications, setApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);

  const [activeApplication, setActiveApplication] = useState(null);
  const [optInConfirm, setOptInConfirm] = useState(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (user) {
      initDashboard();
    }
  }, [user]);

  const initDashboard = async () => {
    try {
      setLoading(true);
      const userId = user.id || user._id;

      try {
        const profileData = await profileAPI.getProfile(userId);
        setProfile(profileData);
      } catch (e) {}

      try {
        const drivesData = await driveAPI.getAllDrives();
        setDrives(drivesData || []);
      } catch (e) {}

      try {
        const appsData = await applicationAPI.getMyApplications();
        setApplications(appsData.applications || appsData || []);
      } catch (e) {}

      try {
        const statsData = await studentAPI.getStats();
        setStats(statsData);
      } catch (e) {}

      try {
        const notifsData = await notificationAPI.getNotifications();
        setNotifications(notifsData || []);
      } catch (e) {}

    } catch (error) {
      console.error('Failed to initialize dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptInSubmit = async () => {
    if (!optInConfirm) return;
    try {
      await applicationAPI.applyForDrive(optInConfirm._id, {});
      alert(`Successfully opted-in and applied for ${optInConfirm.role || optInConfirm.jobTitle}!`);
      setOptInConfirm(null);
      initDashboard();
    } catch (error) {
      alert(`Error submitting application: ${error.message}`);
    }
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.name ? user.name.split(' ')[0] : 'Student';

  return (
    <div className="app-shell">
      <Sidebar user={user} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar user={user} />

        <main style={{ padding: '32px 40px', maxWidth: 'var(--content-max-width)', width: '100%', margin: '0 auto' }}>
          {/* Header Banner */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '32px',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <h1 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '32px',
                fontWeight: '700',
                color: 'var(--navy-deep)',
                margin: '0 0 4px 0'
              }}>
                {getTimeGreeting()}, {firstName}.
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
                Here is your current placement activity and the opportunities that need your attention.
              </p>
            </div>

            <Button className="btn-gold" style={{ padding: '12px 22px' }} onClick={() => setActiveTab('drives')}>
              <BriefcaseBusiness size={16} /> Browse Placement Drives
            </Button>
          </div>

          {/* 4 Stat Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
            marginBottom: '32px'
          }}>
            <div className="stat-card">
              <div className="stat-card-label">APPLICATIONS</div>
              <div className="stat-card-number">{applications.length}</div>
              <div className="stat-card-desc">Submitted applications</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-label">IN PROGRESS</div>
              <div className="stat-card-number">
                {applications.filter(a => !['selected', 'rejected', 'closed'].includes(a.status)).length}
              </div>
              <div className="stat-card-desc">Active stage rounds</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-label">OFFERS</div>
              <div className="stat-card-number">
                {applications.filter(a => a.status === 'selected' || a.offer).length}
              </div>
              <div className="stat-card-desc">Official CTC offers</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-label">UNREAD NOTIFICATIONS</div>
              <div className="stat-card-number">
                {notifications.filter(n => !n.isRead).length}
              </div>
              <div className="stat-card-desc">Action alerts</div>
            </div>
          </div>

          {/* Main Two-Column Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '28px', marginBottom: '36px' }}>
            {/* LEFT 65%: WHAT NEEDS YOUR ATTENTION */}
            <div className="panel-card" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--navy-deep)', margin: 0 }}>
                  WHAT NEEDS YOUR ATTENTION
                </h3>
                <span className="badge badge-gold">ACTION REQUIRED</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{
                  padding: '16px',
                  borderRadius: '8px',
                  background: 'var(--paper)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gold-deep)', fontWeight: '600', textTransform: 'uppercase' }}>
                      TECHNICAL INTERVIEW SCHEDULED
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--navy-deep)', marginTop: '2px' }}>
                      TechCorp Solutions — Software Engineer
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      🕒 Oct 04, 2026 | 10:30 AM IST | Placement Block Auditorium
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => setActiveTab('applications')}>View Schedule</Button>
                </div>

                <div style={{
                  padding: '16px',
                  borderRadius: '8px',
                  background: 'var(--paper)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--navy)', fontWeight: '600', textTransform: 'uppercase' }}>
                      APPLICATION DEADLINE APPROACHING
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--navy-deep)', marginTop: '2px' }}>
                      CloudTech Systems — DevOps Intern (4.8 LPA)
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      ⌛ Registration closes in 15 days
                    </div>
                  </div>
                  <Button className="btn-gold" size="sm" onClick={() => setActiveTab('drives')}>Opt In</Button>
                </div>
              </div>
            </div>

            {/* RIGHT 35%: PROFILE READINESS */}
            <div className="panel-card" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--navy-deep)', margin: 0 }}>
                  PROFILE READINESS
                </h3>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: '700', color: 'var(--navy-deep)' }}>
                  86%
                </span>
              </div>

              <div style={{
                height: '8px',
                borderRadius: '4px',
                background: 'var(--border-soft)',
                overflow: 'hidden',
                marginBottom: '20px'
              }}>
                <div style={{ width: '86%', height: '100%', background: 'var(--forest)' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--forest)' }}>
                  <CheckCircle2 size={16} /> <span>Academic history verified</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--forest)' }}>
                  <CheckCircle2 size={16} /> <span>Skills & technical tags added</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--forest)' }}>
                  <CheckCircle2 size={16} /> <span>PDF resume uploaded</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)' }}>
                  <span style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid var(--muted)', display: 'inline-block' }} />
                  <span>Career preferences completed</span>
                </div>
              </div>

              <Button variant="secondary" style={{ width: '100%' }} onClick={() => navigate('/student/profile')}>
                Complete Profile
              </Button>
            </div>
          </div>

          {/* MY APPLICATIONS LEDGER */}
          <div className="panel-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: 'var(--navy-deep)', margin: 0 }}>
                MY APPLICATIONS
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setActiveTab('applications')}>View All →</Button>
            </div>

            {applications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                No active job applications found. Explore placement drives to opt-in.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="ledger-table">
                  <thead>
                    <tr>
                      <th>COMPANY</th>
                      <th>ROLE</th>
                      <th>APPLIED</th>
                      <th>CURRENT STAGE</th>
                      <th>NEXT EVENT</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map(app => (
                      <tr key={app._id} style={{ cursor: 'pointer' }} onClick={() => setActiveApplication(app)}>
                        <td style={{ fontWeight: '700', color: 'var(--navy-deep)' }}>
                          {app.drive?.companyId?.name || app.drive?.company || 'Partner Company'}
                        </td>
                        <td style={{ fontWeight: '600' }}>{app.drive?.role || app.drive?.jobTitle || 'Role'}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                          {new Date(app.applicationDate || Date.now()).toLocaleDateString()}
                        </td>
                        <td>
                          <span className="badge badge-navy">{(app.status || 'applied').replace('_', ' ').toUpperCase()}</span>
                        </td>
                        <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {app.testInterviewDetails?.date ? `${new Date(app.testInterviewDetails.date).toLocaleDateString()} ${app.testInterviewDetails.time || ''}` : 'Pending schedule'}
                        </td>
                        <td>
                          <span className="badge badge-forest">ACTIVE</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Active Drives View Tab */}
          {activeTab === 'drives' && (
            <div style={{ marginTop: '32px' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: 'var(--navy-deep)', marginBottom: '20px' }}>
                Active Placement Drives
              </h2>
              <div>
                {drives.map(drive => (
                  <DriveCard
                    key={drive._id}
                    drive={drive}
                    profile={profile}
                    applications={applications}
                    onOptIn={(d) => setOptInConfirm(d)}
                    onView={(d) => navigate(`/student/drives/${d._id}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Application Detail Timeline Overlay */}
          {activeApplication && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(12, 27, 54, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 300,
              padding: '24px'
            }}>
              <div style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto', background: '#ffffff', borderRadius: '12px', padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--navy-deep)', margin: 0 }}>
                    Application Status & Timeline
                  </h2>
                  <Button variant="ghost" onClick={() => setActiveApplication(null)}>✕ Close</Button>
                </div>

                <ApplicationTimeline
                  application={activeApplication}
                  onAcceptOffer={() => alert('Offer accepted!')}
                  onDeclineOffer={() => alert('Offer declined')}
                />
              </div>
            </div>
          )}

          {/* Opt-In Confirmation Overlay */}
          {optInConfirm && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(12, 27, 54, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 300,
              padding: '24px'
            }}>
              <div style={{ maxWidth: '500px', width: '100%', background: '#ffffff', borderRadius: '12px', padding: '32px' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--navy-deep)', marginBottom: '12px' }}>
                  Confirm Opt-In & Application
                </h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  Are you sure you want to opt-in and submit your verified student profile for <strong>{optInConfirm.role}</strong> at <strong>{optInConfirm.companyId?.name || optInConfirm.company}</strong>?
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <Button variant="ghost" onClick={() => setOptInConfirm(null)}>Cancel</Button>
                  <Button className="btn-gold" onClick={handleOptInSubmit}>Confirm Opt-In</Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;
