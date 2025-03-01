import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
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
        navigate('/'); // Redirect to a protected route
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <>
      <h1>Welcome</h1>
      <div className='inline-heading'>
        <input type="text" placeholder="UserID" className="inline-input" value={userId} onChange={(e) => setUserId(e.target.value)} />
        <input type="password" placeholder='Password' className="inline-input" value={password} onChange={(e) => setPassword(e.target.value)} />
        <input className="button" type="button" value="Login" onClick={handleLogin} />
        {error && <p className="error">{error}</p>}
        <Link to="/forgot-password" className='forgot-password'>Forgot Password?</Link>
      </div>
    </>
  );
};

export default Login;