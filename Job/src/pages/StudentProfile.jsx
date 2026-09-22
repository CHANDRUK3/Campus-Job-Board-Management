import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/ui/Layout/Sidebar';
import Topbar from '../components/ui/Layout/Topbar';
import { useAuth } from '../contexts/AuthContext';
import { profileAPI } from '../utils/api';
import { Button, Badge } from '../components/ui';
import { User, CheckCircle2, FileText, Award, MapPin, Briefcase } from 'lucide-react';
import '../style.css';

const StudentProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const userId = user.id || user._id;
      const data = await profileAPI.getProfile(userId);
      setProfile(data);
    } catch (err) {
      console.error('Error fetching student profile:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <Sidebar user={user} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar user={user} />

        <main style={{ padding: '32px 40px', maxWidth: 'var(--content-max-width)', width: '100%', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', color: 'var(--navy-deep)', margin: '0 0 4px 0' }}>
                My Academic Profile
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Institutional student record, academic credentials, and placement preferences.
              </p>
            </div>
            <Button variant="secondary" onClick={() => navigate('/profile-setup')}>
              Edit Profile Credentials
            </Button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              Loading profile details...
            </div>
          ) : (
            /* Two Column Profile Layout */
            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '28px' }}>
              {/* LEFT COLUMN */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* 1. Profile Identity Panel */}
                <div className="panel-card" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: '50%',
                      background: 'var(--navy)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '28px',
                      fontFamily: 'var(--font-serif)',
                      fontWeight: '700'
                    }}>
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: 'var(--navy-deep)', margin: 0 }}>
                          {user?.name}
                        </h2>
                        <span className={`badge ${profile?.profileStatus === 'verified' ? 'badge-forest' : 'badge-gold'}`}>
                          {profile?.profileStatus === 'verified' ? '✓ VERIFIED PROFILE' : 'PENDING VERIFICATION'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '14px', color: 'var(--text-secondary)' }}>
                        <span>Register No: <strong style={{ fontFamily: 'var(--font-mono)' }}>{profile?.rollNo || 'CS202301'}</strong></span>
                        <span>Department: <strong>{profile?.department || 'CSE'} ({profile?.branch || 'B.Tech'})</strong></span>
                      </div>

                      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>
                        <span>📧 {user?.email}</span>
                        <span>📞 {profile?.phone || '9876543210'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Academic Record Panel */}
                <div className="panel-card" style={{ marginBottom: 0 }}>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--navy-deep)', marginBottom: '16px' }}>
                    ACADEMIC RECORD
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
                    <div style={{ padding: '16px', background: 'var(--paper)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase' }}>CUMULATIVE CGPA</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '26px', fontWeight: '700', color: 'var(--navy-deep)', marginTop: '4px' }}>
                        {profile?.cgpa || '8.2'}
                      </div>
                    </div>

                    <div style={{ padding: '16px', background: 'var(--paper)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase' }}>ACTIVE BACKLOGS</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '26px', fontWeight: '700', color: (profile?.backlogs || 0) === 0 ? 'var(--forest)' : 'var(--brick)', marginTop: '4px' }}>
                        {profile?.backlogs ?? 0}
                      </div>
                    </div>

                    <div style={{ padding: '16px', background: 'var(--paper)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase' }}>GRADUATION YEAR</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '26px', fontWeight: '700', color: 'var(--navy-deep)', marginTop: '4px' }}>
                        {profile?.gradYear || 2026}
                      </div>
                    </div>
                  </div>

                  {profile?.academicHistory && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-soft)', fontSize: '14px', color: 'var(--text-secondary)' }}>
                      <strong>Transcript Summary:</strong> {profile.academicHistory}
                    </div>
                  )}
                </div>

                {/* 3. Skills Panel */}
                <div className="panel-card" style={{ marginBottom: 0 }}>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--navy-deep)', marginBottom: '16px' }}>
                    TECHNICAL SKILLS & TAGS
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {(profile?.skills || ['JavaScript', 'React', 'Node.js', 'Python', 'MongoDB', 'SQL']).map(skill => (
                      <span key={skill} style={{
                        padding: '6px 14px',
                        background: 'var(--navy-tint)',
                        color: 'var(--navy)',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '600',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 4. Documents Panel */}
                <div className="panel-card" style={{ marginBottom: 0 }}>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--navy-deep)', marginBottom: '16px' }}>
                    DOCUMENTS & CREDENTIALS
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'var(--paper)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <FileText size={20} style={{ color: 'var(--navy)' }} />
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--navy-deep)' }}>Verified Placement Resume (PDF)</div>
                        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Uploaded & attached to placement applications</div>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => alert('Opening PDF preview...')}>View PDF</Button>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* 1. Profile Readiness Panel */}
                <div className="panel-card" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
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
                    marginBottom: '16px'
                  }}>
                    <div style={{ width: '86%', height: '100%', background: 'var(--forest)' }} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--forest)' }}>
                      <CheckCircle2 size={16} /> <span>Academic details</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--forest)' }}>
                      <CheckCircle2 size={16} /> <span>Skills tagged</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--forest)' }}>
                      <CheckCircle2 size={16} /> <span>Resume PDF uploaded</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)' }}>
                      <span style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid var(--muted)', display: 'inline-block' }} />
                      <span>Career preferences</span>
                    </div>
                  </div>
                </div>

                {/* 2. Placement Preferences Panel */}
                <div className="panel-card" style={{ marginBottom: 0 }}>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--navy-deep)', marginBottom: '14px' }}>
                    PLACEMENT PREFERENCES
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    <div>
                      <span style={{ color: 'var(--muted)', fontSize: '12px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Preferred Locations</span>
                      <div style={{ fontWeight: '600', color: 'var(--navy-deep)', marginTop: '2px' }}>
                        {(profile?.locationPref || ['Bangalore', 'Remote', 'Hyderabad']).join(', ')}
                      </div>
                    </div>

                    <div>
                      <span style={{ color: 'var(--muted)', fontSize: '12px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Work Mode</span>
                      <div style={{ fontWeight: '600', color: 'var(--navy-deep)', marginTop: '2px' }}>Hybrid / On-site</div>
                    </div>

                    <div>
                      <span style={{ color: 'var(--muted)', fontSize: '12px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Expected Package</span>
                      <div style={{ fontWeight: '600', color: 'var(--forest)', marginTop: '2px' }}>6.0 - 12.0 LPA</div>
                    </div>
                  </div>
                </div>

                {/* 3. Portfolio & Links Panel */}
                <div className="panel-card" style={{ marginBottom: 0 }}>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--navy-deep)', marginBottom: '12px' }}>
                    ONLINE PORTFOLIO
                  </h3>
                  {profile?.portfolioUrl ? (
                    <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--navy)', textDecoration: 'none', fontWeight: '600', fontSize: '14px' }}>
                      🌐 {profile.portfolioUrl}
                    </a>
                  ) : (
                    <span style={{ color: 'var(--muted)', fontSize: '13px' }}>No portfolio URL linked yet.</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default StudentProfile;
