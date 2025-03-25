// DeanPage.jsx
import React, { useState, useEffect } from 'react';
import '../styles/DeanStyles.css';

const DeanPage = () => { 
  const [activeTab, setActiveTab] = useState('complaints');
  const [complaints, setComplaints] = useState([
    { id: 1, title: "Broken AC", category: "Maintenance", 
      status: "Pending", description: "AC not working in Room 101" },
    { id: 2, title: "Leaking Roof", category: "Infrastructure", 
      status: "Verified", description: "Water leakage in the library" }
  ]);

  // Profile State
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    department: '',
    gender: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
    college: ''
  });
  const [newProfilePhoto, setNewProfilePhoto] = useState(null);
  const [newProfilePreview, setNewProfilePreview] = useState(null);
  const [fileError, setFileError] = useState('');
  const [colleges] = useState([
    {
      name: "Computing and Informatics",
      departments: ["Computer Science", "Software Engineering", "Information Technology", "Information Systems"],
    },
    {
      name: "Engineering",
      departments: ["Electrical Engineering", "Mechanical Engineering", "Civil Engineering", "Chemical Engineering"],
    },
    {
      name: "Business",
      departments: ["Business Administration", "Accounting", "Marketing", "Finance"],
    },
  ]);
  const [availableDepartments, setAvailableDepartments] = useState([]);

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

  // Profile Functions
  useEffect(() => {
    if (formData.college) {
      const selectedCollege = colleges.find(col => col.name === formData.college);
      setAvailableDepartments(selectedCollege?.departments || []);
    }
  }, [formData.college, colleges]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) throw new Error('No authentication token found');
      
      const response = await fetch('http://localhost:5000/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch profile');
      }

      const data = await response.json();
      const userData = data.user || data;
      
      setProfile(userData);
      setFormData({
        fullName: userData.fullName || '',
        email: userData.email || '',
        phoneNumber: userData.phoneNumber || '',
        department: userData.department || '',
        gender: userData.gender || '',
        college: userData.college || '',
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      });
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      if (formData.newPassword !== formData.confirmNewPassword) {
        throw new Error("New passwords do not match");
      }

      const formPayload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value) formPayload.append(key, value);
      });
      
      if (newProfilePhoto) {
        formPayload.append('profilePhoto', newProfilePhoto);
      }

      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      const response = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formPayload,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Profile update failed');
      }

      const data = await response.json();
      setProfile(data.user || data);
      alert('Profile updated successfully');
      
      // Reset password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      }));

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFileError('File size must be less than 5MB');
      return;
    }

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setFileError('Only JPG/PNG files are allowed');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setNewProfilePreview(reader.result);
    reader.readAsDataURL(file);
    setNewProfilePhoto(file);
    setFileError('');
  };

  useEffect(() => {
    fetchProfile();
  }, []);

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
          onClick={() => setActiveTab('profile')}
        >
          Profile
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
          <h2>Profile Management</h2>
          {loading && <div className="loading-spinner"></div>}
          {error && <div className="error-message">{error}</div>}

          <div className="profile-section">
            <div className="profile-photo-edit">
              <div 
                className="photo-preview"
                onClick={() => document.getElementById('profilePhotoInput').click()}
              >
                {newProfilePreview ? (
                  <img src={newProfilePreview} alt="Profile preview" />
                ) : profile?.profilePhoto ? (
                  <img src={profile.profilePhoto} alt="Profile" />
                ) : (
                  <div className="upload-placeholder">
                    <span className="upload-icon">+</span>
                    <span>Upload Photo</span>
                  </div>
                )}
              </div>
              <input
                type="file"
                id="profilePhotoInput"
                accept="image/*"
                onChange={handlePhotoChange}
                hidden
              />
              {fileError && <div className="file-error">{fileError}</div>}
            </div>

            <form onSubmit={handleProfileUpdate}>
              <div className="form-grid">
                <label>
                  Full Name:
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={e => setFormData({...formData, fullName: e.target.value})}
                    required
                  />
                </label>

                <label>
                  Email:
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </label>

                <label>
                  Phone Number:
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                  />
                </label>

                <label>
                  College:
                  <select
                    value={formData.college}
                    onChange={e => setFormData({...formData, college: e.target.value})}
                    required
                  >
                    <option value="">Select College</option>
                    {colleges.map(college => (
                      <option key={college.name} value={college.name}>
                        {college.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Department:
                  <select
                    value={formData.department}
                    onChange={e => setFormData({...formData, department: e.target.value})}
                    required
                    disabled={!formData.college}
                  >
                    <option value="">Select Department</option>
                    {availableDepartments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </label>

                <div className="password-section">
                  <h3>Change Password</h3>
                  <input
                    type="password"
                    placeholder="Current Password"
                    value={formData.currentPassword}
                    onChange={e => setFormData({...formData, currentPassword: e.target.value})}
                  />
                  <input
                    type="password"
                    placeholder="New Password"
                    value={formData.newPassword}
                    onChange={e => setFormData({...formData, newPassword: e.target.value})}
                  />
                  <input
                    type="password"
                    placeholder="Confirm New Password"
                    value={formData.confirmNewPassword}
                    onChange={e => setFormData({...formData, confirmNewPassword: e.target.value})}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="save-btn"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeanPage;