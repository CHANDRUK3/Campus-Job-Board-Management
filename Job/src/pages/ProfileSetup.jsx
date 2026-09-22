import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, profileAPI } from '../utils/api';
import '../style.css';
import { Card, Input, Button } from '../components/ui';

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
      const data = await profileAPI.getProfile(userId);
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

      await profileAPI.updateProfile(user.id || user._id, postData);
      setMessage({ text: 'Profile submitted successfully! Awaiting verification by the Placement Cell.', type: 'success' });
      fetchProfile(user.id || user._id);
    } catch (err) {
      console.error('Error submitting profile:', err);
      setMessage({ text: err.message || 'Server error. Please try again.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (loading) return <div className="flex-center" style={{ height: '100vh' }}><p>Loading profile information...</p></div>;

  // Render Pending verification dashboard
  if (profile && profile.profileStatus === 'pending') {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', padding: 20 }}>
        <Card elevated style={{ maxWidth: 640, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
          <h2 className="lead" style={{ color: 'var(--accent)' }}>Verification Pending</h2>
          <p className="muted" style={{ marginBottom: 12 }}>
            Hello, <strong>{user?.name}</strong>! Your placement profile (Roll No: <strong>{profile.rollNo}</strong>) has been submitted and is under verification.
          </p>

          <div style={{ textAlign: 'left', background: 'var(--info-soft)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
            <strong>Submitted Details:</strong>
            <ul style={{ marginTop: 8, paddingLeft: 18 }}>
              <li>Department: {profile.department} ({profile.branch})</li>
              <li>CGPA: {profile.cgpa}</li>
              <li>Backlogs: {profile.backlogs}</li>
              <li>Graduation Year: {profile.gradYear}</li>
            </ul>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Button variant="ghost" onClick={() => fetchProfile(user.id || user._id)}>Refresh Status</Button>
            <Button variant="ghost" onClick={handleLogout}>Logout</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 920, margin: '0 auto' }}>
        <Card elevated>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <h1>Placement Profile Setup</h1>
              <p className="muted" style={{ marginTop: 6 }}>Complete your profile to enable drive registrations.</p>
            </div>
            <Button variant="ghost" onClick={handleLogout}>Logout</Button>
          </div>

          {/* Rejected Alert */}
          {profile && profile.profileStatus === 'rejected' && (
            <Card className="alert" style={{ background: 'var(--danger-soft)', borderColor: 'rgba(239,68,68,0.2)', marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ fontWeight: 700, color: 'var(--danger)' }}>⚠️ Profile Verification Rejected</div>
                <div style={{ color: 'var(--text-muted)' }}>{profile.rejectionReason || 'No reason provided.'}</div>
              </div>
            </Card>
          )}

          {message.text && (
            <Card className="alert" style={{ background: message.type === 'error' ? 'var(--danger-soft)' : 'var(--success-soft)', borderColor: message.type === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.15)', marginBottom: 12 }}>
              {message.text}
            </Card>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 18 }}>
            <h4>1. Enrollment Information</h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <Input id="rollNo" label="Roll Number / Student ID" name="rollNo" value={formData.rollNo} onChange={handleInputChange} required placeholder="e.g. CS202305" className="ui-input" />
              <Input id="phone" label="Phone Number" name="phone" value={formData.phone} onChange={handleInputChange} required placeholder="e.g. 9876543210" className="ui-input" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <label className="ui-field">
                <div className="ui-field__label">Department</div>
                <select name="department" value={formData.department} onChange={handleInputChange} className="ui-input">
                  {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                </select>
              </label>

              <label className="ui-field">
                <div className="ui-field__label">Branch / Degree</div>
                <select name="branch" value={formData.branch} onChange={handleInputChange} className="ui-input">
                  {branches.map(br => <option key={br} value={br}>{br}</option>)}
                </select>
              </label>
            </div>

            <h4>2. Academic Criteria</h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <Input id="cgpa" label="Current CGPA" name="cgpa" type="number" step="0.01" min="0" max="10" value={formData.cgpa} onChange={handleInputChange} required className="ui-input" />
              <Input id="backlogs" label="Active Backlogs" name="backlogs" type="number" min="0" value={formData.backlogs} onChange={handleInputChange} required className="ui-input" />
              <Input id="gradYear" label="Graduation Year" name="gradYear" type="number" value={formData.gradYear} onChange={handleInputChange} required className="ui-input" />
            </div>

            <h4>3. Skills & Preferences</h4>

            <label className="ui-field">
              <div className="ui-field__label">Key Skills (comma separated)</div>
              <input name="skills" value={formData.skills} onChange={handleInputChange} placeholder="e.g. React, Node.js" className="ui-input" />
            </label>

            <label className="ui-field">
              <div className="ui-field__label">Preferred Job Locations (comma separated)</div>
              <input name="locationPref" value={formData.locationPref} onChange={handleInputChange} placeholder="e.g. Bangalore, Hyderabad" className="ui-input" />
            </label>

            <label className="ui-field">
              <div className="ui-field__label">Portfolio URL</div>
              <input name="portfolioUrl" type="url" value={formData.portfolioUrl} onChange={handleInputChange} placeholder="https://myportfolio.com" className="ui-input" />
            </label>

            <label className="ui-field">
              <div className="ui-field__label">Brief Academic & Project Summary</div>
              <textarea name="academicHistory" rows="3" value={formData.academicHistory} onChange={handleInputChange} placeholder="Outline major projects..." className="ui-input" style={{ minHeight: 80 }} />
            </label>

            <h4>4. Resume Upload</h4>

            <div style={{ border: '2px dashed var(--surface-stroke)', borderRadius: 12, padding: 18, textAlign: 'center' }}>
              <input type="file" accept=".pdf" onChange={handleFileChange} style={{ display: 'none' }} id="resume-upload" />
              <label htmlFor="resume-upload" style={{ cursor: 'pointer', display: 'block' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📁</div>
                <div style={{ color: 'var(--accent)', fontWeight: 700 }}>Choose PDF Resume File</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>Only PDF format, max size 5MB</div>
              </label>
              {resumeFile && <p style={{ marginTop: 12, color: 'var(--success)' }}>✓ Selected: {resumeFile.name} ({(resumeFile.size / 1024 / 1024).toFixed(2)} MB)</p>}
              {profile?.resumePath && !resumeFile && <p style={{ marginTop: 12, color: 'var(--text-muted)' }}>✓ Current Resume: <a href={`http://localhost:5000${profile.resumePath}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>View PDF</a></p>}
            </div>

            <div>
              <Button variant="primary" type="submit" disabled={submitting} style={{ width: '100%' }}>{submitting ? 'Submitting details...' : 'Submit Profile for Verification'}</Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ProfileSetup;
