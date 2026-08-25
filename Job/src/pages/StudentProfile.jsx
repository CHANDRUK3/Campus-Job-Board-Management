import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, profileAPI } from '../utils/api';
import '../style.css';

const StudentProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState({
    academicHistory: '',
    resumePath: '',
    portfolioUrl: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [resumeFile, setResumeFile] = useState(null);

  useEffect(() => {
    const currentUser = getUser();
    if (currentUser) {
      if (currentUser.role === 'student' && (currentUser.id || currentUser._id)) {
        setUser(currentUser);
        fetchProfile(currentUser.id || currentUser._id);
      } else {
        navigate('/');
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const fetchProfile = async (id) => {
    setLoading(true);
    try {
      const data = await profileAPI.get(id);
      setProfileData(data);
      setMessage('');
    } catch (err) {
      console.error('Fetch error:', err);
      if (err.message.includes('404') || err.message.includes('not found')) {
        setProfileData({ academicHistory: '', resumePath: '', portfolioUrl: '' });
        setMessage('No profile found. Please create one.');
      } else {
        setMessage('Failed to load profile.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setProfileData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    setResumeFile(e.target.files[0]);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const userId = user?.id || user?._id;
    if (!user || !userId) {
      setMessage("User not found. Login again.");
      return;
    }

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('academicHistory', profileData.academicHistory);
      formData.append('portfolioUrl', profileData.portfolioUrl);
      
      if (resumeFile) {
        formData.append('resume', resumeFile);
      }

      const response = await fetch(`http://localhost:5000/api/profile/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save profile');
      }

      const data = await response.json();
      setMessage(data.message || 'Profile saved successfully');
      setIsEditing(false);
      setResumeFile(null);
      fetchProfile(userId);
    } catch (err) {
      console.error('Save error:', err);
      setMessage(err.message || 'Failed to save profile.');
    }
  };

  if (loading) return <div className="loading-container">Loading profile...</div>;
  if (!user) return null;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>🧑‍🎓 Student Profile</h2>
        <button onClick={() => setIsEditing(!isEditing)} className="edit-btn">
          {isEditing ? 'Cancel' : '✏️ Edit Profile'}
        </button>
      </div>

      <div className="profile-card">
        <h3>Personal Information</h3>
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
      </div>

      <form onSubmit={handleSave} className="profile-form">
        <h3>Academic & Professional Details</h3>
        <label>Academic History:</label>
        <textarea
          name="academicHistory"
          value={profileData.academicHistory}
          onChange={handleChange}
          rows="4"
          readOnly={!isEditing}
          placeholder="e.g., Bachelor of Technology in Computer Science, 2021-2025"
        />

        <label>Resume (PDF):</label>
        {isEditing ? (
          <div>
            <input 
              type="file" 
              accept=".pdf" 
              onChange={handleFileChange}
              style={{ marginBottom: '10px' }}
            />
            {resumeFile && (
              <p style={{ color: '#10b981', fontSize: '14px' }}>
                Selected: {resumeFile.name}
              </p>
            )}
            {profileData.resumePath && (
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                Current: {profileData.resumePath.split('/').pop()}
              </p>
            )}
          </div>
        ) : profileData.resumePath ? (
          <div>
            <a 
              href={`http://localhost:5000${profileData.resumePath}`} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                color: '#2563eb', 
                textDecoration: 'none',
                display: 'inline-block',
                padding: '8px 16px',
                backgroundColor: '#eff6ff',
                borderRadius: '6px',
                border: '1px solid #dbeafe'
              }}
            >
              📄 View Resume
            </a>
            <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '5px' }}>
              {profileData.resumePath.split('/').pop()}
            </p>
          </div>
        ) : (
          <span style={{ color: '#9ca3af' }}>No Resume Uploaded</span>
        )}

        <label>Portfolio Link:</label>
        <input
          type="url"
          name="portfolioUrl"
          value={profileData.portfolioUrl}
          onChange={handleChange}
          readOnly={!isEditing}
          placeholder="Link to your portfolio or personal website"
        />

        {isEditing && (
          <button type="submit" className="save-btn">Save</button>
        )}
      </form>

      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default StudentProfile;
