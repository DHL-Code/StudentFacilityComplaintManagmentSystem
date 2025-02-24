// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'; // Import Router, Route, and Routes
import Navbar from './Navbar';
import Home from './Home';

import Signup from './Signup';
import Login from './Login';
import ForgotPassword from './ForgotPassword';
ForgotPassword

function App() {
  return (
    <Router>
      <div>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/Signup" element={<Signup />} />
          <Route path="/Login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
  
          
        </Routes>
      </div>
    </Router>
  );
}

export default App;