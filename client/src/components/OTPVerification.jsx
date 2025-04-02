import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/otpverification.css';

const OTPVerification = ({ email }) => {
    const [otp, setOtp] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        try {
            const response = await fetch('http://localhost:5000/api/auth/verify-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, otp }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message || 'OTP verified successfully.');
                navigate('/reset-password', { state: { token: data.token, otp: otp } }); // Pass token and OTP
            } else {
                setError(data.message || 'Failed to verify OTP. Please try again.');
            }
        } catch (err) {
            console.error('OTP verification error:', err);
            setError('An unexpected error occurred. Please try again.');
        }
    };

    return (
        <div className="otp-verification-page">
            <div className="otp-verification-container">
                <h1>Verify OTP</h1>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <input
                            type="text"
                            placeholder="Enter OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="verify-button">
                        Verify
                    </button>
                </form>
                {message && <p className="success-message">{message}</p>}
                {error && <p className="error-message">{error}</p>}
            </div>
        </div>
    );
};

export default OTPVerification;