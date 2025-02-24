// src/Contact.js
import React from 'react';
import './Signup.css';

const Signup = () => {
 
  return (<>
    <h1 >Welcome</h1>
    <div >
      <div className="inline-heading">
          <input type="text" placeholder='FirstName' className='inline-input' />
        </div>
        <div className="inline-heading">
          <input type="text" placeholder='LastName' className='inline-input' />
        </div>
        <div className="inline-heading">
          <input type="text" placeholder="UserID" className="inline-input"/>
        </div> 
        <div className="inline-heading">
          <input type="text" placeholder='Department' className='inline-input' />
        </div>
        <div className="inline-heading">
          <input type="text" placeholder='Phone Number' className='inline-input' />
        </div>
        <div className="inline-heading">
          <input type="email" placeholder='Email' className='inline-input' />
        </div>
        <div className="inline-heading">
          <input type="password" placeholder='Password' className='inline-input' />
        </div>
        <div className="inline-heading">
          <input type="password" placeholder='Confirm Password' className='inline-input' />
        </div>
        <input className='button' type="button" value="Signup" />
       
    </div></>
  );
};

export default Signup;
