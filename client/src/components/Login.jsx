import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import Navbar from './Navbar';
import '../styles/Login.css';

const Login = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
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
        // Store token and redirect
        localStorage.setItem('token', data.token);
        console.log('Login successful:', data.token);
        const firstLetter = userId.charAt(0).toLowerCase();// Redirect to a protected route
        if (firstLetter === 's') {
          navigate('/StudentAccount'); // Redirect to Student dashboard
        } else if (firstLetter === 'p') {
          navigate('/ProctorDashboard'); // Redirect to Proctor dashboard
        } else if (firstLetter === 'c') {
          navigate('/user-dashboard'); // Redirect to user dashboard
        } else {
          navigate('/'); // Redirect to a Home
        }
      
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div>
    <Navbar />
    <div className="login-container"> 
   
    <div className="login-form">

      <h1 className="login-title">FacilityComplaintManagment</h1>
     
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
    </div>
  </div>
  </div>
);
};

export default Login;