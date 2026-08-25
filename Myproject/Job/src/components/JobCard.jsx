import React, { useState } from 'react';
import '../style.css';

const JobCard = ({ job, user, onOptIn, onOptOut, optedJobs = [], onApply }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isOptedIn = optedJobs.includes(job._id);
  // Compute daysUntilDeadline on client if not provided by API (e.g., when using lean())
  const computeDaysUntil = () => {
    if (!job.applicationDeadline) return 0;
    const now = new Date();
    const deadline = new Date(job.applicationDeadline);
    const diffTime = deadline - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  const daysUntilDeadline = typeof job.daysUntilDeadline === 'number' ? job.daysUntilDeadline : computeDaysUntil();
  const isAcceptingApplications = job.status === 'active' && new Date(job.applicationDeadline) > new Date();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDeadlineStatus = () => {
    if (daysUntilDeadline <= 0) return { text: 'Deadline passed', class: 'deadline-passed' };
    if (daysUntilDeadline <= 3) return { text: `${daysUntilDeadline} days left`, class: 'deadline-urgent' };
    if (daysUntilDeadline <= 7) return { text: `${daysUntilDeadline} days left`, class: 'deadline-warning' };
    return { text: `${daysUntilDeadline} days left`, class: 'deadline-normal' };
  };

  const deadlineStatus = getDeadlineStatus();

  return (
    <div className={`job-card ${!isAcceptingApplications ? 'job-closed' : ''}`}>
      <div className="job-card-header">
        <div className="job-title-section">
          <h3 className="job-title">{job.jobTitle || job.company}</h3>
          <p className="company-name">🏢 {job.company}</p>
        </div>
        
        <div className="job-meta">
          <div className="salary-info">
            💰 {job.formattedSalary || `${job.salary?.min || 0} - ${job.salary?.max || 0} LPA`}
          </div>
          <div className="location-info">
            📍 {job.location}
          </div>
        </div>
      </div>

      <div className="job-card-body">
        <div className="job-details">
          <div className="job-detail-row">
            <span className="detail-label">Job Type:</span>
            <span className="detail-value">{job.jobType || 'Full-time'}</span>
          </div>
          
          <div className="job-detail-row">
            <span className="detail-label">Experience:</span>
            <span className="detail-value">{job.experienceLevel || 'Fresher'}</span>
          </div>
          
          <div className="job-detail-row">
            <span className="detail-label">Positions:</span>
            <span className="detail-value">{job.members}</span>
          </div>
          
          <div className="job-detail-row">
            <span className="detail-label">Deadline:</span>
            <span className={`detail-value ${deadlineStatus.class}`}>
              {formatDate(job.applicationDeadline)} ({deadlineStatus.text})
            </span>
          </div>
        </div>

        <div className="skills-section">
          <span className="skills-label">Skills:</span>
          <div className="skills-tags">
            {(Array.isArray(job.skills) ? job.skills : [job.skills]).slice(0, 5).map((skill, index) => (
              <span key={index} className="skill-tag">
                {skill}
              </span>
            ))}
            {job.skills && job.skills.length > 5 && (
              <span className="skill-tag more-skills">
                +{job.skills.length - 5} more
              </span>
            )}
          </div>
        </div>

        {job.description && (
          <div className="description-section">
            <p className="job-description">
              {isExpanded ? job.description : `${job.description.substring(0, 150)}...`}
            </p>
            {job.description.length > 150 && (
              <button 
                className="expand-btn"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        )}

        {isExpanded && (
          <div className="expanded-details">
            {job.requirements && job.requirements.length > 0 && (
              <div className="requirements-section">
                <h4>Requirements:</h4>
                <ul>
                  {job.requirements.map((req, index) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>
            )}

            {job.benefits && job.benefits.length > 0 && (
              <div className="benefits-section">
                <h4>Benefits:</h4>
                <ul>
                  {job.benefits.map((benefit, index) => (
                    <li key={index}>{benefit}</li>
                  ))}
                </ul>
              </div>
            )}

            {job.contactEmail && (
              <div className="contact-section">
                <h4>Contact:</h4>
                <p>📧 {job.contactEmail}</p>
              </div>
            )}

            {job.website && (
              <div className="website-section">
                <h4>Website:</h4>
                <a href={job.website} target="_blank" rel="noopener noreferrer">
                  {job.website}
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="job-card-footer">
        <div className="job-actions">
          {user?.role !== 'admin' && isAcceptingApplications && (
            <>
              <button
                className={`opt-btn ${isOptedIn ? 'opt-out' : 'opt-in'}`}
                onClick={() => isOptedIn ? onOptOut(job) : onOptIn(job)}
              >
                {isOptedIn ? 'Opt-Out' : 'Opt-In'}
              </button>
              
              <button
                className="apply-btn"
                onClick={() => onApply && onApply(job._id)}
              >
                📝 Apply Now
              </button>
            </>
          )}
          
          {!isAcceptingApplications && (
            <span className="application-closed">
              Applications Closed
            </span>
          )}
        </div>
        
        <div className="job-stats">
          <span className="posted-date">
            Posted {formatDate(job.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default JobCard;
