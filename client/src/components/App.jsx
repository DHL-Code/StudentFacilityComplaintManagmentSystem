// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'; // Import Router, Route, and Routes
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
    <Router>
      <div>
     
        <Routes>
          <Route path="/" element={ <><Navbar /><Home /></> } />
          <Route path="/Signup" element={<><Navbar /><Signup /></>} />
          <Route path="/Login" element={<><Navbar /><Login /></>} />
          <Route path="/StudentAccount" element={<><StudentNav/><StudentAccount  /></>} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
         
          
          
        </Routes>
      </div>
    </Router>
  );
}

export default App;