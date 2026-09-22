import React, { useEffect, useState } from 'react';
import { adminAPI, drivesAPI, optStatusAPI, applicationAPI } from '../utils/api';
import Sidebar from './ui/Layout/Sidebar';
import Topbar from './ui/Layout/Topbar';
import { Button, Badge, Card } from './ui';
import {
  Download,
  Users,
  Building2,
  BriefcaseBusiness,
  ClipboardList,
  Award,
  CheckCircle2,
  Plus,
  X,
  Search,
  Filter,
  Eye,
  RefreshCw,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import '../style.css';

const EnhancedAdminDashboard = ({ user, initialTab = 'overview' }) => {
  const [analytics, setAnalytics] = useState(null);
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);

  // Drive Creation Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submittingDrive, setSubmittingDrive] = useState(false);
  const [driveForm, setDriveForm] = useState({
    companyName: '',
    role: '',
    package: '',
    workMode: 'hybrid',
    jobType: 'full-time',
    location: 'Bangalore',
    skills: '',
    minCgpa: '6.5',
    maxBacklogs: '0',
    allowedDepts: ['CSE', 'ECE'],
    registrationDeadline: '',
    description: ''
  });

  // Opt-In Monitoring Modal State
  const [selectedDriveForOptIn, setSelectedDriveForOptIn] = useState(null);
  const [optInStudentsList, setOptInStudentsList] = useState([]);
  const [loadingOptInList, setLoadingOptInList] = useState(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [analyticsData, drivesData] = await Promise.all([
        adminAPI.getAnalytics().catch(() => null),
        drivesAPI.getAll().catch(() => [])
      ]);
      if (analyticsData) setAnalytics(analyticsData);
      if (Array.isArray(drivesData)) setDrives(drivesData);
    } catch (err) {
      console.error('Error initializing Admin Dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Drive Creation
  const handleCreateDriveSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmittingDrive(true);
      const token = localStorage.getItem('accessToken');

      const payload = {
        companyName: driveForm.companyName,
        role: driveForm.role,
        package: parseFloat(driveForm.package) || 6.0,
        workMode: driveForm.workMode,
        jobType: driveForm.jobType,
        location: driveForm.location.split(',').map(s => s.trim()),
        skills: driveForm.skills.split(',').map(s => s.trim()),
        description: driveForm.description,
        eligibilityRules: {
          minCgpa: parseFloat(driveForm.minCgpa) || 6.0,
          maxBacklogs: parseInt(driveForm.maxBacklogs, 10) || 0,
          allowedDepartments: driveForm.allowedDepts,
          gradYears: [2026]
        },
        importantDates: {
          registrationDeadline: driveForm.registrationDeadline ? new Date(driveForm.registrationDeadline).toISOString() : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        },
        status: 'active'
      };

      const res = await fetch('http://localhost:5000/api/drives', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create drive');

      alert(`Placement drive for ${driveForm.role} created successfully!`);
      setShowCreateModal(false);
      // Reset form
      setDriveForm({
        companyName: '',
        role: '',
        package: '',
        workMode: 'hybrid',
        jobType: 'full-time',
        location: 'Bangalore',
        skills: '',
        minCgpa: '6.5',
        maxBacklogs: '0',
        allowedDepts: ['CSE', 'ECE'],
        registrationDeadline: '',
        description: ''
      });
      fetchAdminData();
    } catch (err) {
      alert('Error creating drive: ' + err.message);
    } finally {
      setSubmittingDrive(false);
    }
  };

  // View Opt-In / Opt-Out Students for a specific Drive
  const handleViewOptInStudents = async (drive) => {
    setSelectedDriveForOptIn(drive);
    try {
      setLoadingOptInList(true);
      const token = localStorage.getItem('accessToken');
      
      // Fetch OptStatus for this drive
      const optRes = await fetch(`http://localhost:5000/api/opt-status/job/${drive._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const optData = optRes.ok ? await optRes.json() : [];

      setOptInStudentsList(Array.isArray(optData) ? optData : []);
    } catch (err) {
      console.error('Error fetching opt-in list:', err);
    } finally {
      setLoadingOptInList(false);
    }
  };

  const handleExportExcel = () => {
    const token = localStorage.getItem('accessToken');
    window.open(`http://localhost:5000/api/opt-status/export/excel?token=${token}`, '_blank');
  };

  return (
    <div className="app-shell">
      <Sidebar user={user} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar user={user} />

        <main style={{ padding: '32px 40px', maxWidth: 'var(--content-max-width)', width: '100%', margin: '0 auto' }}>
          {/* Header Banner */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
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
                <BriefcaseBusiness size={14} />
                <span>PLACEMENT CELL COMMAND CENTER</span>
              </div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: '700', color: 'var(--navy-deep)', margin: '0 0 4px 0' }}>
                Placement Management Overview
              </h1>
              <p style={{ color: 'var(--muted)', fontSize: '15px' }}>
                Manage recruitment drives, student opt-in status, and selection pipelines across all engineering departments.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <Button className="btn-gold" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={() => setShowCreateModal(true)}>
                <Plus size={16} />
                <span>Create Placement Drive</span>
              </Button>
              <Button variant="secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={handleExportExcel}>
                <FileSpreadsheet size={16} />
                <span>Export Excel</span>
              </Button>
            </div>
          </div>

          {/* 6 Stat Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            marginBottom: '32px'
          }}>
            <div className="stat-card">
              <div className="stat-card-label">REGISTERED STUDENTS</div>
              <div className="stat-card-number">1,248</div>
              <div className="stat-card-desc">Active 2026 Batch</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-label">COMPANIES</div>
              <div className="stat-card-number">{analytics?.totalCompanies || 86}</div>
              <div className="stat-card-desc">Hiring Partners</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-label">ACTIVE DRIVES</div>
              <div className="stat-card-number">{drives.length || analytics?.activeJobs || 3}</div>
              <div className="stat-card-desc">Published Recruitment Drives</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-label">APPLICATIONS</div>
              <div className="stat-card-number">{analytics?.totalApplications || 3,842}</div>
              <div className="stat-card-desc">Opted-in Students</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-label">SHORTLISTED</div>
              <div className="stat-card-number">726</div>
              <div className="stat-card-desc">Advanced to Interviews</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-label">OFFERS ISSUED</div>
              <div className="stat-card-number">214</div>
              <div className="stat-card-desc">Official CTC Offers</div>
            </div>
          </div>

          {/* DYNAMIC PLACEMENT DRIVES & OPT-IN MONITORING LEDGER */}
          <div className="panel-card" style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: 'var(--navy-deep)', margin: '0 0 4px 0' }}>
                  ACTIVE PLACEMENT DRIVES & DYNAMIC OPT-IN MONITORING
                </h3>
                <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0 }}>
                  Real-time dynamic student opt-in tracking for all published campus drives.
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={fetchAdminData} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <RefreshCw size={14} /> Refresh Data
              </Button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>COMPANY & ROLE</th>
                    <th>CTC PACKAGE</th>
                    <th>ELIGIBILITY</th>
                    <th>DEADLINE</th>
                    <th>STATUS</th>
                    <th>OPT-IN MONITORING</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {drives.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>
                        No active placement drives found. Click "+ Create Placement Drive" above to add one.
                      </td>
                    </tr>
                  ) : (
                    drives.map((drive) => {
                      const companyName = drive.companyId?.name || drive.company || 'Partner Company';
                      const deadlineStr = drive.importantDates?.registrationDeadline
                        ? new Date(drive.importantDates.registrationDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'Open';

                      return (
                        <tr key={drive._id}>
                          <td>
                            <div style={{ fontWeight: '700', color: 'var(--navy-deep)', fontFamily: 'var(--font-serif)' }}>{drive.role}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{companyName}</div>
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--forest)' }}>
                            ₹{drive.package} LPA
                          </td>
                          <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            <div>Min CGPA: <strong>{drive.eligibilityRules?.minCgpa || 6.0}</strong></div>
                            <div>Depts: {(drive.eligibilityRules?.allowedDepartments || []).join(', ') || 'All'}</div>
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--gold)' }}>
                            {deadlineStr}
                          </td>
                          <td>
                            <span className="badge badge-forest">{drive.status ? drive.status.toUpperCase() : 'ACTIVE'}</span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span className="badge badge-forest">DYNAMIC TRACKING</span>
                            </div>
                          </td>
                          <td>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleViewOptInStudents(drive)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Eye size={13} />
                              <span>View Opt-Ins</span>
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* APPLICATION FUNNEL & DEPARTMENT PARTICIPATION */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '28px', marginBottom: '32px' }}>
            <div className="panel-card" style={{ marginBottom: 0 }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--navy-deep)', marginBottom: '20px' }}>
                RECRUITMENT APPLICATION FUNNEL
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { stage: 'Registered Batch', count: 1248, pct: '100%' },
                  { stage: 'Eligible Students', count: 1080, pct: '86%' },
                  { stage: 'Opted In', count: 940, pct: '75%' },
                  { stage: 'Applications Submitted', count: 840, pct: '67%' },
                  { stage: 'Shortlisted for Test', count: 520, pct: '41%' },
                  { stage: 'Interview Cleared', count: 280, pct: '22%' },
                  { stage: 'Offers Issued', count: 214, pct: '17%' }
                ].map((item, idx) => (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '600', color: 'var(--navy-deep)' }}>{item.stage}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>{item.count} ({item.pct})</span>
                    </div>
                    <div style={{ height: '8px', background: 'var(--paper)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: item.pct, height: '100%', background: 'var(--navy)' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel-card" style={{ marginBottom: 0 }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--navy-deep)', marginBottom: '20px' }}>
                DEPARTMENT PLACEMENTS
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { dept: 'Computer Science (CSE)', placed: 94, total: 110, pct: '85%' },
                  { dept: 'Information Tech (IT)', placed: 58, total: 72, pct: '80%' },
                  { dept: 'Electronics (ECE)', placed: 42, total: 60, pct: '70%' },
                  { dept: 'Electrical (EEE)', placed: 12, total: 24, pct: '50%' },
                  { dept: 'Mechanical (MECH)', placed: 8, total: 20, pct: '40%' }
                ].map((d, idx) => (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '600', color: 'var(--navy-deep)' }}>{d.dept}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--forest)' }}>{d.placed}/{d.total} ({d.pct})</span>
                    </div>
                    <div style={{ height: '8px', background: 'var(--paper)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: d.pct, height: '100%', background: 'var(--forest)' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* CREATE PLACEMENT DRIVE MODAL */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(12, 27, 54, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            width: '100%',
            maxWidth: '640px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '32px',
            boxShadow: '0 20px 40px rgba(12, 27, 54, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: 'var(--navy-deep)', margin: 0 }}>
                  Create Placement Drive
                </h2>
                <p style={{ color: 'var(--muted)', fontSize: '13px', margin: '4px 0 0 0' }}>
                  Publish a new campus recruitment opportunity for students.
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}>
                <X size={20} />
              </Button>
            </div>

            <form onSubmit={handleCreateDriveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  COMPANY NAME *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TechCorp Solutions"
                  value={driveForm.companyName}
                  onChange={(e) => setDriveForm({ ...driveForm, companyName: e.target.value })}
                  style={{ width: '100%', height: '44px', padding: '0 14px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    ROLE TITLE *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Software Engineer"
                    value={driveForm.role}
                    onChange={(e) => setDriveForm({ ...driveForm, role: e.target.value })}
                    style={{ width: '100%', height: '44px', padding: '0 14px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    CTC PACKAGE (LPA) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="e.g. 10.0"
                    value={driveForm.package}
                    onChange={(e) => setDriveForm({ ...driveForm, package: e.target.value })}
                    style={{ width: '100%', height: '44px', padding: '0 14px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    WORK MODE
                  </label>
                  <select
                    value={driveForm.workMode}
                    onChange={(e) => setDriveForm({ ...driveForm, workMode: e.target.value })}
                    style={{ width: '100%', height: '44px', padding: '0 14px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px' }}
                  >
                    <option value="hybrid">Hybrid</option>
                    <option value="onsite">On-site</option>
                    <option value="remote">Remote</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    JOB TYPE
                  </label>
                  <select
                    value={driveForm.jobType}
                    onChange={(e) => setDriveForm({ ...driveForm, jobType: e.target.value })}
                    style={{ width: '100%', height: '44px', padding: '0 14px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px' }}
                  >
                    <option value="full-time">Full-time</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  REQUIRED SKILLS (COMMA SEPARATED)
                </label>
                <input
                  type="text"
                  placeholder="e.g. JavaScript, React, Node.js, MongoDB"
                  value={driveForm.skills}
                  onChange={(e) => setDriveForm({ ...driveForm, skills: e.target.value })}
                  style={{ width: '100%', height: '44px', padding: '0 14px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    MINIMUM CGPA CUTOFF
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={driveForm.minCgpa}
                    onChange={(e) => setDriveForm({ ...driveForm, minCgpa: e.target.value })}
                    style={{ width: '100%', height: '44px', padding: '0 14px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    MAXIMUM ALLOWED BACKLOGS
                  </label>
                  <input
                    type="number"
                    value={driveForm.maxBacklogs}
                    onChange={(e) => setDriveForm({ ...driveForm, maxBacklogs: e.target.value })}
                    style={{ width: '100%', height: '44px', padding: '0 14px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  REGISTRATION DEADLINE
                </label>
                <input
                  type="date"
                  value={driveForm.registrationDeadline}
                  onChange={(e) => setDriveForm({ ...driveForm, registrationDeadline: e.target.value })}
                  style={{ width: '100%', height: '44px', padding: '0 14px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  JOB DESCRIPTION & ELIGIBILITY DETAILS
                </label>
                <textarea
                  rows="3"
                  placeholder="Outline core responsibilities, tech stack, and interview process..."
                  value={driveForm.description}
                  onChange={(e) => setDriveForm({ ...driveForm, description: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <Button variant="ghost" type="button" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                <Button className="btn-gold" type="submit" disabled={submittingDrive}>
                  {submittingDrive ? 'Publishing...' : 'Publish Placement Drive'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW OPT-IN STUDENTS DYNAMIC MODAL */}
      {selectedDriveForOptIn && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(12, 27, 54, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            width: '100%',
            maxWidth: '800px',
            maxHeight: '85vh',
            overflowY: 'auto',
            padding: '32px',
            boxShadow: '0 20px 40px rgba(12, 27, 54, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: 'var(--navy-deep)', margin: 0 }}>
                  Student Opt-In Status — {selectedDriveForOptIn.role}
                </h2>
                <p style={{ color: 'var(--muted)', fontSize: '13px', margin: '4px 0 0 0' }}>
                  {selectedDriveForOptIn.companyId?.name || selectedDriveForOptIn.company} · CTC: ₹{selectedDriveForOptIn.package} LPA
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedDriveForOptIn(null)}>
                <X size={20} />
              </Button>
            </div>

            {loadingOptInList ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                Loading dynamic student opt-in records...
              </div>
            ) : optInStudentsList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                <AlertCircle size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                <p>No student opt-in or opt-out entries recorded yet for this drive.</p>
              </div>
            ) : (
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>STUDENT EMAIL</th>
                    <th>STATUS</th>
                    <th>TIMESTAMP</th>
                  </tr>
                </thead>
                <tbody>
                  {optInStudentsList.map((st, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: '600', color: 'var(--navy-deep)' }}>{st.studentEmail}</td>
                      <td>
                        <span className={`badge ${st.status === 'opt-in' ? 'badge-forest' : 'badge-brick'}`}>
                          {st.status === 'opt-in' ? '✓ OPTED IN' : '✕ OPTED OUT'}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--muted)' }}>
                        {new Date(st.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedAdminDashboard;
