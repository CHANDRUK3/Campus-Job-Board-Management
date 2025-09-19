import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';
import '../style.css';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'student'
  });
  const [message, setMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setFieldErrors({});

    // Client-side validation
    const errors = {};
    if (!formData.name || formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    const emailRegex = /[^@\s]+@[^@\s]+\.[^@\s]+/;
    if (!emailRegex.test(formData.email)) {
      errors.email = 'Please provide a valid email address';
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(formData.password)) {
      errors.password = 'Min 6 chars with uppercase, lowercase, and number';
    }
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setMessage('Please fix the highlighted errors.');
      return;
    }

    try {
      const response = await authAPI.register(formData);
      alert(response.message);
      console.log(`Welcome ${response.user.name} (${response.user.role})`);
      navigate('/');
    } catch (err) {
      // Surface backend field-level validation errors if available
      if (err.data && Array.isArray(err.data.errors)) {
        const serverErrors = {};
        err.data.errors.forEach(e => {
          if (e.field) serverErrors[e.field] = e.message;
        });
        setFieldErrors(serverErrors);
      }
      setMessage(err.message || 'Registration failed');
    }
  };

  return (
    <div className="form-container">
      <h2>📝 Signup</h2>
      <form className="form" onSubmit={handleSubmit}>
        <label>Name:</label>
        <input type="text" name="name" onChange={handleChange} required aria-invalid={!!fieldErrors.name} />
        {fieldErrors.name && <small className="field-error">{fieldErrors.name}</small>}

        <label>Email:</label>
        <input type="email" name="email" onChange={handleChange} required aria-invalid={!!fieldErrors.email} />
        {fieldErrors.email && <small className="field-error">{fieldErrors.email}</small>}

        <label>Password:</label>
        <input 
          type="password" 
          name="password" 
          onChange={handleChange} 
          required 
          minLength="6"
          placeholder="Minimum 6 characters with uppercase, lowercase, and number"
        />
        {fieldErrors.password && <small className="field-error">{fieldErrors.password}</small>}

        <label>Role:</label>
        <select name="role" onChange={handleChange}>
          <option value="student">Student</option>
          <option value="admin">Admin</option>
        </select>

        <button type="submit">Register</button>
      </form>
      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default Register;
