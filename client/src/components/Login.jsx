import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from './Navbar';

import '../styles/Login.css';

const Login = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [role, setRole] = useState('student'); // Added role state
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { darkMode } = useTheme();

  const handleLogin = async () => {

    if (!userId || !password) {
      setError('Please enter both User ID and Password.');
      return;
    }

    // Convert input to uppercase for validation
    const upperUserId = userId.toUpperCase();
    const expectedPrefix = {
      student: 'S',
      proctor: 'P',
      supervisor: 'V',
      dean: 'D',
      admin: 'A'
    }[role];

    if (!upperUserId.startsWith(expectedPrefix)) {
      setError(`User ID must start with ${expectedPrefix} for ${role} accounts`);
      return;
    }


    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId, // Send as-is, let backend handle case conversion
          password
        }),
      });

      const data = await response.json();


      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({
          userId,
          role: data.userType,
          name: data.name
        }));

        // Use role from response instead of guessing from ID
        switch (data.userType) {
          case 'student':
            navigate('/StudentAccount');
            break;
          case 'proctor':
            navigate('/ProctorDashboard');
            break;
          case 'dean':
            navigate('/DeanPage');
            break;
          case 'supervisor':
            navigate('/SupervisorPage');
            break;
          case 'admin':
            navigate('/Admin');
            break;
          default:
            navigate('/');
        }
      } else {
        setError(data.message || 'Login failed.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className={`login-page"${darkMode ? 'dark-mode' : ''}`}>
      <Navbar />
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h2>Welcome Back!</h2>
            <p>Please login to your account</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="role">Account Type</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="form-control"
            >
              <option value="student">Student</option>
              <option value="proctor">Proctor</option>
              <option value="supervisor">Supervisor</option>
              <option value="dean">Dean</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="username">User ID</label>
            <input
              type="text"
              id="username"
              placeholder={`Enter your ${role} ID`}
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="form-control"
            />
            <small className="input-hint">
              {role === 'student' && 'Student ID starts with S'}
              {role === 'proctor' && 'Proctor ID starts with P'}
              {role === 'supervisor' && 'Supervisor ID starts with V'}
              {role === 'dean' && 'Dean ID starts with D'}
              {role === 'admin' && 'Admin ID starts with A'}
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-control"
            />
          </div>

          <button
            className="login-button"
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Log In'}
          </button>

          <div className="login-footer">
            <Link to="/forgot-password" className="forgot-password">
              Forgot Password?
            </Link>

            {role === 'student' && (
              <p className="signup-link">
                Don't have an account? <Link to="/signup">Sign Up</Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;