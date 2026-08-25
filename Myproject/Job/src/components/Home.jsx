import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { getUser, authAPI } from '../utils/api';
import '../style.css';

const initialCoordinators = [
  { dept: 'CSE', name: 'Mr. Karthik', phone: '9876543210', cabin: 'C-101' },
  { dept: 'ECE', name: 'Ms. Priya', phone: '9876500001', cabin: 'E-202' },
  { dept: 'EEE', name: 'Mr. Arjun', phone: '9876512345', cabin: 'EE-303' },
  { dept: 'MECH', name: 'Mr. Ravi', phone: '9876567890', cabin: 'M-404' },
  { dept: 'MBA', name: 'Dr. Sneha', phone: '9876598765', cabin: 'B-505' },
  { dept: 'AIML & AIDS', name: 'Dr. Krishna', phone: '9876597654', cabin: 'A-206' },
];
const Home = () => {
  const [user, setUser] = useState(null);
  const [coordinators, setCoordinators] = useState(initialCoordinators);
    const [coordForm, setCoordForm] = useState({ dept: '', name: '', phone: '', cabin: '' });
  const [showCoordForm, setShowCoordForm] = useState(false); // 🔄 Toggle for Coordinator Form

  // Initialize user on component mount
  React.useEffect(() => {
    const currentUser = getUser();
    if (currentUser) setUser(currentUser);
  }, []);

  const handleCoordChange = (e) => {
    setCoordForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCoordSubmit = (e) => {
    e.preventDefault();
    setCoordinators(prev => [...prev, coordForm]);
    setCoordForm({ dept: '', name: '', phone: '', cabin: '' });
    alert('Coordinator added!');
  };


  const handleLogout = async () => {
    try {
      await authAPI.logout();
      setUser(null);
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local data even if API call fails
      setUser(null);
      window.location.href = '/login';
    }
  };

  return (
    <div className="homepage">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-title">🎓 Campus Job Board</div>
        <ul className="navbar-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/jobs">Jobs</Link></li>
          {user && user.role === 'student' && (
            <li><Link to="/profile">My Profile</Link></li>
          )}
          {user ? (
            <li>
              <button onClick={handleLogout} className="logout-btn">
                Logout ({user.name})
              </button>
            </li>
          ) : (
            <>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/signup">Signup</Link></li>
            </>
          )}
        </ul>
      </nav>

      <section className="placement-heading">
        <h2>📌 Placements</h2>
        {user && <p className="greeting">👋 Welcome, <strong>{user.name}</strong>!</p>}
        <h3>👨‍💼 Department-wise Placement Coordinators</h3>
      </section>

      <section className="coordinator-cards-container">
        {coordinators.map((coordinator, index) => (
          <div className="coordinator-card" key={index}>
            <h4>{coordinator.dept}</h4>
            <p><strong>Coordinator:</strong> {coordinator.name}</p>
            <p><strong>Phone:</strong> {coordinator.phone}</p>
            <p><strong>Cabin:</strong> {coordinator.cabin}</p>
          </div>
        ))}
      </section>

      {user?.role === 'admin' && (
        <div style={{ textAlign: 'right', marginTop: '20px', paddingRight: '20px' }}>
          <button
            className="add-job-btn"
            onClick={() => setShowCoordForm(!showCoordForm)}
          >
            {showCoordForm ? '⬅ Close Coordinator Form' : '➕ Add Coordinator'}
          </button>
        </div>
      )}

      {user?.role === 'admin' && showCoordForm && (
        <section id="coordinator-form" className="admin-panel form-container">
          <h2>➕ Add Placement Coordinator</h2>
          <form className="form" onSubmit={handleCoordSubmit}>
            <label>Department:</label>
            <input name="dept" value={coordForm.dept} onChange={handleCoordChange} required />
            <label>Name:</label>
            <input name="name" value={coordForm.name} onChange={handleCoordChange} required />
            <label>Phone:</label>
            <input name="phone" value={coordForm.phone} onChange={handleCoordChange} required />
            <label>Cabin:</label>
            <input name="cabin" value={coordForm.cabin} onChange={handleCoordChange} required />
            <button type="submit">Add Coordinator</button>
          </form>
        </section>
      )}

      <section className="cta-section">
        <h3>🔍 Looking for Job Opportunities?</h3>
        <p>Browse through our latest job postings and find your perfect match!</p>
        <Link to="/jobs" className="cta-button">
          View All Jobs →
        </Link>
      </section>

      <footer className="footer">
        <p>&copy; 2025 Campus Job Board. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;
