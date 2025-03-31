import React, { useState, useEffect } from 'react';
import '../styles/AdminStyles.css';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('account-approvals');
  const [accountRequests, setAccountRequests] = useState([]);
  const [staffAccounts, setStaffAccounts] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [reports, setReports] = useState([]);
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'proctor',
    password: '',
    profilePhoto: null
  });
  const [profilePreview, setProfilePreview] = useState(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [profileError, setProfileError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Generate IDs with prefixes based on role
  const generateStaffId = (role) => {
    const prefixMap = {
      proctor: 'P',
      supervisor: 'V',
      dean: 'D'
    };
    const prefix = prefixMap[role] || 'S';
    const lastId = staffAccounts.reduce((max, acc) => {
      const num = parseInt(acc.id.slice(1)) || 0;
      return num > max ? num : max;
    }, 0);
    return `${prefix}${String(lastId + 1).padStart(3, '0')}`;
  };

  // Create staff account
  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    // Validate password length
    if (newStaff.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('name', newStaff.name);
    formData.append('email', newStaff.email);
    formData.append('phone', newStaff.phone);
    formData.append('role', newStaff.role);
    formData.append('password', newStaff.password);
    if (newStaff.profilePhoto) {
      formData.append('profilePhoto', newStaff.profilePhoto);
    }

    try {
      const response = await fetch('http://localhost:5000/api/admin/create-staff', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(`Staff account created successfully! Staff ID: ${data.staffId}`);
        setNewStaff({ name: '', email: '', phone: '', role: 'proctor', password: '', profilePhoto: null });
        setProfilePreview(null);
      } else {
        setErrorMessage(data.error || 'Failed to create staff account');
      }
    } catch (error) {
      console.error('Error creating staff:', error);
      setErrorMessage('An error occurred while creating the staff account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setProfileError('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setProfileError("New passwords don't match");
      return;
    }

    try {
      // Simulated API call
      console.log('Password changed successfully');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      setProfileError('Failed to change password');
    }
  };

  return (
    <div className="admin-container">
      <h1 style={{color: 'white'}}>System Administration Dashboard</h1>
      
      <nav className="admin-nav">
        <button onClick={() => setActiveTab('account-approvals')}>
          Student Approvals ({accountRequests.length})
        </button>
        <button onClick={() => setActiveTab('create-staff')}>
          Create Staff
        </button>
        <button onClick={() => setActiveTab('feedback')}>
          Student Feedback
        </button>
        <button onClick={() => setActiveTab('reports')}>
          Generate Reports
        </button>
        <button onClick={() => setActiveTab('profile')}>
          Profile
        </button>
      </nav>

      {/* Profile Section */}
      {activeTab === 'profile' && (
        <div className="section">
          <h2 style={{color: 'white'}}>Admin Profile Settings</h2>
          <form onSubmit={handlePasswordChange} className="profile-form">
            <div className="form-group">
              <label style={{color: 'white'}}>Current Password</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label style={{color: 'white'}}>New Password</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label style={{color: 'white'}}>Confirm New Password</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                required
              />
            </div>

            {profileError && <p style={{color: 'red'}}>{profileError}</p>}

            <button type="submit" style={{background: 'blue', color: 'white'}}>
              Change Password
            </button>
          </form>
        </div>
      )}

      {/* Create Staff Section */}
      {activeTab === 'create-staff' && (
        <div className="section">
          <h2 style={{color: 'white'}}>Create Staff Account</h2>
          <form onSubmit={handleCreateStaff} className="staff-form">
            <div className="photo-upload">
              <div className="profile-preview" onClick={() => document.getElementById('staffPhoto').click()}>
                {profilePreview ? (
                  <img src={profilePreview} alt="Preview" />
                ) : (
                  <div className="upload-placeholder" style={{color: 'white'}}>
                    <span>+</span>
                    <p>Upload Photo</p>
                  </div>
                )}
              </div>
              <input
                type="file"
                id="staffPhoto"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setProfilePreview(reader.result);
                    reader.readAsDataURL(file);
                    setNewStaff({...newStaff, profilePhoto: file});
                  }
                }}
                hidden
              />
            </div>

            <div className="form-group">
              <label style={{color: 'white'}}>Full Name</label>
              <input
                type="text"
                value={newStaff.name}
                onChange={e => setNewStaff({...newStaff, name: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label style={{color: 'white'}}>Email</label>
              <input
                type="email"
                value={newStaff.email}
                onChange={e => setNewStaff({...newStaff, email: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label style={{color: 'white'}}>Phone Number</label>
              <input
                type="tel"
                value={newStaff.phone}
                onChange={e => setNewStaff({...newStaff, phone: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label style={{color: 'white'}}>Password</label>
              <input
                type="password"
                value={newStaff.password}
                onChange={e => setNewStaff({...newStaff, password: e.target.value})}
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label style={{color: 'white'}}>Role</label>
              <select
                value={newStaff.role}
                onChange={e => setNewStaff({...newStaff, role: e.target.value})}
              >
                <option value="proctor">Proctor</option>
                <option value="supervisor">Supervisor</option>
                <option value="dean">Student Dean</option>
              </select>
            </div>

            <button 
              type="submit" 
              style={{background: 'blue', color: 'white'}}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            {successMessage && (
              <div className="success-message" style={{color: 'green', marginTop: '10px'}}>
                {successMessage}
              </div>
            )}
            {errorMessage && (
              <div className="error-message" style={{color: 'red', marginTop: '10px'}}>
                {errorMessage}
              </div>
            )}
          </form>
        </div>
      )}

      {/* Other sections remain same */}
    </div>
  );
};

export default AdminPage;