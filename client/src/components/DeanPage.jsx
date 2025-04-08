// DeanPage.jsx
import React, { useState, useEffect } from 'react';
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
  const [complaints, setComplaints] = useState([
    { id: 1, title: "Broken AC", category: "Maintenance", 
      status: "Pending", description: "AC not working in Room 101" },
    { id: 2, title: "Leaking Roof", category: "Infrastructure", 
      status: "Verified", description: "Water leakage in the library" }
  ]);

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
        // Check if the URL already starts with http://localhost:5000/
        if (data.profilePhoto.startsWith('http://localhost:5000/')) {
          setCurrentProfilePhoto(data.profilePhoto);
        } else {
          setCurrentProfilePhoto(`http://localhost:5000/${data.profilePhoto}`);
        }
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
        // Check if the URL already starts with http://localhost:5000/
        if (data.profilePhoto.startsWith('http://localhost:5000/')) {
          setCurrentProfilePhoto(data.profilePhoto);
        } else {
          setCurrentProfilePhoto(`http://localhost:5000/${data.profilePhoto}`);
        }
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

  // Complaint Functions
  const verifyComplaint = (complaintId) => {
    setComplaints(complaints.map(comp =>
      comp.id === complaintId ? { ...comp, status: "Verified" } : comp
    ));
  };

  const resolveComplaint = (complaintId) => {
    setComplaints(complaints.map(comp =>
      comp.id === complaintId ? { ...comp, status: "Resolved" } : comp
    ));
  };

  const removeComplaint = (complaintId) => {
    setComplaints(complaints.filter(comp => comp.id !== complaintId));
  };

  const removeAllComplaints = () => {
    if (window.confirm('Are you sure you want to remove all complaints?')) {
      setComplaints([]);
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
      </nav>

      {activeTab === 'complaints' && (
        <div className="section">
          <h2>Complaints Management</h2>
          <button 
            className="remove-all-btn"
            onClick={removeAllComplaints}
            disabled={complaints.length === 0}
          >
            Remove All Complaints ({complaints.length})
          </button>
          <div className="complaints-list">
            {complaints.map(complaint => (
              <div key={complaint.id} className="complaint-card">
                <div className="complaint-header">
                  <h3>{complaint.title}</h3>
                  <span className={`status ${complaint.status.toLowerCase()}`}>
                    {complaint.status}
                  </span>
                </div>
                <p>{complaint.description}</p>
                <div className="action-buttons">
                  <button 
                    className="remove-btn"
                    onClick={() => removeComplaint(complaint.id)}
                  >
                    Remove
                  </button>
                  {complaint.status === "Pending" && (
                    <button
                      className="verify-btn"
                      onClick={() => verifyComplaint(complaint.id)}
                    >
                      Verify
                    </button>
                  )}
                  {complaint.status === "Verified" && (
                    <button
                      className="resolve-btn"
                      onClick={() => resolveComplaint(complaint.id)}
                    >
                      Resolve
                    </button>
                  )}
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
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    required
                  />
              </div>

              <div className="form-group">
                <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                  placeholder="Leave blank to keep current password"
                />
              </div>

              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                  placeholder="Leave blank to keep current password"
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={formData.confirmNewPassword}
                  onChange={(e) => setFormData({...formData, confirmNewPassword: e.target.value})}
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