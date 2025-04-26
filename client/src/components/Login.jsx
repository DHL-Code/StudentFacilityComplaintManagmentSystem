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

    setIsLoading(true);
    setError('');

    try {
      // For students, first check approval status
      if (role === 'student') {
        const approvalResponse = await fetch(`http://localhost:5000/api/student-approvals/${userId}`);
        const approvalData = await approvalResponse.json();

        if (approvalResponse.ok) {
          if (approvalData.status === 'pending') {
            setError('Your account is pending approval. Please wait for admin approval before logging in.');
            setIsLoading(false);
            return;
          } else if (approvalData.status === 'rejected') {
            setError('Your account has been rejected. Please contact the administrator for more information.');
            setIsLoading(false);
            return;
          }
        }
      }

      // Proceed with login if approved or not a student
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({
          userId,
          role: data.userType,
          name: data.name,
          email: data.email || '',
          phone: data.phone || ''
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`login-container ${darkMode ? 'dark' : ''}`}>
      <Navbar />
      <div className="login-form-container">
        <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="login-form">
          <h2>Login</h2>
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="role">Role</label>
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
            <label htmlFor="userId">User ID</label>
            <input
              type="text"
              id="userId"
              placeholder="Enter your user ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="form-control"
            />
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

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </button>

          <div className="signup-link">
            Don't have an account? <Link to="/signup">Sign up</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;