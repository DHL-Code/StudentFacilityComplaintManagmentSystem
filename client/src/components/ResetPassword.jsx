import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/Resetpassword.css';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const { token, otp } = location.state || {}; // Extract token and OTP

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (!token || !otp) {
            setError('Missing token or OTP. Please try again.');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token, password, otp }), // Send token, password, and OTP
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message || 'Password reset successfully.');
                setTimeout(() => navigate('/Login'), 3000);
            } else {
                setError(data.message || 'Failed to reset password. Please try again.');
            }
        } catch (err) {
            console.error('Reset password error:', err);
            setError('An unexpected error occurred. Please try again.');
        }
    };

    return (
        <div className="reset-password-page">
            <div className="reset-password-container">
                <h1>Reset Password</h1>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <input
                            type="password"
                            placeholder="New Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <input
                            type="password"
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="reset-button">
                        Reset Password
                    </button>
                </form>
                {message && <p className="success-message">{message}</p>}
                {error && <p className="error-message">{error}</p>}
            </div>
        </div>
    );
};

export default ResetPassword;