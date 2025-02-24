import React, { useState } from 'react';
import './forgotpassword.css';


const ForgotPassword = () => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here, you would typically send the email to your backend API for processing
    console.log('Email sent to:', email);
    // You can add further logic to handle the response from the server
  };
  return (
    <>
      <h1>Forgot Password</h1>
      <div className='center'>
        <form onSubmit={handleSubmit}>
          <div className="inline-heading">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="inline-input" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <input className='button' type="submit" value="Send" />
        </form>
      </div>
    </>
  );
};

export default ForgotPassword;