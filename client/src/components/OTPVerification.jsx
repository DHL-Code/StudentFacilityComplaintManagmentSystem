import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/otpverification.css';

const OTPVerification = ({ email }) => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [timeLeft, setTimeLeft] = useState(30);
    const [canResend, setCanResend] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (timeLeft <= 0) {
            setCanResend(true);
            return;
        }

        const timer = setTimeout(() => {
            setTimeLeft(timeLeft - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [timeLeft]);

    const handleChange = (e, index) => {
        const value = e.target.value;

        // Allow both numbers and letters (alphanumeric)
        if (/^[a-zA-Z0-9]*$/.test(value) && value.length <= 1) {
            const newOtp = [...otp];
            newOtp[index] = value.toUpperCase(); // Convert to uppercase for consistency
            setOtp(newOtp);

            // Auto-focus next input
            if (value && index < 5) {
                document.getElementById(`otp-input-${index + 1}`).focus();
            }
        }
    };

    const handleKeyDown = (e, index) => {
        // Handle backspace to move to previous input
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            document.getElementById(`otp-input-${index - 1}`).focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text/plain').trim();
        if (/^[a-zA-Z0-9]{6}$/.test(pasteData)) {
            const pasteArray = pasteData.split('');
            const newOtp = [...otp];
            for (let i = 0; i < 6; i++) {
                if (pasteArray[i]) {
                    newOtp[i] = pasteArray[i].toUpperCase();
                }
            }
            setOtp(newOtp);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        const otpString = otp.join('');
        if (otpString.length !== 6) {
            setError('Please enter a 6-character OTP');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/auth/verify-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, otp: otpString }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message || 'OTP verified successfully.');
                navigate('/reset-password', { state: { token: data.token, otp: otpString } });
            } else {
                setError(data.message || 'Failed to verify OTP. Please try again.');
            }
        } catch (err) {
            console.error('OTP verification error:', err);
            setError('An unexpected error occurred. Please try again.');
        }
    };

    const handleResendOTP = async () => {
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
                setMessage(data.message || 'New OTP sent to your email.');
                setTimeLeft(60);
                setCanResend(false);
                setOtp(['', '', '', '', '', '']);
                document.getElementById('otp-input-0').focus();
            } else {
                setError(data.message || 'Failed to resend OTP. Please try again.');
            }
        } catch (err) {
            console.error('Resend OTP error:', err);
            setError('An unexpected error occurred. Please try again.');
        }
    };

    return (
        <div className="otp-verification-page">
            <div className="otp-background-motion"></div>
            <div className="otp-verification-container">
                <h1>Verify OTP</h1>
                <p className="otp-instruction">We've sent a 6-character code to {email}</p>

                <form onSubmit={handleSubmit} className="otp-form">
                    <div className="otp-inputs">
                        {otp.map((char, index) => (
                            <input
                                key={index}
                                id={`otp-input-${index}`}
                                type="text"
                                maxLength="1"
                                value={char}
                                onChange={(e) => handleChange(e, index)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                onPaste={handlePaste}
                                autoFocus={index === 0}
                                className="otp-digit"
                                autoComplete="off"
                            />
                        ))}
                    </div>

                    <div className="otp-timer">
                        {timeLeft > 0 ? (
                            <p>Time remaining: {timeLeft} seconds</p>
                        ) : (
                            <p>OTP expired</p>
                        )}
                    </div>

                    <button type="submit" className="verify-button">
                        Verify
                    </button>

                    {canResend && (
                        <button
                            type="button"
                            className="resend-button"
                            onClick={handleResendOTP}
                        >
                            Resend OTP
                        </button>
                    )}
                </form>

                {message && <p className="success-message">{message}</p>}
                {error && <p className="error-message">{error}</p>}
            </div>
        </div>
    );
};

export default OTPVerification;