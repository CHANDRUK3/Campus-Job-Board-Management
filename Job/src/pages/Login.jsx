import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';
import '../style.css';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      await authAPI.login(formData);
      setMessage('Login successful!');
      setLoading(false);
      setTimeout(() => navigate('/'), 1000);
    } catch (err) {
      setLoading(false);
      let msg = (err && err.data && err.data.message) ? err.data.message : (err.message || 'Login failed');
      setMessage(msg);

      // If user not found, suggest registration
      if (msg.includes('Invalid email or password')) {
        setTimeout(() => {
          if (window.confirm('User not found. Would you like to register instead?')) {
            navigate('/signup');
          }
        }, 2000);
      }
    }
  };

  return (
    <div className="form-container">
      <h2>🔐 Login</h2>
      <form className="form" onSubmit={handleSubmit}>
        <label>Email:</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <label>Password:</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
      </form>
      {message && <p className={`message ${message.includes('success') ? 'success' : 'error'}`}>{message}</p>}
    </div>
  );
};

export default Login;
