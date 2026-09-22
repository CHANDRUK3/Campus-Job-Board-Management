import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../utils/api';
import PublicLayout from '../components/ui/Layout/PublicLayout';
import { UserPlus, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import '../style.css';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '', role: 'student'
  });
  const [message, setMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (fieldErrors[e.target.name]) {
      setFieldErrors(prev => ({ ...prev, [e.target.name]: null }));
    }
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
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setMessage('Please fix the highlighted errors before submitting.');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });
      setLoading(false);
      console.log(`Welcome ${response.user.name} (${response.user.role})`);
      if (response.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/profile-setup');
      }
    } catch (err) {
      setLoading(false);
      if (err.data && Array.isArray(err.data.errors)) {
        const serverErrors = {};
        err.data.errors.forEach(e => {
          if (e.field) serverErrors[e.field] = e.message;
        });
        setFieldErrors(serverErrors);
      }
      setMessage(err.message || 'Registration failed. Email may already be registered.');
    }
  };

  return (
    <PublicLayout>
      <div style={{
        minHeight: 'calc(100vh - 120px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '36px 16px',
        background: 'var(--paper)'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '460px',
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          boxShadow: '0 10px 25px -5px rgba(12, 27, 54, 0.08)',
          padding: '36px 32px'
        }}>
          {/* Header Branding */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'var(--navy-deep)',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-serif)',
              fontWeight: '700',
              fontSize: '20px',
              marginBottom: '14px',
              boxShadow: '0 4px 10px rgba(12, 27, 54, 0.2)'
            }}>
              CP
            </div>
            <h1 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '26px',
              fontWeight: '700',
              color: 'var(--navy-deep)',
              margin: '0 0 6px 0',
              lineHeight: 1.2
            }}>
              Create Account
            </h1>
            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
              color: 'var(--muted)',
              margin: 0
            }}>
              Register for the Campus Placement Portal
            </p>
          </div>

          {message && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'var(--brick-tint)',
              border: '1px solid rgba(161, 61, 43, 0.2)',
              color: 'var(--brick)',
              fontSize: '13px',
              marginBottom: '20px'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
              <div>{message}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Full Name */}
            <div>
              <label style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                marginBottom: '6px'
              }}>
                FULL NAME
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. John Doe"
                required
                style={{
                  width: '100%',
                  height: '46px',
                  padding: '0 16px',
                  borderRadius: '8px',
                  border: fieldErrors.name ? '1px solid var(--brick)' : '1px solid var(--border)',
                  background: '#ffffff',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {fieldErrors.name && <small style={{ color: 'var(--brick)', fontSize: '12px', marginTop: '4px', display: 'block' }}>{fieldErrors.name}</small>}
            </div>

            {/* Email Address */}
            <div>
              <label style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                marginBottom: '6px'
              }}>
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="student@campus.edu"
                required
                style={{
                  width: '100%',
                  height: '46px',
                  padding: '0 16px',
                  borderRadius: '8px',
                  border: fieldErrors.email ? '1px solid var(--brick)' : '1px solid var(--border)',
                  background: '#ffffff',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {fieldErrors.email && <small style={{ color: 'var(--brick)', fontSize: '12px', marginTop: '4px', display: 'block' }}>{fieldErrors.email}</small>}
            </div>

            {/* Password */}
            <div>
              <label style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                marginBottom: '6px'
              }}>
                PASSWORD
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min 6 chars with Uppercase, Lowercase & Number"
                required
                style={{
                  width: '100%',
                  height: '46px',
                  padding: '0 16px',
                  borderRadius: '8px',
                  border: fieldErrors.password ? '1px solid var(--brick)' : '1px solid var(--border)',
                  background: '#ffffff',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {fieldErrors.password && <small style={{ color: 'var(--brick)', fontSize: '12px', marginTop: '4px', display: 'block' }}>{fieldErrors.password}</small>}
            </div>

            {/* Confirm Password */}
            <div>
              <label style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                marginBottom: '6px'
              }}>
                CONFIRM PASSWORD
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                required
                style={{
                  width: '100%',
                  height: '46px',
                  padding: '0 16px',
                  borderRadius: '8px',
                  border: fieldErrors.confirmPassword ? '1px solid var(--brick)' : '1px solid var(--border)',
                  background: '#ffffff',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {fieldErrors.confirmPassword && <small style={{ color: 'var(--brick)', fontSize: '12px', marginTop: '4px', display: 'block' }}>{fieldErrors.confirmPassword}</small>}
            </div>

            {/* Role Select */}
            <div>
              <label style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                marginBottom: '6px'
              }}>
                ACCOUNT TYPE
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                style={{
                  width: '100%',
                  height: '46px',
                  padding: '0 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: '#ffffff',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  cursor: 'pointer',
                  boxSizing: 'border-box'
                }}
              >
                <option value="student">Student</option>
                <option value="admin">Placement Cell / Admin</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-gold"
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '8px',
                fontFamily: 'var(--font-sans)',
                fontSize: '15px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '8px'
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  <span>Complete Registration</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div style={{
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border)',
            textAlign: 'center',
            fontSize: '13px',
            color: 'var(--text-secondary)'
          }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--navy)', fontWeight: '600', textDecoration: 'none' }}>
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Register;
