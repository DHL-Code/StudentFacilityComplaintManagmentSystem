// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, BrowserRouter } from 'react-router-dom'; // Import Router, Route, and Routes
import Navbar from './Navbar';
import Home from './Home';
import StudentAccount from './StudentAccount';
import ProctorDashboard from './ProctorDashboard';
import StudentNav from './StudentNav';
import Signup from './Signup';
import Login from './Login';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import ContactUs from './ContactUs';
import SupervisorPage from './SupervisorPage';
import DeanPage from './DeanPage';
import Admin from './Admin';
import OTPVerification from './OTPVerification';


function App() {
  return (
    <BrowserRouter>

      <div>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/Signup" element={<Signup />} />
          <Route path="/Login" element={<Login />} />
          <Route path="/ContactUs" element={<ContactUs />} />
          <Route path="/StudentAccount" element={<><StudentNav /><StudentAccount /></>} />
          <Route path="/ProctorDashboard" element={<><StudentNav /><ProctorDashboard /></>} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/OTPVerification" element={< OTPVerification />} />
          <Route path="/SupervisorPage" element={<SupervisorPage />} />
          <Route path="/DeanPage" element={<DeanPage />} />
          <Route path="/Admin" element={<Admin />} />


        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;