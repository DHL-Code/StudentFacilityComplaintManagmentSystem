import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/forgotpassword.css';
import forgotPasswordImage from '../assets/forgotPass3.jpg';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Password reset link sent to your email.');
      } else {
        setError(data.message || 'Failed to send reset link. Please try again.');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="forgot-password-page">
      <button className="back-button" onClick={() => navigate('/Login')}>
          &#8592; Back
        </button>
      <div className="background-motion"></div>
      <div className="forgot-password-container">
        
        <div className="forgot-password-image">
          <img src={forgotPasswordImage} alt="Forgot Password" />
        </div>
        <div className="forgot-password-form">
          <h1>Forgot Password</h1>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="reset-button">
              Send Reset Link
            </button>
          </form>
          {message && <p className="success-message">{message}</p>}
          {error && <p className="error-message">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;