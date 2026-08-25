import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Jobs from './pages/jobs';
import ProfileSetup from './pages/ProfileSetup';
import ProtectedRoute from './components/protectedRoute';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Register />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/profile-setup" element={
            <ProtectedRoute allowUnverified={true}>
              <ProfileSetup />
            </ProtectedRoute>
          } />

          <Route path="/jobs" element={
            <ProtectedRoute>
              <Jobs />
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfileSetup /> {/* Map profile to setup/view which handles verification too */}
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;