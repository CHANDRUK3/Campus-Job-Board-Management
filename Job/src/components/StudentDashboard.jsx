import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ApplicationTimeline from './ApplicationTimeline';
import '../style.css';

const StudentDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [drives, setDrives] = useState([]);
  const [applications, setApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('drives'); // drives, profile, analytics, applications, notifications
  
  // Timeline detail view state
  const [activeApplication, setActiveApplication] = useState(null);

  // Search & Filter state for Drives
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    minPackage: 0,
    departmentMatch: false,
    eligibleOnly: false,
    jobType: 'all',
    workMode: 'all'
  });
  const [sortBy, setSortBy] = useState('deadline'); // deadline, package, date

  // Opt-in confirmation overlay state
  const [optInConfirm, setOptInConfirm] = useState(null); // stores drive object being opted in

  useEffect(() => {
    if (user) {
      initDashboard();
    }
  }, [user]);

  const initDashboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const userId = user.id || user._id;

      // 1. Fetch Student Profile
      const profileRes = await fetch(`http://localhost:5000/api/profile/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      let profileData = null;
      if (profileRes.ok) {
        profileData = await profileRes.json();
        setProfile(profileData);
      }

      // 2. Fetch Active Drives
      const drivesRes = await fetch('http://localhost:5000/api/drives', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (drivesRes.ok) {
        const drivesData = await drivesRes.json();
        setDrives(drivesData);
      }

      // 3. Fetch Applications
      const appsRes = await fetch('http://localhost:5000/api/student/applications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (appsRes.ok) {
        const appsData = await appsRes.json();
        setApplications(appsData.applications || []);
      }

      // 4. Fetch Stats
      const statsRes = await fetch('http://localhost:5000/api/student/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // 5. Fetch Notifications
      const notifsRes = await fetch('http://localhost:5000/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (notifsRes.ok) {
        const notifsData = await notifsRes.json();
        // filter unread / read
        setNotifications(notifsData || []);
      }

    } catch (error) {
      console.error('Failed to initialize dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Eligibility checking logic
  const checkDriveEligibility = (drive) => {
    if (!profile) return { eligible: false, reasons: ['Profile not found'] };
    if (profile.profileStatus !== 'verified') {
      return { eligible: false, reasons: ['Profile status is not verified by placement cell.'] };
    }

    const reasons = [];
    const minCgpa = drive.eligibilityRules?.minCgpa || 0;
    if (profile.cgpa < minCgpa) {
      reasons.push(`CGPA is ${profile.cgpa}, but cutoff is ${minCgpa}`);
    }

    const maxBacklogs = drive.eligibilityRules?.maxBacklogs !== undefined ? drive.eligibilityRules.maxBacklogs : 0;
    if (profile.backlogs > maxBacklogs) {
      reasons.push(`Backlogs count is ${profile.backlogs}, maximum allowed is ${maxBacklogs}`);
    }

    const allowedDepts = drive.eligibilityRules?.allowedDepartments || [];
    if (allowedDepts.length > 0 && profile.department) {
      const matched = allowedDepts.some(
        dept => dept.toLowerCase().trim() === profile.department.toLowerCase().trim()
      );
      if (!matched) {
        reasons.push(`Drive allowed departments: ${allowedDepts.join(', ')}. Your department: ${profile.department}`);
      }
    }

    const allowedYears = drive.eligibilityRules?.gradYears || [];
    if (allowedYears.length > 0 && profile.gradYear) {
      if (!allowedYears.includes(profile.gradYear)) {
        reasons.push(`Drive graduation years: ${allowedYears.join(', ')}. Your graduation year: ${profile.gradYear}`);
      }
    }

    // Check multiple offers
    const allowPlaced = drive.eligibilityRules?.allowPlaced !== undefined ? drive.eligibilityRules.allowPlaced : true;
    if (!allowPlaced) {
      const isPlaced = applications.some(app => app.status === 'selected');
      if (isPlaced) {
        reasons.push('You are already placed in another drive, and this drive does not permit multiple offers.');
      }
    }

    return {
      eligible: reasons.length === 0,
      reasons
    };
  };

  const handleOptInSubmit = async () => {
    if (!optInConfirm) return;
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:5000/api/student/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ jobId: optInConfirm._id, applicationData: {} })
      });
      if (response.ok) {
        alert(`Successfully opted-in and applied for ${optInConfirm.jobTitle} at ${optInConfirm.company}!`);
        setOptInConfirm(null);
        initDashboard();
      } else {
        const errorData = await response.json();
        alert(`Failed to apply: ${errorData.message}`);
      }
    } catch (error) {
      alert(`Error submitting application: ${error.message}`);
    }
  };

  // Stepper timeline handlers
  const handleAcceptOffer = async (appId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`http://localhost:5000/api/student/applications/${appId}/offer`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'accept', note: 'Offer accepted by student.' })
      });
      if (res.ok) {
        alert('Offer accepted! Congratulations!');
        initDashboard();
        setActiveApplication(null);
      }
    } catch (err) {
      alert('Failed to accept offer: ' + err.message);
    }
  };

  const handleDeclineOffer = async (appId) => {
    if (window.confirm('Are you sure you want to decline this job offer?')) {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`http://localhost:5000/api/student/applications/${appId}/offer`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ action: 'decline', note: 'Offer declined by student.' })
        });
        if (res.ok) {
          alert('Offer declined.');
          initDashboard();
          setActiveApplication(null);
        }
      } catch (err) {
        alert('Failed to decline offer: ' + err.message);
      }
    }
  };

  // Recommended drives filter algorithm
  const getRecommendedDrives = () => {
    if (!profile) return [];
    return drives.filter(drive => {
      // Prioritize drives matching student's department or skills
      const deptMatch = drive.eligibilityRules?.allowedDepartments?.some(
        dept => dept.toLowerCase().trim() === profile.department?.toLowerCase().trim()
      );
      const skillMatch = drive.skills?.some(skill => 
        profile.skills?.some(ps => ps.toLowerCase().trim() === skill.toLowerCase().trim())
      );
      const isAlreadyApplied = applications.some(app => app.drive?._id === drive._id);
      return (deptMatch || skillMatch) && !isAlreadyApplied;
    }).slice(0, 3);
  };

  // Search, filter, and sort logic
  const getFilteredDrives = () => {
    let result = [...drives];

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(drive => 
        drive.company.toLowerCase().includes(query) ||
        drive.jobTitle.toLowerCase().includes(query) ||
        drive.description.toLowerCase().includes(query) ||
        drive.skills.some(s => s.toLowerCase().includes(query))
      );
    }

    // Filter minPackage
    if (filters.minPackage > 0) {
      result = result.filter(drive => drive.package >= filters.minPackage);
    }

    // Filter department
    if (filters.departmentMatch && profile) {
      result = result.filter(drive => 
        drive.eligibilityRules?.allowedDepartments?.length === 0 ||
        drive.eligibilityRules?.allowedDepartments?.some(
          dept => dept.toLowerCase().trim() === profile.department?.toLowerCase().trim()
        )
      );
    }

    // Filter eligible
    if (filters.eligibleOnly) {
      result = result.filter(drive => checkDriveEligibility(drive).eligible);
    }

    // Filter job type
    if (filters.jobType !== 'all') {
      result = result.filter(drive => drive.jobType === filters.jobType);
    }

    // Filter work mode
    if (filters.workMode !== 'all') {
      result = result.filter(drive => drive.workMode === filters.workMode);
    }

    // Sort drives
    if (sortBy === 'deadline') {
      result.sort((a, b) => new Date(a.importantDates?.registrationDeadline) - new Date(b.importantDates?.registrationDeadline));
    } else if (sortBy === 'package') {
      result.sort((a, b) => b.package - a.package);
    } else if (sortBy === 'date') {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return result;
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '80vh', background: 'transparent', color: '#f8fafc' }}>
        <p>Syncing student portal workspace...</p>
      </div>
    );
  }

  // If in timeline detail view, show ApplicationTimeline stepper
  if (activeApplication) {
    return (
      <ApplicationTimeline 
        application={activeApplication} 
        onBack={() => setActiveApplication(null)}
        onAcceptOffer={handleAcceptOffer}
        onDeclineOffer={handleDeclineOffer}
      />
    );
  }

  return (
    <div className="student-dashboard" style={{ color: '#cbd5e1', padding: '20px' }}>
      
      {/* Summary Stats Widgets */}
      <div className="stats-grid" style={{ marginBottom: '32px' }}>
        <div className="stat-card" style={{ background: 'rgba(30, 41, 59, 0.45)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="stat-icon" style={{ fontSize: '24px' }}>📝</div>
          <div className="stat-info">
            <h3 style={{ fontSize: '28px', color: '#38bdf8' }}>{applications.length}</h3>
            <p style={{ fontSize: '13px', color: '#94a3b8' }}>Applications Submitted</p>
          </div>
        </div>

        <div className="stat-card" style={{ background: 'rgba(30, 41, 59, 0.45)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="stat-icon" style={{ fontSize: '24px' }}>⏳</div>
          <div className="stat-info">
            <h3 style={{ fontSize: '28px', color: '#fbbf24' }}>
              {applications.filter(app => ['test_scheduled', 'technical_interview', 'hr_interview'].includes(app.status)).length}
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8' }}>Process In-Progress</p>
          </div>
        </div>

        <div className="stat-card" style={{ background: 'rgba(30, 41, 59, 0.45)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="stat-icon" style={{ fontSize: '24px' }}>🎉</div>
          <div className="stat-info">
            <h3 style={{ fontSize: '28px', color: '#10b981' }}>
              {applications.filter(app => app.status === 'selected').length}
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8' }}>Offers Extended</p>
          </div>
        </div>

        <div className="stat-card" style={{ background: 'rgba(30, 41, 59, 0.45)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="stat-icon" style={{ fontSize: '24px' }}>🔔</div>
          <div className="stat-info">
            <h3 style={{ fontSize: '28px', color: '#818cf8' }}>
              {notifications.filter(n => !n.isRead).length}
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8' }}>Unread Alerts</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="dashboard-tabs" style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '32px', paddingBottom: '2px' }}>
        <button className={`tab-btn ${activeTab === 'drives' ? 'active' : ''}`} onClick={() => setActiveTab('drives')}>
          💼 Placement Drives
        </button>
        <button className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          🧑‍🎓 Student Profile
        </button>
        <button className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
          📊 Stats & Funnel
        </button>
        <button className={`tab-btn ${activeTab === 'applications' ? 'active' : ''}`} onClick={() => setActiveTab('applications')}>
          📝 Applications Tracker
        </button>
        <button className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
          🔔 Notification Center
        </button>
      </div>

      {/* TABS VIEWPORT */}
      
      {/* 1. DRIVES TAB */}
      {activeTab === 'drives' && (
        <div style={{ display: 'grid', gap: '32px' }}>
          
          {/* Recommendations Carousel */}
          {getRecommendedDrives().length > 0 && (
            <div style={{
              background: 'rgba(129, 140, 248, 0.05)',
              border: '1px solid rgba(129, 140, 248, 0.15)',
              borderRadius: '16px',
              padding: '20px'
            }}>
              <h4 style={{ color: '#818cf8', fontWeight: '800', marginBottom: '14px', fontSize: '15px' }}>
                💡 Recommended Placement Drives For You
              </h4>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {getRecommendedDrives().map(drive => (
                  <div key={drive._id} style={{
                    flex: '1 1 230px',
                    background: 'rgba(15, 23, 42, 0.5)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '10px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '130px'
                  }}>
                    <div>
                      <h5 style={{ color: '#f8fafc', fontWeight: '700', fontSize: '14px', margin: '0 0 4px' }}>{drive.jobTitle}</h5>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>🏢 {drive.company}</span>
                      <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '6px' }}>💰 {drive.formattedSalary} | Min CGPA: {drive.eligibilityRules?.minCgpa}</div>
                    </div>
                    <button 
                      onClick={() => setOptInConfirm(drive)} 
                      style={{ marginTop: '12px', padding: '6px 12px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', alignSelf: 'flex-start' }}
                    >
                      Quick Opt-In
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search, Filter, Sort Controls */}
          <div style={{
            background: 'rgba(30,41,59,0.35)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '20px',
            display: 'grid',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {/* Search bar */}
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search drives by company, role, description..."
                style={{ flex: '2 1 300px', padding: '10px 14px', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'white' }}
              />
              
              {/* Sort by */}
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ flex: '1 1 150px', padding: '10px', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'white' }}
              >
                <option value="deadline">⏱ Registration Deadline</option>
                <option value="package">💰 Package (CTC)</option>
                <option value="date">📅 Newest Posted</option>
              </select>
            </div>

            {/* Filter Sub-panel */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center', fontSize: '13px' }}>
              
              {/* Package Slider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Min Salary: {filters.minPackage} LPA</span>
                <input 
                  type="range"
                  min="0"
                  max="15"
                  step="0.5"
                  value={filters.minPackage}
                  onChange={(e) => setFilters(prev => ({ ...prev, minPackage: parseFloat(e.target.value) }))}
                  style={{ cursor: 'pointer' }}
                />
              </div>

              {/* Checkboxes */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input 
                  type="checkbox"
                  checked={filters.eligibleOnly}
                  onChange={(e) => setFilters(prev => ({ ...prev, eligibleOnly: e.target.checked }))}
                />
                Show Eligible Only
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input 
                  type="checkbox"
                  checked={filters.departmentMatch}
                  onChange={(e) => setFilters(prev => ({ ...prev, departmentMatch: e.target.checked }))}
                />
                Allowed In My Dept
              </label>

              {/* Job type dropdown */}
              <select
                value={filters.jobType}
                onChange={(e) => setFilters(prev => ({ ...prev, jobType: e.target.value }))}
                style={{ padding: '6px 12px', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: 'white' }}
              >
                <option value="all">All Types</option>
                <option value="full-time">Full-time</option>
                <option value="internship">Internship</option>
                <option value="ppo">PPO</option>
              </select>

              {/* Work mode dropdown */}
              <select
                value={filters.workMode}
                onChange={(e) => setFilters(prev => ({ ...prev, workMode: e.target.value }))}
                style={{ padding: '6px 12px', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: 'white' }}
              >
                <option value="all">All Modes</option>
                <option value="onsite">Onsite</option>
                <option value="hybrid">Hybrid</option>
                <option value="remote">Remote</option>
              </select>
            </div>
          </div>

          {/* Drives Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '24px' }}>
            {getFilteredDrives().length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', background: 'rgba(30,41,59,0.15)', borderRadius: '12px' }}>
                <p style={{ color: '#64748b' }}>No active recruitment drives match your query.</p>
              </div>
            ) : (
              getFilteredDrives().map(drive => {
                const isAlreadyApplied = applications.some(app => app.drive?._id === drive._id);
                const eligCheck = checkDriveEligibility(drive);
                const registrationDaysLeft = Math.ceil((new Date(drive.importantDates?.registrationDeadline) - new Date()) / (1000 * 60 * 60 * 24));
                const formattedDate = new Date(drive.importantDates?.registrationDeadline).toLocaleDateString();

                return (
                  <div key={drive._id} style={{
                    background: 'rgba(30, 41, 59, 0.45)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.3s'
                  }} className="drive-card">
                    
                    <div>
                      {/* Badge / Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                        <div>
                          <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc', margin: 0 }}>{drive.jobTitle}</h4>
                          <span style={{ fontSize: '13px', color: '#94a3b8' }}>🏢 {drive.company}</span>
                        </div>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '700',
                          background: drive.jobType === 'full-time' ? '#065f46' : (drive.jobType === 'internship' ? '#1e3a8a' : '#701a75'),
                          color: drive.jobType === 'full-time' ? '#34d399' : (drive.jobType === 'internship' ? '#93c5fd' : '#f472b6')
                        }}>
                          {drive.jobType.toUpperCase()}
                        </span>
                      </div>

                      {/* Packages & Location */}
                      <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#38bdf8', marginBottom: '16px', fontWeight: '600' }}>
                        <span>💰 {drive.formattedSalary}</span>
                        <span>📍 {drive.location?.join(', ')}</span>
                        <span style={{ textTransform: 'capitalize' }}>💻 {drive.workMode}</span>
                      </div>

                      {/* Skills Tags */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
                        {drive.skills?.map(skill => (
                          <span key={skill} style={{ fontSize: '11px', padding: '2px 8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', color: '#94a3b8' }}>
                            {skill}
                          </span>
                        ))}
                      </div>

                      {/* Why Not Eligible panel */}
                      <div style={{
                        background: eligCheck.eligible ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                        border: `1px solid ${eligCheck.eligible ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}`,
                        borderRadius: '8px',
                        padding: '12px',
                        fontSize: '12px',
                        marginBottom: '20px'
                      }}>
                        <div style={{ fontWeight: '700', color: eligCheck.eligible ? '#34d399' : '#f87171', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {eligCheck.eligible ? '✓ Eligible for Drive' : '✕ Not Eligible for Drive'}
                        </div>
                        {!eligCheck.eligible && (
                          <ul style={{ paddingLeft: '16px', marginTop: '6px', color: '#ef4444', listStyleType: 'circle', lineHeight: '1.6' }}>
                            {eligCheck.reasons.map((r, i) => <li key={i}>{r}</li>)}
                          </ul>
                        )}
                        {eligCheck.eligible && (
                          <p style={{ color: '#64748b', marginTop: '4px' }}>Meets all CGPA, department, and offer eligibility bounds.</p>
                        )}
                      </div>
                    </div>

                    {/* Actions and Deadlines */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '12px' }}>
                        <span>Deadline: {formattedDate}</span>
                        <span style={{ color: registrationDaysLeft <= 3 ? '#ef4444' : '#64748b', fontWeight: '600' }}>
                          {registrationDaysLeft <= 0 ? 'Passed' : `${registrationDaysLeft} days left`}
                        </span>
                      </div>

                      <div style={{ marginTop: '16px' }}>
                        {isAlreadyApplied ? (
                          <button disabled style={{ width: '100%', padding: '10px', background: '#334155', color: '#64748b', border: 'none', borderRadius: '8px', fontWeight: '700' }}>
                            ✓ Already Opted-In
                          </button>
                        ) : (
                          <button
                            disabled={!eligCheck.eligible || registrationDaysLeft <= 0}
                            onClick={() => setOptInConfirm(drive)}
                            style={{
                              width: '100%',
                              padding: '10px',
                              background: eligCheck.eligible && registrationDaysLeft > 0 ? 'linear-gradient(to right, #4f46e5, #6366f1)' : '#1e293b',
                              color: eligCheck.eligible && registrationDaysLeft > 0 ? 'white' : '#475569',
                              border: 'none',
                              borderRadius: '8px',
                              fontWeight: '700',
                              cursor: eligCheck.eligible && registrationDaysLeft > 0 ? 'pointer' : 'not-allowed'
                            }}
                          >
                            Opt-In & Apply
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>

          {/* Opt-In Confirmation Overlay Modal */}
          {optInConfirm && (
            <div style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(15,23,42,0.85)',
              backdropFilter: 'blur(8px)',
              zIndex: 2000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}>
              <div style={{
                background: '#1e293b',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                padding: '32px',
                maxWidth: '500px',
                width: '100%',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
              }}>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#38bdf8', marginBottom: '12px' }}>
                  Confirm Drive Opt-In
                </h3>
                <p style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6', marginBottom: '24px' }}>
                  You are opting-in to apply for the role of <strong>{optInConfirm.jobTitle}</strong> at <strong>{optInConfirm.company}</strong>. 
                  This will submit your current verified student profile (including your CGPA of {profile?.cgpa} and your uploaded Resume PDF) to the recruitment coordinator.
                </p>
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                  <button 
                    onClick={() => setOptInConfirm(null)} 
                    style={{ padding: '10px 20px', background: '#334155', color: '#cbd5e1', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleOptInSubmit} 
                    style={{ padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Confirm & Apply
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* 2. PROFILE TAB */}
      {activeTab === 'profile' && profile && (
        <div style={{ maxWidth: '750px', margin: '0 auto', background: 'rgba(30,41,59,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>
            <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#f8fafc' }}>👩‍🎓 Student Profile Details</h3>
            <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: '700', background: '#065f46', color: '#34d399' }}>
              ✓ VERIFIED
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <div>
              <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>FULL NAME</span>
              <strong style={{ fontSize: '15px', color: '#cbd5e1' }}>{user.name}</strong>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>EMAIL ADDRESS</span>
              <strong style={{ fontSize: '15px', color: '#cbd5e1' }}>{user.email}</strong>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>ROLL NUMBER / ID</span>
              <strong style={{ fontSize: '15px', color: '#cbd5e1' }}>{profile.rollNo}</strong>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>PHONE NUMBER</span>
              <strong style={{ fontSize: '15px', color: '#cbd5e1' }}>{profile.phone}</strong>
            </div>
          </div>

          <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#818cf8', marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
            Academic Records
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <div>
              <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>DEPARTMENT / BRANCH</span>
              <strong style={{ fontSize: '15px', color: '#cbd5e1' }}>{profile.department} ({profile.branch})</strong>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>CUMULATIVE CGPA</span>
              <strong style={{ fontSize: '15px', color: '#cbd5e1' }}>{profile.cgpa} / 10.0</strong>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>ACTIVE BACKLOGS</span>
              <strong style={{ fontSize: '15px', color: profile.backlogs > 0 ? '#ef4444' : '#10b981' }}>
                {profile.backlogs}
              </strong>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>GRADUATION YEAR</span>
              <strong style={{ fontSize: '15px', color: '#cbd5e1' }}>{profile.gradYear}</strong>
            </div>
          </div>

          <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#818cf8', marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
            Skills & Files
          </h4>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '6px' }}>SKILLS MATCHING</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {profile.skills?.map(skill => (
                  <span key={skill} style={{ fontSize: '12px', padding: '4px 10px', background: 'rgba(129, 140, 248, 0.1)', border: '1px solid rgba(129,140,248,0.2)', borderRadius: '6px', color: '#818cf8' }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '10px' }}>
              <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '6px' }}>SUBMITTED RESUME</span>
              {profile.resumePath ? (
                <a 
                  href={`http://localhost:5000${profile.resumePath}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="cta-button"
                  style={{ display: 'inline-block', padding: '8px 16px', background: '#334155', color: '#38bdf8', border: 'none', borderRadius: '6px', textDecoration: 'none', fontSize: '13px', fontWeight: '600' }}
                >
                  📄 View PDF Resume
                </a>
              ) : (
                <span style={{ color: '#ef4444' }}>No Resume Uploaded</span>
              )}
            </div>
          </div>

          <div style={{ marginTop: '32px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px', textAlign: 'right' }}>
            <button onClick={() => navigate('/profile-setup')} style={{ padding: '8px 20px', background: 'linear-gradient(to right, #4f46e5, #6366f1)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
              ✏️ Edit Info & Resume
            </button>
          </div>
        </div>
      )}

      {/* 3. ANALYTICS TAB */}
      {activeTab === 'analytics' && stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
          
          {/* Funnel Widget */}
          <div style={{ background: 'rgba(30,41,59,0.35)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#f8fafc', marginBottom: '16px' }}>📈 Application Conversion Funnel</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
              
              {/* Total Applications bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                  <span>Total Opted-In</span>
                  <strong>{stats.totalApplications}</strong>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                  <div style={{ height: '100%', width: '100%', background: '#3b82f6', borderRadius: '4px' }} />
                </div>
              </div>

              {/* Shortlisted */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                  <span>Shortlisted / Passed Initial Rounds</span>
                  <strong>{stats.shortlisted + stats.technicalInterview + stats.hrInterview + stats.finalShortlist + stats.selected}</strong>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${stats.totalApplications > 0 ? ((stats.shortlisted + stats.technicalInterview + stats.hrInterview + stats.finalShortlist + stats.selected) / stats.totalApplications) * 100 : 0}%`, 
                    background: '#fbbf24', 
                    borderRadius: '4px' 
                  }} />
                </div>
              </div>

              {/* Interviews */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                  <span>Interviews Scheduled (Tech/HR)</span>
                  <strong>{stats.technicalInterview + stats.hrInterview}</strong>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${stats.totalApplications > 0 ? ((stats.technicalInterview + stats.hrInterview) / stats.totalApplications) * 100 : 0}%`, 
                    background: '#818cf8', 
                    borderRadius: '4px' 
                  }} />
                </div>
              </div>

              {/* Selected offers */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                  <span>Offers Received</span>
                  <strong>{stats.selected}</strong>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${stats.totalApplications > 0 ? (stats.selected / stats.totalApplications) * 100 : 0}%`, 
                    background: '#10b981', 
                    borderRadius: '4px' 
                  }} />
                </div>
              </div>

            </div>
          </div>

          {/* CGPA Match analytics */}
          <div style={{ background: 'rgba(30,41,59,0.35)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#f8fafc', marginBottom: '16px' }}>🎯 Cutoff Threshold Matching</h4>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '56px', fontWeight: '800', color: '#38bdf8' }}>{profile?.cgpa || 0}</div>
              <span style={{ fontSize: '12px', color: '#64748b', letterSpacing: '1px' }}>YOUR CURRENT CGPA</span>
              
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-around', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '20px', color: '#f8fafc' }}>
                    {drives.filter(d => profile?.cgpa >= d.eligibilityRules?.minCgpa).length}
                  </strong>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Matching CGPA Cutoffs</span>
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: '20px', color: '#ef4444' }}>
                    {drives.filter(d => profile?.cgpa < d.eligibilityRules?.minCgpa).length}
                  </strong>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Blocked by Cutoff</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* 4. APPLICATIONS TAB */}
      {activeTab === 'applications' && (
        <div style={{ display: 'grid', gap: '20px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#f8fafc' }}>📝 Applied Placement Drives</h3>
          {applications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(30,41,59,0.15)', borderRadius: '12px' }}>
              <p style={{ color: '#64748b' }}>You haven't opted-in to any recruitment drives yet.</p>
              <button onClick={() => setActiveTab('drives')} className="cta-button" style={{ marginTop: '16px', border: 'none', padding: '8px 16px', borderRadius: '8px', background: '#0284c7', color: 'white', cursor: 'pointer' }}>
                Browse Drives
              </button>
            </div>
          ) : (
            applications.map(app => {
              const appliedDate = new Date(app.createdAt).toLocaleDateString();
              const latestUpdate = new Date(app.updatedAt).toLocaleDateString();

              return (
                <div key={app._id} style={{
                  background: 'rgba(30, 41, 59, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                  transition: 'all 0.2s'
                }} className="application-card-row">
                  <div>
                    <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#f8fafc', margin: '0 0 4px' }}>
                      {app.job?.jobTitle || app.drive?.role}
                    </h4>
                    <span style={{ fontSize: '13px', color: '#94a3b8' }}>🏢 {app.job?.company || 'Company'}</span>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                      <span>Applied: {appliedDate}</span>
                      <span>Updated: {latestUpdate}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                      background: app.status === 'selected' ? '#065f46' : (app.status === 'closed' ? '#7f1d1d' : '#1e293b'),
                      color: app.status === 'selected' ? '#34d399' : (app.status === 'closed' ? '#fca5a5' : '#38bdf8'),
                      border: `1px solid ${app.status === 'selected' ? '#059669' : (app.status === 'closed' ? '#b91c1c' : '#0284c7')}`
                    }}>
                      {app.status.replace('_', ' ').toUpperCase()}
                    </span>

                    <button 
                      onClick={() => setActiveApplication(app)}
                      style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      Track Application
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 5. NOTIFICATIONS TAB */}
      {activeTab === 'notifications' && (
        <div style={{ display: 'grid', gap: '16px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#f8fafc' }}>🔔 Notifications & Reminders</h3>
          {notifications.length === 0 ? (
            <p style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>No active notifications.</p>
          ) : (
            notifications.map(notif => {
              const notifDate = new Date(notif.createdAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
              });

              return (
                <div key={notif._id} style={{
                  background: 'rgba(30, 41, 59, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div>
                    <p style={{ fontSize: '14px', color: '#cbd5e1', margin: '0 0 4px', lineHeight: '1.4' }}>
                      {notif.message}
                    </p>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>{notifDate}</span>
                  </div>
                  {!notif.isRead && (
                    <span style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', flexShrink: 0 }} />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

    </div>
  );
};

export default StudentDashboard;

