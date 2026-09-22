import React, { useState } from 'react';
import '../style.css';

const ApplicationTimeline = ({ application, onBack, onAcceptOffer, onDeclineOffer }) => {
  const [loading, setLoading] = useState(false);
  const stages = [
    { key: 'applied', label: 'Applied', desc: 'Application received' },
    { key: 'verified', label: 'Verified', desc: 'Profile approved by Cell' },
    { key: 'test_scheduled', label: 'Test Scheduled', desc: 'Aptitude/Coding round scheduled' },
    { key: 'test_completed', label: 'Test Completed', desc: 'Test responses submitted' },
    { key: 'shortlisted', label: 'Shortlisted', desc: 'Cleared initial rounds' },
    { key: 'technical_interview', label: 'Tech Interview', desc: 'Coding & technical rounds' },
    { key: 'hr_interview', label: 'HR Interview', desc: 'Cultural and fit discussion' },
    { key: 'final_shortlist', label: 'Final Shortlist', desc: 'Awaiting final selection list' },
    { key: 'selected', label: 'Selected', desc: 'Offer extended!' },
    { key: 'closed', label: 'Closed', desc: 'Drive process completed' }
  ];

  // Helper to determine stage indices
  const getStageIndex = (stageKey) => {
    return stages.findIndex(s => s.key === stageKey);
  };

  const currentStageIndex = getStageIndex(application.status);

  // Status badge colors
  const getStageStatus = (index) => {
    if (application.status === 'closed' && application.outcome?.result === 'not_selected' && index >= currentStageIndex) {
      return 'failed';
    }
    if (index < currentStageIndex) return 'completed';
    if (index === currentStageIndex) return 'active';
    return 'upcoming';
  };

  // Mapped skills recommendations in case of rejection
  const getSkillRecommendations = (skills = []) => {
    const defaultRecs = {
      'react': [
        { title: 'Frontend Developer Path', provider: 'Scrimba', link: '#' },
        { title: 'React Hooks & State Design Patterns', provider: 'Frontend Masters', link: '#' }
      ],
      'node.js': [
        { title: 'Backend Development Masterclass', provider: 'Node.js Foundation', link: '#' },
        { title: 'Designing High-Throughput REST APIs', provider: 'Pluralsight', link: '#' }
      ],
      'javascript': [
        { title: 'JavaScript (ES6+) Deep Dive', provider: 'MDN Web Docs', link: '#' },
        { title: 'Advanced JavaScript Concepts', provider: 'Udemy', link: '#' }
      ],
      'python': [
        { title: 'Python Algorithms & Data Structures', provider: 'Coursera', link: '#' },
        { title: 'Data Analysis Bootcamp', provider: 'Kaggle', link: '#' }
      ],
      'sql': [
        { title: 'Complete SQL Database Mastery', provider: 'DataCamp', link: '#' }
      ]
    };

    const recs = [];
    skills.forEach(skill => {
      const match = defaultRecs[skill.toLowerCase().trim()];
      if (match) recs.push(...match);
    });

    if (recs.length === 0) {
      recs.push(
        { title: 'System Design Interview Prep', provider: 'Educative.io', link: '#' },
        { title: 'Leetcode DS & Algorithms Crash Course', provider: 'LeetCode', link: '#' }
      );
    }
    return recs;
  };

  return (
    <div className="timeline-container" style={{
      background: 'rgba(15, 23, 42, 0.45)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '16px',
      padding: '24px',
      color: '#f8fafc',
      marginTop: '20px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <button onClick={onBack} className="tab-btn" style={{ padding: '8px 16px', background: '#334155', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          ← Back to Applications
        </button>
        <h3 style={{ fontSize: '20px', fontWeight: '800' }}>
          Application Status: <span style={{ color: application.status === 'selected' ? '#10b981' : '#38bdf8' }}>{application.status.replace('_', ' ').toUpperCase()}</span>
        </h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
        
        {/* Stepper Timeline List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#818cf8', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
            Recruitment Process Timeline
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', paddingLeft: '16px', borderLeft: '2px solid rgba(255, 255, 255, 0.1)' }}>
            {stages.map((stage, idx) => {
              const state = getStageStatus(idx);
              let icon = '⚪';
              let color = '#64748b';
              let borderStyle = 'solid';
              
              if (state === 'completed') {
                icon = '✓';
                color = '#10b981';
              } else if (state === 'active') {
                icon = '▶';
                color = '#38bdf8';
              } else if (state === 'failed') {
                icon = '❌';
                color = '#ef4444';
              }

              return (
                <div key={stage.key} style={{
                  position: 'relative',
                  marginBottom: '20px',
                  opacity: state === 'upcoming' ? 0.5 : 1
                }}>
                  {/* Step bullet */}
                  <span style={{
                    position: 'absolute',
                    left: '-26px',
                    top: '2px',
                    background: state === 'completed' ? '#10b981' : (state === 'active' ? '#0284c7' : (state === 'failed' ? '#ef4444' : '#1e293b')),
                    color: 'white',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: '700',
                    border: `2px solid ${color}`
                  }}>
                    {icon}
                  </span>

                  <h5 style={{ fontSize: '14px', fontWeight: '600', color: state === 'active' ? '#38bdf8' : '#f8fafc', margin: 0 }}>
                    {stage.label}
                  </h5>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0' }}>
                    {stage.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Process Detail Panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Active Round Details */}
          {application.status === 'test_scheduled' || application.status === 'technical_interview' || application.status === 'hr_interview' ? (
            <div style={{
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: '12px',
              padding: '20px'
            }}>
              <h4 style={{ color: '#38bdf8', fontWeight: '700', marginBottom: '12px', fontSize: '16px' }}>
                📅 Scheduled Round Information
              </h4>
              <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
                <p><strong>Date:</strong> {application.testInterviewDetails?.date ? new Date(application.testInterviewDetails.date).toLocaleDateString() : 'TBD'}</p>
                <p><strong>Time:</strong> {application.testInterviewDetails?.time || 'TBD'}</p>
                <p><strong>Venue:</strong> {application.testInterviewDetails?.venue || 'TBD'}</p>
                {application.testInterviewDetails?.meetingLink && (
                  <p>
                    <strong>Meeting Link: </strong> 
                    <a href={application.testInterviewDetails.meetingLink} target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline' }}>
                      Join Online Interview
                    </a>
                  </p>
                )}
                {application.testInterviewDetails?.instructions && (
                  <div style={{ marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                    <p><strong>Instructions:</strong></p>
                    <p style={{ color: '#cbd5e1', fontSize: '13px', marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                      {application.testInterviewDetails.instructions}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Outcome Selection Panels */}
          {application.status === 'selected' ? (
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>🎉</span>
              <h4 style={{ color: '#10b981', fontWeight: '800', fontSize: '20px', marginBottom: '8px' }}>
                Congratulations! You are Selected!
              </h4>
              <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
                An official offer has been extended by the recruitment cell. Review details below.
              </p>

              <div style={{
                background: 'rgba(30, 41, 59, 0.6)',
                borderRadius: '8px',
                padding: '16px',
                textAlign: 'left',
                fontSize: '14px',
                marginBottom: '20px',
                lineHeight: '1.8'
              }}>
                <p><strong>Position:</strong> {application.drive?.jobTitle}</p>
                <p><strong>Compensation Package:</strong> {application.outcome?.offerDetails?.ctc || application.drive?.salary?.max || 6} LPA</p>
                <p><strong>Tentative Joining Date:</strong> {application.outcome?.offerDetails?.joiningDate ? new Date(application.outcome.offerDetails.joiningDate).toLocaleDateString() : 'TBD'}</p>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button 
                  onClick={() => onAcceptOffer(application._id)}
                  style={{ padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Accept Offer
                </button>
                <button 
                  onClick={() => onDeclineOffer(application._id)}
                  style={{ padding: '10px 20px', background: '#334155', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Decline Offer
                </button>
              </div>
            </div>
          ) : null}

          {/* Not Selected / Feedback Gaps */}
          {application.status === 'closed' && application.outcome?.result === 'not_selected' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '12px',
                padding: '20px'
              }}>
                <h4 style={{ color: '#ef4444', fontWeight: '700', marginBottom: '8px', fontSize: '16px' }}>
                  Application Closed
                </h4>
                <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6' }}>
                  Thank you for participating in this drive. Although you weren't selected this time, recruitment rounds provide valuable experience.
                </p>
                {application.outcome?.feedback && (
                  <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                    <p style={{ fontSize: '13px', color: '#cbd5e1' }}>
                      <strong>Interviewer Feedback:</strong> "{application.outcome.feedback}"
                    </p>
                  </div>
                )}
              </div>

              {/* Study Recommendations */}
              <div style={{
                background: 'rgba(129, 140, 248, 0.08)',
                border: '1px solid rgba(129, 140, 248, 0.2)',
                borderRadius: '12px',
                padding: '20px'
              }}>
                <h4 style={{ color: '#818cf8', fontWeight: '700', marginBottom: '12px', fontSize: '15px' }}>
                  💡 Suggested Prep & Improvement Resources
                </h4>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }}>
                  Based on the drive skills profile ({application.drive?.skills?.join(', ') || 'General'}), we recommend brushing up on these courses:
                </p>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {getSkillRecommendations(application.drive?.skills).map((course, i) => (
                    <div key={i} style={{
                      background: 'rgba(30,41,59,0.4)',
                      borderRadius: '6px',
                      padding: '10px 14px',
                      fontSize: '13px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <strong style={{ display: 'block', color: '#cbd5e1' }}>{course.title}</strong>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>{course.provider}</span>
                      </div>
                      <a href={course.link} onClick={(e) => { e.preventDefault(); alert('Redirecting to partner course catalog...'); }} style={{ fontSize: '12px', color: '#38bdf8', textDecoration: 'none', fontWeight: '600' }}>
                        Start Prep →
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

        </div>
      </div>
    </div>
  );
};

export default ApplicationTimeline;
