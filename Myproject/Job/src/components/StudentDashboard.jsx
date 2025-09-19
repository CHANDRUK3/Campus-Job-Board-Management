import React, { useEffect, useState } from 'react';
import { getUser } from '../utils/api';
import '../style.css';

const StudentDashboard = ({ user }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/student/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
        setApplications(data.recentApplications || []);
        setInterviews(data.upcomingInterviews || []);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/student/applications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications || []);
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    }
  };

  const fetchInterviews = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/student/interviews/upcoming', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setInterviews(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch interviews:', error);
    }
  };

  const submitFeedback = async (feedbackData) => {
    try {
      const response = await fetch('http://localhost:5000/api/student/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(feedbackData)
      });

      if (response.ok) {
        alert('Feedback submitted successfully!');
        setFeedback(null);
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      alert('Failed to submit feedback');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'applied': '#3b82f6',
      'shortlisted': '#f59e0b',
      'interview_scheduled': '#8b5cf6',
      'interview_completed': '#06b6d4',
      'selected': '#10b981',
      'rejected': '#ef4444',
      'withdrawn': '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'applied': '📝',
      'shortlisted': '⭐',
      'interview_scheduled': '🎤',
      'interview_completed': '✅',
      'selected': '🎉',
      'rejected': '❌',
      'withdrawn': '↩️'
    };
    return icons[status] || '📄';
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (!dashboardData) {
    return <div className="error">Failed to load dashboard data</div>;
  }

  return (
    <div className="student-dashboard">
      <div className="dashboard-header">
        <h2>👨‍🎓 Student Dashboard</h2>
        <div className="dashboard-actions">
          <button onClick={fetchDashboardData} className="action-btn">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="dashboard-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'applications' ? 'active' : ''}`}
          onClick={() => setActiveTab('applications')}
        >
          📝 Applications
        </button>
        <button 
          className={`tab-btn ${activeTab === 'interviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('interviews')}
        >
          🎤 Interviews
        </button>
        <button 
          className={`tab-btn ${activeTab === 'feedback' ? 'active' : ''}`}
          onClick={() => setActiveTab('feedback')}
        >
          💬 Feedback
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="dashboard-content">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📝</div>
              <div className="stat-info">
                <h3>{dashboardData.applicationStats.totalApplications}</h3>
                <p>Total Applications</p>
                <small>{dashboardData.applicationStats.applied} Applied</small>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <div className="stat-info">
                <h3>{dashboardData.applicationStats.shortlisted}</h3>
                <p>Shortlisted</p>
                <small>{dashboardData.applicationStats.interviewScheduled} Interviews</small>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🎉</div>
              <div className="stat-info">
                <h3>{dashboardData.applicationStats.selected}</h3>
                <p>Selected</p>
                <small>Success Rate</small>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🎤</div>
              <div className="stat-info">
                <h3>{interviews.length}</h3>
                <p>Upcoming Interviews</p>
                <small>Next 30 days</small>
              </div>
            </div>
          </div>

          <div className="charts-grid">
            <div className="chart-card">
              <h3>📈 Application Status</h3>
              <div className="status-chart">
                {Object.entries(dashboardData.applicationStats).map(([key, value]) => {
                  if (key === 'totalApplications') return null;
                  return (
                    <div key={key} className="status-item">
                      <div className="status-info">
                        <span className="status-icon">{getStatusIcon(key)}</span>
                        <span className="status-label">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                      </div>
                      <div className="status-bar">
                        <div 
                          className="status-fill" 
                          style={{ 
                            width: `${(value / dashboardData.applicationStats.totalApplications) * 100}%`,
                            backgroundColor: getStatusColor(key)
                          }}
                        ></div>
                        <span className="status-count">{value}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="chart-card">
              <h3>🎯 Recent Applications</h3>
              <div className="recent-applications">
                {applications.slice(0, 5).map((app) => (
                  <div key={app._id} className="application-item">
                    <div className="app-info">
                      <h4>{app.job.jobTitle}</h4>
                      <p>🏢 {app.job.company}</p>
                    </div>
                    <div className="app-status">
                      <span 
                        className="status-badge" 
                        style={{ backgroundColor: getStatusColor(app.status) }}
                      >
                        {getStatusIcon(app.status)} {app.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Applications Tab */}
      {activeTab === 'applications' && (
        <div className="dashboard-content">
          <div className="applications-header">
            <h3>📝 My Applications</h3>
            <button onClick={fetchApplications} className="refresh-btn">🔄 Refresh</button>
          </div>

          <div className="applications-list">
            {applications.length === 0 ? (
              <div className="no-data">
                <p>No applications found.</p>
                <p>Start applying to jobs to see your applications here.</p>
              </div>
            ) : (
              applications.map((app) => (
                <div key={app._id} className="application-card">
                  <div className="app-header">
                    <div className="app-title">
                      <h4>{app.job.jobTitle}</h4>
                      <p>🏢 {app.job.company}</p>
                    </div>
                    <div className="app-meta">
                      <span 
                        className="status-badge" 
                        style={{ backgroundColor: getStatusColor(app.status) }}
                      >
                        {getStatusIcon(app.status)} {app.status.replace('_', ' ')}
                      </span>
                      <small>Applied: {new Date(app.applicationDate).toLocaleDateString()}</small>
                    </div>
                  </div>
                  
                  <div className="app-details">
                    <div className="detail-row">
                      <span className="label">Location:</span>
                      <span className="value">{app.job.location}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Salary:</span>
                      <span className="value">
                        {app.job.salary?.min || 'N/A'} - {app.job.salary?.max || 'N/A'} LPA
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Deadline:</span>
                      <span className="value">
                        {new Date(app.job.applicationDeadline).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {app.interview && (
                    <div className="interview-info">
                      <h5>🎤 Interview Details</h5>
                      <div className="interview-details">
                        <p><strong>Date:</strong> {new Date(app.interview.scheduledDate).toLocaleDateString()}</p>
                        <p><strong>Time:</strong> {app.interview.scheduledTime}</p>
                        <p><strong>Location:</strong> {app.interview.location}</p>
                        {app.interview.instructions && (
                          <p><strong>Instructions:</strong> {app.interview.instructions}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="app-actions">
                    <button 
                      className="feedback-btn"
                      onClick={() => setFeedback({ jobId: app.job._id, jobTitle: app.job.jobTitle })}
                    >
                      💬 Give Feedback
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Interviews Tab */}
      {activeTab === 'interviews' && (
        <div className="dashboard-content">
          <div className="interviews-header">
            <h3>🎤 Upcoming Interviews</h3>
            <button onClick={fetchInterviews} className="refresh-btn">🔄 Refresh</button>
          </div>

          <div className="interviews-list">
            {interviews.length === 0 ? (
              <div className="no-data">
                <p>No upcoming interviews.</p>
                <p>Interviews will appear here once scheduled.</p>
              </div>
            ) : (
              interviews.map((interview) => (
                <div key={interview._id} className="interview-card">
                  <div className="interview-header">
                    <div className="interview-title">
                      <h4>{interview.job.jobTitle}</h4>
                      <p>🏢 {interview.job.company}</p>
                    </div>
                    <div className="interview-status">
                      <span className="status-badge scheduled">
                        🎤 {interview.status}
                      </span>
                    </div>
                  </div>

                  <div className="interview-details">
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="label">📅 Date:</span>
                        <span className="value">{new Date(interview.scheduledDate).toLocaleDateString()}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">🕐 Time:</span>
                        <span className="value">{interview.scheduledTime}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">📍 Location:</span>
                        <span className="value">{interview.location}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">⏱️ Duration:</span>
                        <span className="value">{interview.duration} minutes</span>
                      </div>
                    </div>

                    {interview.interviewers && interview.interviewers.length > 0 && (
                      <div className="interviewers">
                        <h5>👥 Interviewers:</h5>
                        <ul>
                          {interview.interviewers.map((interviewer, index) => (
                            <li key={index}>
                              {interviewer.name} - {interviewer.designation}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {interview.instructions && (
                      <div className="instructions">
                        <h5>📋 Instructions:</h5>
                        <p>{interview.instructions}</p>
                      </div>
                    )}

                    {interview.meetingLink && (
                      <div className="meeting-link">
                        <h5>🔗 Meeting Link:</h5>
                        <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer">
                          Join Meeting
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="interview-actions">
                    <button 
                      className="feedback-btn"
                      onClick={() => setFeedback({ 
                        jobId: interview.job._id, 
                        jobTitle: interview.job.jobTitle,
                        interviewId: interview._id 
                      })}
                    >
                      💬 Interview Feedback
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Feedback Tab */}
      {activeTab === 'feedback' && (
        <div className="dashboard-content">
          <div className="feedback-header">
            <h3>💬 Feedback</h3>
            <p>Share your experience to help improve the placement process</p>
          </div>

          <div className="feedback-form">
            <h4>Submit Feedback</h4>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const feedbackData = {
                jobId: feedback.jobId,
                feedbackType: formData.get('feedbackType'),
                ratings: {
                  overallExperience: parseInt(formData.get('overallExperience')),
                  communication: parseInt(formData.get('communication')),
                  professionalism: parseInt(formData.get('professionalism')),
                  processEfficiency: parseInt(formData.get('processEfficiency'))
                },
                feedback: {
                  overallComments: formData.get('overallComments'),
                  wouldRecommend: formData.get('wouldRecommend') === 'on'
                }
              };
              submitFeedback(feedbackData);
            }}>
              <div className="form-group">
                <label>Job/Company:</label>
                <input type="text" value={feedback?.jobTitle || ''} readOnly />
              </div>

              <div className="form-group">
                <label>Feedback Type:</label>
                <select name="feedbackType" required>
                  <option value="">Select type</option>
                  <option value="application_process">Application Process</option>
                  <option value="interview_experience">Interview Experience</option>
                  <option value="company_experience">Company Experience</option>
                  <option value="placement_process">Placement Process</option>
                </select>
              </div>

              <div className="ratings-grid">
                <div className="rating-item">
                  <label>Overall Experience:</label>
                  <select name="overallExperience" required>
                    <option value="">Rate</option>
                    <option value="1">1 - Poor</option>
                    <option value="2">2 - Fair</option>
                    <option value="3">3 - Good</option>
                    <option value="4">4 - Very Good</option>
                    <option value="5">5 - Excellent</option>
                  </select>
                </div>

                <div className="rating-item">
                  <label>Communication:</label>
                  <select name="communication">
                    <option value="">Rate</option>
                    <option value="1">1 - Poor</option>
                    <option value="2">2 - Fair</option>
                    <option value="3">3 - Good</option>
                    <option value="4">4 - Very Good</option>
                    <option value="5">5 - Excellent</option>
                  </select>
                </div>

                <div className="rating-item">
                  <label>Professionalism:</label>
                  <select name="professionalism">
                    <option value="">Rate</option>
                    <option value="1">1 - Poor</option>
                    <option value="2">2 - Fair</option>
                    <option value="3">3 - Good</option>
                    <option value="4">4 - Very Good</option>
                    <option value="5">5 - Excellent</option>
                  </select>
                </div>

                <div className="rating-item">
                  <label>Process Efficiency:</label>
                  <select name="processEfficiency">
                    <option value="">Rate</option>
                    <option value="1">1 - Poor</option>
                    <option value="2">2 - Fair</option>
                    <option value="3">3 - Good</option>
                    <option value="4">4 - Very Good</option>
                    <option value="5">5 - Excellent</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Overall Comments:</label>
                <textarea 
                  name="overallComments" 
                  rows="4" 
                  placeholder="Share your overall experience and suggestions..."
                ></textarea>
              </div>

              <div className="form-group">
                <label>
                  <input type="checkbox" name="wouldRecommend" />
                  Would you recommend this company/process to other students?
                </label>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setFeedback(null)}>Cancel</button>
                <button type="submit">Submit Feedback</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;

