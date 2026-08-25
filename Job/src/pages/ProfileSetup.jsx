import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser } from '../utils/api';
import '../style.css';

const ProfileSetup = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    rollNo: '',
    department: 'CSE',
    branch: 'B.Tech',
    cgpa: '',
    backlogs: '0',
    gradYear: new Date().getFullYear().toString(),
    phone: '',
    skills: '',
    locationPref: '',
    academicHistory: '',
    portfolioUrl: ''
  });

  const departments = ['CSE', 'ECE', 'EEE', 'MECH', 'MBA', 'AIML & AIDS'];
  const branches = ['B.Tech', 'M.Tech', 'MBA', 'MCA', 'B.Sc', 'M.Sc'];

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser || currentUser.role !== 'student') {
      navigate('/login');
      return;
    }
    setUser(currentUser);
    fetchProfile(currentUser.id || currentUser._id);
  }, [navigate]);

  const fetchProfile = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/profile/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        // Pre-fill form
        setFormData({
          rollNo: data.rollNo || '',
          department: data.department || 'CSE',
          branch: data.branch || 'B.Tech',
          cgpa: data.cgpa ? data.cgpa.toString() : '',
          backlogs: data.backlogs ? data.backlogs.toString() : '0',
          gradYear: data.gradYear ? data.gradYear.toString() : new Date().getFullYear().toString(),
          phone: data.phone || '',
          skills: data.skills ? data.skills.join(', ') : '',
          locationPref: data.locationPref ? data.locationPref.join(', ') : '',
          academicHistory: data.academicHistory || '',
          portfolioUrl: data.portfolioUrl || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    setResumeFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    setSubmitting(true);

    // Validate fields
    if (!formData.rollNo.trim()) {
      setMessage({ text: 'Roll Number is required', type: 'error' });
      setSubmitting(false);
      return;
    }
    const cgpaNum = parseFloat(formData.cgpa);
    if (isNaN(cgpaNum) || cgpaNum < 0 || cgpaNum > 10) {
      setMessage({ text: 'CGPA must be a valid number between 0 and 10', type: 'error' });
      setSubmitting(false);
      return;
    }

    try {
      const postData = new FormData();
      Object.keys(formData).forEach(key => {
        postData.append(key, formData[key]);
      });
      if (resumeFile) {
        postData.append('resume', resumeFile);
      } else if (!profile?.resumePath) {
        setMessage({ text: 'Please upload your resume in PDF format.', type: 'error' });
        setSubmitting(false);
        return;
      }

      const response = await fetch(`http://localhost:5000/api/profile/${user.id || user._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: postData
      });

      const resData = await response.json();
      if (response.ok) {
        setMessage({ text: 'Profile submitted successfully! Awaiting verification by the Placement Cell.', type: 'success' });
        fetchProfile(user.id || user._id);
      } else {
        setMessage({ text: resData.message || 'Failed to submit profile', type: 'error' });
      }
    } catch (err) {
      console.error('Error submitting profile:', err);
      setMessage({ text: 'Server error. Please try again.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '100vh', background: '#0f172a', color: '#f8fafc' }}>
        <p>Loading profile information...</p>
      </div>
    );
  }

  // Render Pending verification dashboard
  if (profile && profile.profileStatus === 'pending') {
    return (
      <div className="flex-center" style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        color: '#f8fafc',
        fontFamily: 'system-ui, sans-serif',
        padding: '20px'
      }}>
        <div style={{
          background: 'rgba(30, 41, 59, 0.7)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '550px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>⏳</div>
          <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '16px', color: '#38bdf8' }}>
            Verification Pending
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '16px', lineHeight: '1.6', marginBottom: '24px' }}>
            Hello, <strong>{user?.name}</strong>! Your placement profile (Roll No: <strong>{profile.rollNo}</strong>) has been submitted.
            The Placement Cell is currently verifying your details and academic records.
          </p>
          <div style={{
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            borderRadius: '8px',
            padding: '16px',
            fontSize: '14px',
            color: '#7dd3fc',
            textAlign: 'left',
            marginBottom: '32px'
          }}>
            <strong>📋 Submitted Details:</strong>
            <ul style={{ marginTop: '8px', paddingLeft: '20px', lineHeight: '1.8' }}>
              <li>Department: {profile.department} ({profile.branch})</li>
              <li>CGPA: {profile.cgpa}</li>
              <li>Backlogs: {profile.backlogs}</li>
              <li>Graduation Year: {profile.gradYear}</li>
            </ul>
          </div>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button 
              onClick={() => fetchProfile(user.id || user._id)} 
              className="cta-button"
              style={{ padding: '12px 24px', background: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            >
              🔄 Refresh Status
            </button>
            <button 
              onClick={handleLogout} 
              className="logout-btn"
              style={{ padding: '12px 24px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      color: '#f8fafc',
      fontFamily: 'Inter, sans-serif',
      padding: '40px 20px'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        padding: '40px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '800', background: 'linear-gradient(to right, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Placement Profile Setup
            </h1>
            <p style={{ color: '#94a3b8', marginTop: '6px' }}>Complete your profile to enable drive registrations.</p>
          </div>
          <button onClick={handleLogout} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', height: 'fit-content' }}>
            Logout
          </button>
        </div>

        {/* Rejected Alert */}
        {profile && profile.profileStatus === 'rejected' && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '12px',
            padding: '20px',
            color: '#fca5a5',
            marginBottom: '32px'
          }}>
            <h3 style={{ fontWeight: '700', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171' }}>
              ⚠️ Profile Verification Rejected
            </h3>
            <p style={{ marginTop: '8px', fontSize: '14px', lineHeight: '1.6' }}>
              <strong>Reason:</strong> {profile.rejectionReason || 'No reason provided.'}
            </p>
            <p style={{ marginTop: '8px', fontSize: '13px', color: '#fca5a5', opacity: 0.8 }}>
              Please review the feedback and update your academic/enrollment details below before re-submitting.
            </p>
          </div>
        )}

        {message.text && (
          <div style={{
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px',
            background: message.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
            border: `1px solid ${message.type === 'error' ? '#ef4444' : '#10b981'}`,
            color: message.type === 'error' ? '#fca5a5' : '#a7f3d0'
          }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '24px' }}>
          
          <h3 style={{ fontSize: '18px', fontWeight: '700', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px', color: '#818cf8' }}>
            1. Enrollment Information
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#cbd5e1' }}>Roll Number / Student ID</label>
              <input 
                name="rollNo" 
                value={formData.rollNo} 
                onChange={handleInputChange}
                required
                placeholder="e.g. CS202305"
                style={{ width: '100%', padding: '12px', background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: 'white' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#cbd5e1' }}>Phone Number</label>
              <input 
                name="phone" 
                value={formData.phone} 
                onChange={handleInputChange}
                required
                placeholder="e.g. 9876543210"
                style={{ width: '100%', padding: '12px', background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: 'white' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#cbd5e1' }}>Department</label>
              <select 
                name="department" 
                value={formData.department} 
                onChange={handleInputChange}
                style={{ width: '100%', padding: '12px', background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: 'white' }}
              >
                {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#cbd5e1' }}>Branch / Degree</label>
              <select 
                name="branch" 
                value={formData.branch} 
                onChange={handleInputChange}
                style={{ width: '100%', padding: '12px', background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: 'white' }}
              >
                {branches.map(br => <option key={br} value={br}>{br}</option>)}
              </select>
            </div>
          </div>

          <h3 style={{ fontSize: '18px', fontWeight: '700', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px', color: '#818cf8' }}>
            2. Academic Criteria
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#cbd5e1' }}>Current CGPA</label>
              <input 
                name="cgpa" 
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={formData.cgpa} 
                onChange={handleInputChange}
                required
                placeholder="e.g. 8.45"
                style={{ width: '100%', padding: '12px', background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: 'white' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#cbd5e1' }}>Active Backlogs</label>
              <input 
                name="backlogs" 
                type="number"
                min="0"
                value={formData.backlogs} 
                onChange={handleInputChange}
                required
                placeholder="0"
                style={{ width: '100%', padding: '12px', background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: 'white' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#cbd5e1' }}>Graduation Year</label>
              <input 
                name="gradYear" 
                type="number"
                value={formData.gradYear} 
                onChange={handleInputChange}
                required
                placeholder="e.g. 2026"
                style={{ width: '100%', padding: '12px', background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: 'white' }}
              />
            </div>
          </div>

          <h3 style={{ fontSize: '18px', fontWeight: '700', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px', color: '#818cf8' }}>
            3. Skills & Preferences
          </h3>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#cbd5e1' }}>Key Skills (comma separated)</label>
            <input 
              name="skills" 
              value={formData.skills} 
              onChange={handleInputChange}
              placeholder="e.g. React, Node.js, Python, SQL"
              style={{ width: '100%', padding: '12px', background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: 'white' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#cbd5e1' }}>Preferred Job Locations (comma separated)</label>
            <input 
              name="locationPref" 
              value={formData.locationPref} 
              onChange={handleInputChange}
              placeholder="e.g. Bangalore, Hyderabad, Pune"
              style={{ width: '100%', padding: '12px', background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: 'white' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#cbd5e1' }}>Portfolio URL</label>
            <input 
              name="portfolioUrl" 
              type="url"
              value={formData.portfolioUrl} 
              onChange={handleInputChange}
              placeholder="e.g. https://myportfolio.com"
              style={{ width: '100%', padding: '12px', background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: 'white' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#cbd5e1' }}>Brief Academic & Project Summary</label>
            <textarea 
              name="academicHistory" 
              rows="3"
              value={formData.academicHistory} 
              onChange={handleInputChange}
              placeholder="Outline major projects, CGPA history, or other certifications..."
              style={{ width: '100%', padding: '12px', background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: 'white', resize: 'vertical' }}
            />
          </div>

          <h3 style={{ fontSize: '18px', fontWeight: '700', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px', color: '#818cf8' }}>
            4. Resume Upload
          </h3>

          <div style={{
            border: '2px dashed rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center',
            background: 'rgba(30,41,59,0.3)'
          }}>
            <input 
              type="file" 
              accept=".pdf" 
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id="resume-upload"
            />
            <label htmlFor="resume-upload" style={{ cursor: 'pointer', display: 'block' }}>
              <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>📁</span>
              <span style={{ color: '#38bdf8', fontWeight: '600' }}>Choose PDF Resume File</span>
              <span style={{ display: 'block', color: '#64748b', fontSize: '12px', marginTop: '4px' }}>Only PDF format, max size 5MB</span>
            </label>
            {resumeFile && (
              <p style={{ marginTop: '12px', color: '#10b981', fontSize: '14px' }}>
                ✓ Selected: {resumeFile.name} ({(resumeFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
            {profile?.resumePath && !resumeFile && (
              <p style={{ marginTop: '12px', color: '#94a3b8', fontSize: '14px' }}>
                ✓ Current Resume: <a href={`http://localhost:5000${profile.resumePath}`} target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>View PDF</a>
              </p>
            )}
          </div>

          <div style={{ marginTop: '16px' }}>
            <button 
              type="submit" 
              disabled={submitting}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(to right, #2563eb, #4f46e5)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)',
                transition: 'all 0.2s'
              }}
            >
              {submitting ? 'Submitting details...' : 'Submit Profile for Verification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetup;
