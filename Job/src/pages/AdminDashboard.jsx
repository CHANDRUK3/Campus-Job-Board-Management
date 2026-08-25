import React, { useEffect, useState } from 'react';
import '../style.css';

function AdminDashboard({ user }) {
  const [companies, setCompanies] = useState([]);
  const [optCounts, setOptCounts] = useState({});
  const [details, setDetails] = useState({});
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/companies')
      .then(res => res.json())
      .then(data => setCompanies(data))
      .catch(err => {
        console.error('Error fetching companies:', err);
      });
  }, []);

  useEffect(() => {
    companies.forEach(company => {
      fetch(`http://localhost:5000/api/optstatus/job/${company._id}`)
        .then(res => res.json())
        .then(data => {
          const count = data.filter(s => s.status === 'opt-in').length;
          setOptCounts(prev => ({ ...prev, [company._id]: count }));
        });
    });
  }, [companies]);

  const viewDetails = (jobId) => {
    fetch(`http://localhost:5000/api/optstatus/job/${jobId}`)
      .then(res => res.json())
      .then(data => {
        const optedIn = data.filter(s => s.status === 'opt-in');
        setDetails(prev => ({ ...prev, [jobId]: optedIn }));
      });
  };

  // Fetch user data by email from backend (requires a backend endpoint)
  const getUserData = async (studentEmail) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/api/users/email/${studentEmail}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('User not found');
    return await res.json();
  };

  const viewStudentProfile = async (userId) => {
    try {
      const profileRes = await fetch(`http://localhost:5000/api/profile/${userId}`);
      if (!profileRes.ok) throw new Error('Failed to fetch student profile');
      const profile = await profileRes.json();
      setSelectedStudent(profile);
    } catch (error) {
      console.error('Error fetching student profile:', error);
      setSelectedStudent(null);
    }
  };

  return (
    <div className="dashboard-container">
      <h2>Admin Dashboard - Jobs Posted</h2>
      {companies.length === 0 ? (
        <p>No companies found</p>
      ) : (
        <ul>
          {companies.map(company => (
            <li key={company._id} className="company-card">
              <h3>{company.company}</h3>
              <p><strong>Skills:</strong> {company.skills}</p>
              <p><strong>LPA:</strong> {company.lpa}</p>
              <p><strong>Members Required:</strong> {company.members}</p>
              <p><strong>Number of Opt-ins:</strong> {optCounts[company._id] || 0}</p>
              <button onClick={() => viewDetails(company._id)}>View Details</button>
              {details[company._id] && (
                <div className="opt-in-list">
                  <h4>Opted-in Students:</h4>
                  <ul>
                    {details[company._id].map(s => (
                      <li key={s._id}>
                        {s.studentEmail}
                        <button onClick={async () => {
                          const userData = await getUserData(s.studentEmail);
                          viewStudentProfile(userData._id);
                        }}>View Profile</button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Profile Detail View */}
      {selectedStudent && (
        <div className="profile-modal">
          <div className="profile-modal-content">
            <span className="close-btn" onClick={() => setSelectedStudent(null)}>&times;</span>
            <h3>Student Profile</h3>
            <p><strong>Name:</strong> {selectedStudent.user.name}</p>
            <p><strong>Email:</strong> {selectedStudent.user.email}</p>
            <p><strong>Academic History:</strong> {selectedStudent.academicHistory || 'N/A'}</p>
            <p>
              <strong>Resume:</strong>
              {selectedStudent.resumePath ? (
                <a href={`http://localhost:5000${selectedStudent.resumePath}`} target="_blank" rel="noopener noreferrer">View Resume</a>
              ) : 'N/A'}
            </p>
            <p>
              <strong>Portfolio:</strong>
              {selectedStudent.portfolioUrl ? (
                <a href={selectedStudent.portfolioUrl} target="_blank" rel="noopener noreferrer">View Portfolio</a>
              ) : 'N/A'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
