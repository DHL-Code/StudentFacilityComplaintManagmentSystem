// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, BrowserRouter } from 'react-router-dom'; // Import Router, Route, and Routes
import Navbar from './Navbar';
import Home from './Home';
import StudentAccount from './StudentAccount';
import StudentNav from './StudentNav';
import Signup from './Signup';
import Login from './Login';
import ForgotPassword from './ForgotPassword';


ForgotPassword

function App() {
  return (
    <BrowserRouter>
      <div>
     
        <Routes>
          <Route path="/" element={ <Home /> } />
          <Route path="/Signup" element={<Signup />} />
          <Route path="/Login" element={<Login />} />
          <Route path="/StudentAccount" element={<><StudentNav/><StudentAccount  /></>} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          
          
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;