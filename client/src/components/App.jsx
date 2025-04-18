// src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '../context/ThemeContext';
import Navbar from './Navbar';
import Home from './Home';
import StudentAccount from './StudentAccount';
import ProctorDashboard from './ProctorDashboard';
import Signup from './Signup';
import Login from './Login';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import ContactUs from './ContactUs';
import SupervisorPage from './SupervisorPage';
import DeanPage from './DeanPage';
import Admin from './Admin';
import OTPVerification from './OTPVerification';
import NotificationBell from './NotificationBell';
import { NotificationProvider } from '../contexts/NotificationContext';

function App() {

  return (
    <ThemeProvider>
      <NotificationProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/Signup" element={<Signup />} />
            <Route path="/Login" element={<Login />} />
            <Route path="/ContactUs" element={<ContactUs />} />
            <Route path="/StudentAccount" element={<StudentAccount />} />
            <Route path="/ProctorDashboard" element={<ProctorDashboard />} />
            <Route path="/ForgotPassword" element={<ForgotPassword />} />
            <Route path="/ResetPassword" element={<ResetPassword />} />
            <Route path="/OTPVerification" element={<OTPVerification />} />
            <Route path="/NotificationBell" element={<NotificationBell />} />
            <Route path="/SupervisorPage" element={<SupervisorPage />} />
            <Route path="/DeanPage" element={<DeanPage />} />
            <Route path="/Admin" element={<Admin />} />
          </Routes>
        </Router>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;