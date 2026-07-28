import React, { useState } from 'react';
import './Login.css';
import { authService } from '../services/authService';

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const validate = () => {
    const newErrors = {};
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setGlobalError('');
    
    if (!validate()) return;
    
    setLoading(true);
    
    try {
      const data = await authService.login(email, password);
      
      // Success state
      authService.setSession(data.token, data.user);
      
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (error) {
      setGlobalError(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Left Panel */}
      <div className="login-left-panel">
        <div className="login-branding">
          <div className="brand-logo">
            <span className="logo-icon">◈</span>
            <span className="brand-name">AI Notification Manager</span>
          </div>
          <h1 className="brand-subtitle">Enterprise AI Monitoring Platform</h1>
          <p className="brand-description">
            Monitor enterprise KPIs, analyze critical events and route actionable notifications in real-time.
          </p>
          
          <ul className="brand-features">
            <li>
              <span className="feature-icon">✓</span>
              Real-time KPI Monitoring
            </li>
            <li>
              <span className="feature-icon">✓</span>
              AI-powered Alert Analysis
            </li>
            <li>
              <span className="feature-icon">✓</span>
              Smart Escalation Engine
            </li>
            <li>
              <span className="feature-icon">✓</span>
              Role-based Notification Management
            </li>
          </ul>
        </div>
        <div className="login-footer">
          Version 1.0
        </div>
      </div>

      {/* Right Panel */}
      <div className="login-right-panel">
        <div className="login-card">
          <div className="login-header">
            <h2>Welcome Back</h2>
            <p>Sign in to continue</p>
          </div>

          {globalError && (
            <div className="login-global-error" role="alert">
              {globalError}
            </div>
          )}

          <form onSubmit={handleLogin} className="login-form" noValidate>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <div className="input-wrapper">
                <span className="input-icon">✉</span>
                <input 
                  type="email" 
                  id="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={loading}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
              </div>
              {errors.email && <span className="field-error" id="email-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  id="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={loading}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "password-error" : undefined}
                />
                <button 
                  type="button" 
                  className="toggle-password" 
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={loading}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {errors.password && <span className="field-error" id="password-error">{errors.password}</span>}
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                />
                Remember Me
              </label>
              <a href="#" className="forgot-password" onClick={(e) => e.preventDefault()}>
                Forgot Password?
              </a>
            </div>

            <button 
              type="submit" 
              className={`login-button ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
