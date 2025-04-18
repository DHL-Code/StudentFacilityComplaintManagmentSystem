// DeanPage.jsx
import React, { useState, useEffect } from 'react';
import NotificationBell from '../components/NotificationBell';
import '../styles/DeanStyles.css';

const DeanPage = () => {
  const [activeTab, setActiveTab] = useState('complaints');
  const [deanData, setDeanData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentProfilePhoto, setCurrentProfilePhoto] = useState(null);
  const [newProfilePhoto, setNewProfilePhoto] = useState(null);
  const [newProfilePreview, setNewProfilePreview] = useState(null);
  const [fileError, setFileError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [complaints, setComplaints] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [complaintError, setComplaintError] = useState(null);

  // Function to fetch dean data - extracted to be reusable
  const fetchDeanData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user'));

      if (!token || !userData) {
        throw new Error('Authentication required');
      }

      console.log('User data from localStorage:', userData);

      // Check for different ID properties
      const staffId = userData?.staffId || userData?.userId || userData?.id;

      if (!staffId) {
        throw new Error('Staff ID not found in user data');
      }

      console.log('Using staff ID:', staffId);

      const response = await fetch(`http://localhost:5000/api/admin/staff/${staffId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dean data');
      }

      const data = await response.json();
      console.log('Fetched dean data:', data);

      // Set the profile photo URL if available
      if (data.profilePhoto) {
        // Remove leading slash if it exists to avoid double slashes
        const photoPath = data.profilePhoto.startsWith('/') ? data.profilePhoto.substring(1) : data.profilePhoto;
        setCurrentProfilePhoto(`http://localhost:5000/${photoPath}`);
      }

      const processedData = {
        name: data.name || 'Not available',
        staffId: data.staffId || staffId || 'Not available',
        email: data.email || 'Not available',
        role: data.role || 'Not available',
        phone: data.phone || 'Not available',
        createdAt: data.createdAt || new Date().toISOString()
      };

      setDeanData(processedData);

      // Initialize form data with current values
      setFormData({
        fullName: processedData.name,
        email: processedData.email,
        phoneNumber: processedData.phone,
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      });
    } catch (err) {
      console.error('Error fetching dean data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeanData();
  }, []);

  useEffect(() => {
    if (activeTab === 'complaints') {
      fetchEscalatedComplaints();
    }
  }, [activeTab]);

  const fetchEscalatedComplaints = async () => {
    setLoadingComplaints(true);
    setComplaintError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/complaints/escalated', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch escalated complaints');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch complaints');
      }

      setComplaints(data.data);
    } catch (error) {
      console.error('Error fetching escalated complaints:', error);
      setComplaintError(error.message);
    } finally {
      setLoadingComplaints(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const handlePhotoChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const isValidType = ['image/jpeg', 'image/png'].includes(selectedFile.type);
      const isValidSize = selectedFile.size <= 5 * 1024 * 1024;

      if (isValidType && isValidSize) {
        setNewProfilePhoto(selectedFile);
        const reader = new FileReader();
        reader.onloadend = () => setNewProfilePreview(reader.result);
        reader.readAsDataURL(selectedFile);
        setFileError('');
      } else {
        setFileError('File must be JPG/PNG and less than 5MB');
      }
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (formData.newPassword !== formData.confirmNewPassword) {
      setError("New passwords don't match");
      setLoading(false);
      return;
    }

    if (formData.newPassword && formData.newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    const formPayload = new FormData();
    formPayload.append('name', formData.fullName);
    formPayload.append('email', formData.email);
    formPayload.append('phone', formData.phoneNumber);
    if (formData.currentPassword) {
      formPayload.append('currentPassword', formData.currentPassword);
      formPayload.append('newPassword', formData.newPassword);
    }
    if (newProfilePhoto) {
      formPayload.append('profilePhoto', newProfilePhoto);
    }

    try {
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user'));

      console.log('User data from localStorage:', userData);

      // Check for different ID properties
      const staffId = userData?.staffId || userData?.userId || userData?.id;

      if (!staffId) {
        throw new Error('Staff ID not found in user data');
      }

      console.log('Using staff ID:', staffId);

      // Use the found ID
      const apiUrl = `http://localhost:5000/api/admin/staff/${staffId}`;
      console.log('API URL:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formPayload,
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response text:', errorText);

        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || errorData.message || 'Update failed');
        } catch (parseError) {
          throw new Error(`Update failed: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();
      console.log('Profile update successful:', data);

      // Update currentProfilePhoto if a new one was uploaded
      if (data.profilePhoto) {
        // Remove leading slash if it exists to avoid double slashes
        const photoPath = data.profilePhoto.startsWith('/') ? data.profilePhoto.substring(1) : data.profilePhoto;
        setCurrentProfilePhoto(`http://localhost:5000/${photoPath}`);
      }

      // Update deanData with new values
      setDeanData({
        ...deanData,
        name: data.name,
        email: data.email,
        phone: data.phone
      });

      // Reset form data
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      });

      // Reset profile photo states
      setNewProfilePhoto(null);
      setNewProfilePreview(null);

      // Refresh the profile data to ensure we have the latest data
      await fetchDeanData();

      // Switch to profile view to show the updated profile
      setActiveTab('profile');

      alert('Profile updated successfully');
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveComplaint = async (complaintId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/complaints/escalated/${complaintId}/resolve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to resolve complaint');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to resolve complaint');
      }

      // Refresh complaints list
      await fetchEscalatedComplaints();
      alert('Complaint resolved successfully');
    } catch (error) {
      console.error('Error resolving complaint:', error);
      setComplaintError(error.message);
    }
  };

  return (
    <div className="dean-container">
      <h1>Dean's Dashboard</h1>
      <nav className="dean-nav">
        <button
          className={`nav-btn ${activeTab === 'complaints' ? 'active' : ''}`}
          onClick={() => setActiveTab('complaints')}
        >
          Manage Complaints
        </button>
        <button
          className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('profile');
            fetchDeanData(); // Refresh profile data when switching to profile tab
          }}
        >
          Profile
        </button>
        <button
          className={`nav-btn ${activeTab === 'editProfile' ? 'active' : ''}`}
          onClick={() => setActiveTab('editProfile')}
        >
          Edit Profile
        </button>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
        {/* Add NotificationBell */}
        <NotificationBell userId={deanData?.staffId} />
      </nav>

      {activeTab === 'complaints' && (
        <div className="section">
          <h2>Escalated Complaints</h2>
          {loadingComplaints && <p className="loading">Loading complaints...</p>}
          {complaintError && <p className="error">Error: {complaintError}</p>}

          <div className="complaints-grid">
            {complaints.map(complaint => (
              <div key={complaint._id} className="complaint-card">
                <div className="complaint-header">
                  <h3>{complaint.complaintType}</h3>
                  <span className={`status ${complaint.status.toLowerCase()}`}>
                    {complaint.status}
                  </span>
                </div>
                <div className="complaint-details">
                  <p><strong>Specific Issue:</strong> {complaint.specificInfo}</p>
                  <p><strong>Description:</strong> {complaint.description}</p>
                  <p><strong>Block:</strong> {complaint.blockNumber}</p>
                  <p><strong>Dorm:</strong> {complaint.dormNumber}</p>
                  <p><strong>Date:</strong> {new Date(complaint.createdAt).toLocaleDateString()}</p>
                  <p><strong>Escalation Reason:</strong> {complaint.escalationReason}</p>
                  <p><strong>Escalated At:</strong> {new Date(complaint.escalatedAt).toLocaleDateString()}</p>
                  {complaint.isUrgent && <p className="urgent-tag">URGENT</p>}
                </div>
                <div className="complaint-actions">
                  <button
                    className="resolve-btn"
                    onClick={() => handleResolveComplaint(complaint._id)}
                  >
                    Mark as Resolved
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="section">
          <h2>View Profile</h2>
          {loading && <p className="student-loading">Loading profile...</p>}
          {error && <p className="student-error">Error: {error}</p>}

          <div className="student-profile-container">
            {deanData && (
              <>
                <div className="student-profile-header">
                  {currentProfilePhoto ? (
                    <img
                      src={currentProfilePhoto}
                      alt="Profile"
                      className="student-profile-photo"
                      onError={(e) => {
                        console.error('Failed to load profile photo:', currentProfilePhoto);
                        e.target.style.display = 'none';
                        setError('Failed to load profile photo');
                      }}
                    />
                  ) : (
                    <div className="student-profile-photo-placeholder">No Photo</div>
                  )}
                  <h3 className="full-name">{deanData.name}</h3>
                  <p className="user-id">{deanData.staffId}</p>
                </div>
                <div className="student-profile-details">
                  <div className="student-detail-item">
                    <span className="student-detail-label">Email:</span>
                    <span className="student-detail-value">{deanData.email}</span>
                  </div>
                  <div className="student-detail-item">
                    <span className="student-detail-label">Phone:</span>
                    <span className="student-detail-value">{deanData.phone}</span>
                  </div>
                  <div className="student-detail-item">
                    <span className="student-detail-label">Role:</span>
                    <span className="student-detail-value">{deanData.role}</span>
                  </div>
                  <div className="student-detail-item">
                    <span className="student-detail-label">Member Since:</span>
                    <span className="student-detail-value">
                      {new Date(deanData.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === 'editProfile' && (
        <div className="section">
          <h2>Edit Profile</h2>
          {loading && <p className="student-loading">Updating profile...</p>}
          {error && <p className="student-error">Error: {error}</p>}

          <div className="student-profile-container">
            <form onSubmit={handleProfileUpdate}>
              <div className="student-profile-photo-edit">
                <div
                  className="student-photo-preview"
                  onClick={() => document.getElementById('profilePhotoInput').click()}
                >
                  {newProfilePreview ? (
                    <img src={newProfilePreview} alt="Preview" className="student-profile-image" />
                  ) : currentProfilePhoto ? (
                    <img src={currentProfilePhoto} alt="Current Profile" className="student-profile-image" />
                  ) : (
                    <div className="student-upload-placeholder">
                      <span className="student-upload-icon">+</span>
                      <span className="student-upload-text">Upload Photo</span>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  id="profilePhotoInput"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{ display: 'none' }}
                />
                {fileError && <p className="student-error">{fileError}</p>}
              </div>

              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  placeholder="Leave blank to keep current password"
                />
              </div>

              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  placeholder="Leave blank to keep current password"
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={formData.confirmNewPassword}
                  onChange={(e) => setFormData({ ...formData, confirmNewPassword: e.target.value })}
                  placeholder="Leave blank to keep current password"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-btn">Update Profile</button>
                <button type="button" className="cancel-btn" onClick={() => setActiveTab('profile')}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeanPage;