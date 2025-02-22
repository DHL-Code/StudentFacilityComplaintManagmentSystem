// src/Contact.js
import React from 'react';
import './Login.css'

const Login = () => {
  return (<>
    <h1>Welcome</h1>
    <div className='center'>
   <p>Sign in With Your Account </p> 
   <div><h2 className="inline-heading">Enter your</h2>
    <input type="text" placeholder="Username" className="inline-input" /></div> 
     <div><h2 className="inline-heading">Enter your</h2>
      <input type="text" placeholder='PassWord' className='inline-input' />
      
    </div>
    <input className='button' type="button" value="Login" />
    </div></>
  );
};

export default Login;