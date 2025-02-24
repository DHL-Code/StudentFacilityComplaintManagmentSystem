// src/Contact.js
import React from 'react';
import { Link } from 'react-router-dom'; // Import Link from react-router-dom
import './Login.css'

const Login = () => {
  /*
  
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate(); // Hook for navigation

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, password }),
      });

      const data = await response.json();
      if (response.ok) {
        // Store the token in local storage or context
        localStorage.setItem('token', data.token); // Example of storing the token
        alert('Login successful!');
        navigate('/dashboard'); // Redirect to the dashboard or home page
      } else {
        alert(data.message); // Show error message
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    }
  };
  */
  return (<>
    <h1>Welcome</h1>
    <div className='center'>
   <div className="inline-heading">
    <input type="text" placeholder="UserID" className="inline-input"/>
    </div> 
     <div className="inline-heading">
      <input type="password" placeholder='PassWord' className='inline-input' />
    </div>
    <input className='button' type="button" value="Login" />
    <Link to="/forgot-password" className='forgot-password'>Forgot Password?</Link>
    </div></>
  );
};

export default Login;
