// src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
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
import TermsOfService from './TermsOfService';
import { NotificationProvider } from '../contexts/NotificationContext';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('user');

  if (!token || !userData) {
    return <Navigate to="/Login" replace />;
  }

  try {
    const user = JSON.parse(userData);
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return <Navigate to="/Login" replace />;
    }
    return children;
  } catch (error) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/Login" replace />;
  }
};

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
            <Route path="/ForgotPassword" element={<ForgotPassword />} />
            <Route path="/ResetPassword" element={<ResetPassword />} />
            <Route path="/OTPVerification" element={<OTPVerification />} />
            <Route path="/TermsOfService" element={<TermsOfService />} />
            
            {/* Protected Routes */}
            <Route path="/StudentAccount" element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentAccount />
              </ProtectedRoute>
            } />
            <Route path="/ProctorDashboard" element={
              <ProtectedRoute allowedRoles={['proctor']}>
                <ProctorDashboard />
              </ProtectedRoute>
            } />
            <Route path="/SupervisorPage" element={
              <ProtectedRoute allowedRoles={['supervisor']}>
                <SupervisorPage />
              </ProtectedRoute>
            } />
            <Route path="/DeanPage" element={
              <ProtectedRoute allowedRoles={['dean']}>
                <DeanPage />
              </ProtectedRoute>
            } />
            <Route path="/Admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Admin />
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;