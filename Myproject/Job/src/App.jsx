import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './components/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Jobs from './pages/jobs';
import StudentProfile from './pages/StudentProfile'; // Import the new component
import StudentDashboard from './components/StudentDashboard';
import './style.css'; // Import the new stylesheet here

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Register />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/profile" element={<StudentProfile />} /> {/* New route for the profile page */}
        <Route path="/dashboard" element={<StudentDashboard user={null} />} /> {/* Student dashboard route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;