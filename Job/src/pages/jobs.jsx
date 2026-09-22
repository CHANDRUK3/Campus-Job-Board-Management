import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicLayout from '../components/ui/Layout/PublicLayout';
import DriveCard from '../components/DriveCard';
import { getUser, drivesAPI, profileAPI } from '../utils/api';
import { Button } from '../components/ui';
import { Search, Filter, Briefcase, Building2, AlertCircle, RefreshCw, ArrowUpDown, LayoutGrid, List, CheckCircle2, CircleX, ArrowRight, MapPin } from 'lucide-react';
import '../style.css';

const Jobs = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [drives, setDrives] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // View mode, Filter, Search & Sort states
  const [viewMode, setViewMode] = useState('ticket'); // 'ticket' | 'classic'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedDept, setSelectedDept] = useState('all');
  const [sortBy, setSortBy] = useState('deadline');

  useEffect(() => {
    const currentUser = getUser();
    if (currentUser) {
      setUser(currentUser);
      if (currentUser.role === 'student') {
        fetchStudentData(currentUser.id || currentUser._id);
      }
    }
    fetchDrives();
  }, []);

  const fetchStudentData = async (userId) => {
    try {
      const [profData, appsData] = await Promise.all([
        profileAPI.getProfile(userId).catch(() => null),
        fetch(`http://localhost:5000/api/applications/my`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
        }).then(res => res.ok ? res.json() : []).catch(() => [])
      ]);
      if (profData) setStudentProfile(profData);
      if (Array.isArray(appsData)) setApplications(appsData);
    } catch (err) {
      console.error('Error fetching student data:', err);
    }
  };

  const fetchDrives = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await drivesAPI.getAll();
      setDrives(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching drives:', err);
      setError('Failed to load placement drives. Please make sure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleOptIn = async (drive) => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'student') {
      alert('Only students can opt-in for recruitment drives.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ driveId: drive._id })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'Failed to opt in for drive');
      }

      alert(`Successfully opted in for ${drive.companyId?.name || drive.company || 'drive'}!`);
      if (user.id || user._id) {
        fetchStudentData(user.id || user._id);
      }
    } catch (err) {
      alert(err.message || 'Error opting in for drive');
    }
  };

  const handleViewDrive = (drive) => {
    navigate(`/placement-drives/${drive._id}`);
  };

  // Helper to evaluate drive eligibility for student profile
  const checkDriveEligibility = (drive) => {
    if (!studentProfile) return { eligible: false, reasons: ['Profile not found'] };
    if (studentProfile.profileStatus !== 'verified') return { eligible: false, reasons: ['Pending verification'] };
    const reasons = [];
    const minCgpa = drive.eligibilityRules?.minCgpa || 0;
    if (studentProfile.cgpa < minCgpa) reasons.push(`CGPA ${studentProfile.cgpa} < Cutoff ${minCgpa}`);
    const maxBacklogs = drive.eligibilityRules?.maxBacklogs ?? 0;
    if (studentProfile.backlogs > maxBacklogs) reasons.push(`Backlogs ${studentProfile.backlogs} > Max ${maxBacklogs}`);
    return { eligible: reasons.length === 0, reasons };
  };

  // Filter & Sort drives
  const filteredDrives = drives
    .filter(drive => {
      const companyName = drive.companyId?.name || drive.company || '';
      const roleTitle = drive.role || drive.jobTitle || '';
      const skills = (drive.skills || []).join(' ');
      const query = searchQuery.toLowerCase();

      const matchesSearch = !searchQuery || 
        companyName.toLowerCase().includes(query) ||
        roleTitle.toLowerCase().includes(query) ||
        skills.toLowerCase().includes(query);

      const matchesType = selectedType === 'all' || (drive.jobType || '').toLowerCase() === selectedType.toLowerCase();

      const allowedDepts = drive.eligibilityRules?.allowedDepartments || [];
      const matchesDept = selectedDept === 'all' || 
        allowedDepts.length === 0 || 
        allowedDepts.some(d => d.toLowerCase() === selectedDept.toLowerCase());

      return matchesSearch && matchesType && matchesDept;
    })
    .sort((a, b) => {
      if (sortBy === 'salary') {
        return (b.package || 0) - (a.package || 0);
      }
      if (sortBy === 'newest') {
        return new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now());
      }
      // default: deadline
      return new Date(a.importantDates?.registrationDeadline || Date.now()) - new Date(b.importantDates?.registrationDeadline || Date.now());
    });

  return (
    <PublicLayout>
      <div style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '36px 32px 60px 32px'
      }}>
        {/* Page Header */}
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
            <Briefcase size={14} />
            <span>CAMPUS RECRUITMENT DRIVES</span>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '32px',
            fontWeight: '700',
            color: 'var(--navy-deep)',
            margin: '0 0 8px 0'
          }}>
            Placement Drives
          </h1>
          <p style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '15px',
            color: 'var(--muted)',
            margin: 0,
            maxWidth: '640px'
          }}>
            Explore verified placement drives scheduled by leading companies for Kongu Engineering College students.
          </p>
        </div>

        {/* Search & Toolbar */}
        <div style={{
          background: '#ffffff',
          borderRadius: '10px',
          border: '1px solid var(--border)',
          padding: '16px 20px',
          marginBottom: '28px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 6px rgba(12, 27, 54, 0.03)'
        }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1 1 320px', minWidth: '260px' }}>
            <Search size={18} style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--muted)'
            }} />
            <input
              type="text"
              placeholder="Search companies, roles, or skills (e.g., React, Java)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: '44px',
                padding: '0 16px 0 42px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--paper)',
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                color: 'var(--text-primary)',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Filters Group */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--muted)' }}>
              <Filter size={15} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase' }}>Filter:</span>
            </div>

            {/* Department Filter */}
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              style={{
                height: '40px',
                padding: '0 12px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: '#ffffff',
                fontFamily: 'var(--font-sans)',
                fontSize: '13px',
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Departments</option>
              <option value="CSE">CSE</option>
              <option value="ECE">ECE</option>
              <option value="EEE">EEE</option>
              <option value="MECH">MECH</option>
              <option value="MBA">MBA</option>
            </select>

            {/* Job Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{
                height: '40px',
                padding: '0 12px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: '#ffffff',
                fontFamily: 'var(--font-sans)',
                fontSize: '13px',
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Types</option>
              <option value="full-time">Full-time</option>
              <option value="internship">Internship</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
            <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '15px' }}>Loading active recruitment drives...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 20px',
            borderRadius: '8px',
            background: 'var(--brick-tint)',
            border: '1px solid rgba(161, 61, 43, 0.2)',
            color: 'var(--brick)',
            fontSize: '14px',
            marginBottom: '24px'
          }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Drives Listing Container */}
        {!loading && !error && (
          <>
            {/* Metadata Bar & View Mode Toggle + Custom Sort Control */}
            <div style={{
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '12px',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--muted)'
            }}>
              <span>SHOWING {filteredDrives.length} OF {drives.length} RECRUITMENT DRIVES</span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {/* View Mode Segmented Control */}
                <div style={{
                  display: 'inline-flex',
                  background: '#ffffff',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  padding: '2px'
                }}>
                  <button
                    onClick={() => setViewMode('ticket')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      height: '32px',
                      padding: '0 10px',
                      borderRadius: '4px',
                      background: viewMode === 'ticket' ? 'var(--navy-tint)' : 'transparent',
                      color: viewMode === 'ticket' ? 'var(--navy-deep)' : 'var(--muted)',
                      border: 'none',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    <LayoutGrid size={13} />
                    <span>ADMIT TICKET VIEW</span>
                  </button>

                  <button
                    onClick={() => setViewMode('classic')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      height: '32px',
                      padding: '0 10px',
                      borderRadius: '4px',
                      background: viewMode === 'classic' ? 'var(--navy-tint)' : 'transparent',
                      color: viewMode === 'classic' ? 'var(--navy-deep)' : 'var(--muted)',
                      border: 'none',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    <List size={13} />
                    <span>CLASSIC LEDGER VIEW</span>
                  </button>
                </div>

                {/* Sort Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ArrowUpDown size={14} style={{ color: 'var(--muted)' }} />
                  <span>SORT:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{
                      height: '36px',
                      padding: '0 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      background: '#ffffff',
                      color: 'var(--navy-deep)',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="deadline">RECENT DEADLINE</option>
                    <option value="salary">HIGHEST CTC PACKAGE</option>
                    <option value="newest">NEWEST PUBLISHED</option>
                  </select>
                </div>
              </div>
            </div>

            {filteredDrives.length === 0 ? (
              <div style={{
                background: '#ffffff',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                padding: '60px 20px',
                textAlign: 'center',
                color: 'var(--muted)'
              }}>
                <Building2 size={36} style={{ marginBottom: '12px', color: 'var(--muted)', opacity: 0.5 }} />
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--navy-deep)', margin: '0 0 6px 0' }}>
                  No placement drives found
                </h3>
                <p style={{ fontSize: '14px', margin: 0 }}>
                  Try adjusting your search terms or department filters to see active drives.
                </p>
              </div>
            ) : viewMode === 'ticket' ? (
              /* MODERN TICKET VIEW */
              <div style={{ display: 'grid', gap: '20px' }}>
                {filteredDrives.map(drive => (
                  <DriveCard
                    key={drive._id}
                    drive={drive}
                    profile={studentProfile}
                    applications={applications}
                    onOptIn={(d) => handleOptIn(d)}
                    onView={() => handleViewDrive(drive)}
                  />
                ))}
              </div>
            ) : (
              /* CLASSIC INSTITUTIONAL LEDGER VIEW */
              <div style={{
                background: '#ffffff',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                overflow: 'hidden',
                boxShadow: '0 2px 6px rgba(12, 27, 54, 0.03)'
              }}>
                <table className="ledger-table">
                  <thead>
                    <tr>
                      <th>DRIVE REF</th>
                      <th>COMPANY & ROLE</th>
                      <th>PACKAGE CTC</th>
                      <th>LOCATION & MODE</th>
                      <th>ELIGIBILITY</th>
                      <th>DEADLINE</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDrives.map(drive => {
                      const refCode = `DRIVE-2026-${(drive._id || 'E0A').substring(drive._id ? drive._id.length - 3 : 0).toUpperCase()}`;
                      const companyName = drive.companyId?.name || drive.company || 'Partner Company';
                      const elig = checkDriveEligibility(drive);
                      const isApplied = applications.some(app => (app.drive?._id || app.drive) === drive._id);
                      const deadlineStr = drive.importantDates?.registrationDeadline
                        ? new Date(drive.importantDates.registrationDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'Open';

                      return (
                        <tr key={drive._id}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--muted)', fontWeight: '600' }}>
                            {refCode}
                          </td>
                          <td>
                            <div style={{ fontFamily: 'var(--font-serif)', fontWeight: '700', fontSize: '16px', color: 'var(--navy-deep)' }}>
                              {drive.role || drive.jobTitle}
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                              {companyName}
                            </div>
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--forest)', fontSize: '14px' }}>
                            ₹{drive.package} LPA
                          </td>
                          <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <MapPin size={13} style={{ color: 'var(--muted)' }} />
                              <span>{Array.isArray(drive.location) ? drive.location.join(', ') : drive.location}</span>
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                              {drive.workMode || 'Hybrid'} · {(drive.jobType || 'full-time').toUpperCase()}
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${elig.eligible ? 'badge-forest' : 'badge-brick'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              {elig.eligible ? <CheckCircle2 size={12} /> : <CircleX size={12} />}
                              <span>{elig.eligible ? '✓ Eligible' : '✕ Ineligible'}</span>
                            </span>
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--gold)', fontWeight: '600' }}>
                            {deadlineStr}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              {isApplied ? (
                                <Button variant="secondary" size="sm" disabled>✓ Applied</Button>
                              ) : elig.eligible ? (
                                <Button className="btn-gold" size="sm" onClick={() => handleOptIn(drive)}>
                                  Opt In
                                </Button>
                              ) : null}
                              <Button variant="secondary" size="sm" onClick={() => handleViewDrive(drive)}>
                                View Details →
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </PublicLayout>
  );
};

export default Jobs;
