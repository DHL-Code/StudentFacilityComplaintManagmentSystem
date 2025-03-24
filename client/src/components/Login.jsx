import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from './Navbar';

import '../styles/Login.css';

const Login = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!userId || !password) {
      setError('Please enter both User ID and Password.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', userId);

        const firstLetter = userId.charAt(0).toLowerCase();
        if (firstLetter === 's') {
          navigate('/StudentAccount');
        } else if (firstLetter === 'p') {
          navigate('/ProctorDashboard');
        } else if (firstLetter === 'd') {
          navigate('/DeanPage');
        } else if (firstLetter === 'v') {
          navigate('/SupervisorPage');
        } 
         else {
          navigate('/');
        }
      } else {
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div>
      <Navbar />
      <div className="login-container">
        
        <div className="login-form">
          <h2 className="welcome-back">Welcome Back!</h2>

          <div className="input-group">
            <label htmlFor="username">UserID</label>
            <input
              type="text"
              id="username"
              placeholder="Enter your userID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button className="login-button" onClick={handleLogin}>
            Log In
          </button>

          {error && <p className="error">{error}</p>}

          <div className="additional-login-options">
            <Link to="/forgot-password" className="forgot-password">
              Forgot Password?
            </Link>
            {userId.charAt(0).toLowerCase() === 's' && (
              <p className="no-account">
                Don't have an account? <Link to="/signup" className="signup-link">Sign Up</Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;