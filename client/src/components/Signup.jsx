import React, { useState } from 'react';
import '../styles/Signup.css';

const Signup = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [userId, setUserId] = useState('');
  const [department, setDepartment] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ firstName, lastName, userId, department, phoneNumber, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Handle successful signup (e.g., redirect to login)
        console.log('Signup successful:', data);
        <Navigate to="/login" />
      } else {
        // Handle signup error
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
        <input type="text" placeholder="First Name" className='inline-input' value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        <input type="text" placeholder="Last Name" className='inline-input' value={lastName} onChange={(e) => setLastName(e.target.value)} />
        <input type="text" placeholder="User ID" className='inline-input' value={userId} onChange={(e) => setUserId(e.target.value)} />
        <input type="text" placeholder="Department" className='inline-input' value={department} onChange={(e) => setDepartment(e.target.value)} />
        <input type="text" placeholder="Phone Number" className='inline-input' value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
        <input type="email" placeholder="Email" className='inline-input' value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" className='inline-input' value={password} onChange={(e) => setPassword(e.target.value)} />
        <input type="password" placeholder="Confirm Password" className='inline-input' value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        <input className='button' type="button" value="Signup" onClick={handleSignup} />
        {error && <p className="error">{error}</p>}
      </div>
    </>
  );
};

export default Signup;