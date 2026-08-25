import React, { useEffect, useState } from 'react';
import { getUser, optStatusAPI } from '../utils/api';
import '../style.css';

const EnhancedAdminDashboard = ({ user }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [bulkEmail, setBulkEmail] = useState({ subject: '', message: '' });
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [showBulkEmail, setShowBulkEmail] = useState(false);
  const [optInOutData, setOptInOutData] = useState([]);
  const [loadingOptData, setLoadingOptData] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/admin/analytics/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkEmail = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/admin/bulk/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(bulkEmail)
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Email sent to ${result.recipientsCount} students successfully!`);
        setBulkEmail({ subject: '', message: '' });
        setShowBulkEmail(false);
      }
    } catch (error) {
      console.error('Failed to send bulk email:', error);
      alert('Failed to send bulk email');
    }
  };

  const handleBulkJobUpdate = async (status) => {
    if (selectedJobs.length === 0) {
      alert('Please select jobs to update');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/admin/bulk/update-job-status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ jobIds: selectedJobs, status })
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        setSelectedJobs([]);
        fetchAnalytics();
      }
    } catch (error) {
      console.error('Failed to update jobs:', error);
      alert('Failed to update jobs');
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/bulk/template', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'job_import_template.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to download template:', error);
      alert('Failed to download template');
    }
  };

  const fetchOptInOutData = async () => {
    try {
      setLoadingOptData(true);
      const response = await fetch('http://localhost:5000/api/optstatus/export/excel', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        // For now, we'll just trigger the download
        // In a real app, you might want to fetch the data first to display it
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `opt_in_out_data_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        alert('Opt-in/Opt-out data exported successfully!');
      } else {
        alert('Failed to export opt-in/opt-out data');
      }
    } catch (error) {
      console.error('Failed to export opt-in/opt-out data:', error);
      alert('Failed to export opt-in/opt-out data');
    } finally {
      setLoadingOptData(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (!analytics) {
    return <div className="error">Failed to load analytics</div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h2>📊 Admin Dashboard</h2>
        <div className="dashboard-actions">
          <button onClick={() => setShowBulkEmail(!showBulkEmail)} className="action-btn">
            📧 Bulk Email
          </button>
          <button onClick={downloadTemplate} className="action-btn">
            📥 Download Template
          </button>
          <button 
            onClick={fetchOptInOutData} 
            className="action-btn"
            disabled={loadingOptData}
          >
            {loadingOptData ? '⏳ Exporting...' : '📊 Export Opt-in/Opt-out Data'}
          </button>
          <button onClick={fetchAnalytics} className="action-btn">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Bulk Email Modal */}
      {showBulkEmail && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>📧 Send Bulk Email</h3>
              <button onClick={() => setShowBulkEmail(false)} className="close-btn">×</button>
            </div>
            <form onSubmit={handleBulkEmail} className="bulk-email-form">
              <input
                type="text"
                placeholder="Email Subject"
                value={bulkEmail.subject}
                onChange={(e) => setBulkEmail({ ...bulkEmail, subject: e.target.value })}
                required
              />
              <textarea
                placeholder="Email Message"
                value={bulkEmail.message}
                onChange={(e) => setBulkEmail({ ...bulkEmail, message: e.target.value })}
                rows="6"
                required
              />
              <div className="modal-actions">
                <button type="button" onClick={() => setShowBulkEmail(false)}>Cancel</button>
                <button type="submit">Send Email</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="dashboard-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📈 Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'jobs' ? 'active' : ''}`}
          onClick={() => setActiveTab('jobs')}
        >
          💼 Jobs
        </button>
        <button 
          className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          👥 Students
        </button>
        <button 
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📊 Analytics
        </button>
        <button 
          className={`tab-btn ${activeTab === 'optdata' ? 'active' : ''}`}
          onClick={() => setActiveTab('optdata')}
        >
          📋 Opt-in/Opt-out Data
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="dashboard-content">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">💼</div>
              <div className="stat-info">
                <h3>{analytics.jobStats.total}</h3>
                <p>Total Jobs</p>
                <small>{analytics.jobStats.active} Active</small>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📋</div>
              <div className="stat-info">
                <h3>{analytics.applicationStats.total}</h3>
                <p>Total Applications</p>
                <small>{analytics.applicationStats.conversionRate}% Opt-in Rate</small>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <h3>{analytics.studentStats.total}</h3>
                <p>Total Students</p>
                <small>{analytics.studentStats.withApplications} With Applications</small>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🏢</div>
              <div className="stat-info">
                <h3>{analytics.topCompanies.length}</h3>
                <p>Active Companies</p>
                <small>Top Performers</small>
              </div>
            </div>
          </div>

          <div className="charts-grid">
            <div className="chart-card">
              <h3>📈 Job Posting Trends</h3>
              <div className="simple-chart">
                {analytics.jobStats.jobsByMonth.map((item, index) => (
                  <div key={index} className="chart-bar">
                    <div 
                      className="bar" 
                      style={{ height: `${(item.count / Math.max(...analytics.jobStats.jobsByMonth.map(i => i.count))) * 100}%` }}
                    ></div>
                    <span className="bar-label">{item.month.split('-')[1]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="chart-card">
              <h3>📊 Application Trends</h3>
              <div className="simple-chart">
                {analytics.applicationStats.applicationsByMonth.map((item, index) => (
                  <div key={index} className="chart-bar">
                    <div 
                      className="bar" 
                      style={{ height: `${(item.total / Math.max(...analytics.applicationStats.applicationsByMonth.map(i => i.total))) * 100}%` }}
                    ></div>
                    <span className="bar-label">{item.month.split('-')[1]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Jobs Tab */}
      {activeTab === 'jobs' && (
        <div className="dashboard-content">
          <div className="jobs-actions">
            <div className="bulk-actions">
              <span>Bulk Actions:</span>
              <button onClick={() => handleBulkJobUpdate('active')} className="bulk-btn">
                ✅ Activate Selected
              </button>
              <button onClick={() => handleBulkJobUpdate('closed')} className="bulk-btn">
                ❌ Close Selected
              </button>
            </div>
          </div>

          <div className="jobs-list">
            {analytics.recentActivity.recentJobs.map((job) => (
              <div key={job._id} className="job-item">
                <input
                  type="checkbox"
                  checked={selectedJobs.includes(job._id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedJobs([...selectedJobs, job._id]);
                    } else {
                      setSelectedJobs(selectedJobs.filter(id => id !== job._id));
                    }
                  }}
                />
                <div className="job-info">
                  <h4>{job.jobTitle}</h4>
                  <p>🏢 {job.company}</p>
                  <small>Posted: {new Date(job.createdAt).toLocaleDateString()}</small>
                </div>
                <div className="job-status">
                  <span className={`status-badge ${job.status}`}>{job.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Students Tab */}
      {activeTab === 'students' && (
        <div className="dashboard-content">
          <div className="students-stats">
            <div className="stat-item">
              <h4>Most Active Students</h4>
              <div className="student-list">
                {analytics.studentStats.mostActive.map((student, index) => (
                  <div key={index} className="student-item">
                    <div className="student-info">
                      <strong>{student.name}</strong>
                      <small>{student.email}</small>
                    </div>
                    <div className="student-stats">
                      <span>{student.totalApplications} Applications</span>
                      <span>{student.optInCount} Opt-ins</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="dashboard-content">
          <div className="analytics-grid">
            <div className="analytics-card">
              <h3>🏆 Top Performing Companies</h3>
              <div className="company-list">
                {analytics.topCompanies.map((company, index) => (
                  <div key={index} className="company-item">
                    <div className="company-info">
                      <strong>{company.company}</strong>
                      <small>{company.jobCount} Jobs</small>
                    </div>
                    <div className="company-stats">
                      <span>{company.optInCount} Applications</span>
                      <span>{company.conversionRate.toFixed(1)}% Rate</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="analytics-card">
              <h3>📈 Top Jobs by Applications</h3>
              <div className="job-list">
                {analytics.applicationStats.topJobs.map((job, index) => (
                  <div key={index} className="job-item">
                    <div className="job-info">
                      <strong>{job.jobTitle}</strong>
                      <small>🏢 {job.company}</small>
                    </div>
                    <div className="job-stats">
                      <span>{job.optInCount} Applications</span>
                      <span>{job.conversionRate.toFixed(1)}% Rate</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Opt-in/Opt-out Data Tab */}
      {activeTab === 'optdata' && (
        <div className="dashboard-content">
          <div className="opt-data-header">
            <h3>📋 Student Opt-in/Opt-out Data</h3>
            <div className="opt-data-actions">
              <button 
                onClick={fetchOptInOutData} 
                className="export-btn"
                disabled={loadingOptData}
              >
                {loadingOptData ? '⏳ Exporting...' : '📊 Export to Excel'}
              </button>
            </div>
          </div>
          
          <div className="opt-data-info">
            <div className="info-card">
              <h4>📈 Data Overview</h4>
              <p>This section allows you to view and export all student opt-in/opt-out data for jobs.</p>
              <ul>
                <li>✅ <strong>Opt-in:</strong> Students who have expressed interest in a job</li>
                <li>❌ <strong>Opt-out:</strong> Students who have declined interest in a job</li>
                <li>📊 <strong>Export:</strong> Download complete data as Excel file with all details</li>
              </ul>
            </div>
            
            <div className="info-card">
              <h4>📋 Export Details</h4>
              <p>The Excel export will include:</p>
              <ul>
                <li>Student email and name</li>
                <li>Company and job title</li>
                <li>Job location and salary range</li>
                <li>Job type and experience level</li>
                <li>Opt-in/Opt-out status</li>
                <li>Timestamp of the action</li>
                <li>Application deadline</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedAdminDashboard;
