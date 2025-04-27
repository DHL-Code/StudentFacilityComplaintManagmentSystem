// DeanPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import DeanNotificationBell from '../components/DeanNotificationBell';
import '../styles/DeanStyles.css';
import { FaSun, FaMoon } from 'react-icons/fa';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

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
  const [darkMode, setDarkMode] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [summaryReports, setSummaryReports] = useState([]);
  const [loadingSummaryReports, setLoadingSummaryReports] = useState(false);
  const [summaryReportsError, setSummaryReportsError] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState('all');
  const [availableBlocks, setAvailableBlocks] = useState(['all']);
  const [resolvedComplaints, setResolvedComplaints] = useState([]);
  const [loadingResolved, setLoadingResolved] = useState(false);
  const [resolvedError, setResolvedError] = useState(null);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'var(--text-primary)',
          font: {
            size: 14
          }
        }
      },
      title: {
        display: true,
        text: 'Complaints Overview',
        color: 'var(--text-primary)',
        font: {
          size: 16,
          weight: 'bold'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: 'var(--text-primary)'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      x: {
        ticks: {
          color: 'var(--text-primary)'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: 'var(--text-primary)',
          font: {
            size: 14
          }
        }
      }
    }
  };

  const getChartData = () => {
    const labels = filteredReports.map(report => 
      selectedBlock === 'all' ? 'All Blocks' : `Block ${report.blockNumber}`
    );

    return {
      labels,
      datasets: [
        {
          label: 'Total Complaints',
          data: filteredReports.map(report => report.totalComplaints),
          backgroundColor: 'rgba(54, 162, 235, 0.8)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        },
        {
          label: 'Resolved',
          data: filteredReports.map(report => report.resolvedComplaints),
          backgroundColor: 'rgba(75, 192, 192, 0.8)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        },
        {
          label: 'Pending',
          data: filteredReports.map(report => report.pendingComplaints),
          backgroundColor: 'rgba(255, 206, 86, 0.8)',
          borderColor: 'rgba(255, 206, 86, 1)',
          borderWidth: 1
        }
      ]
    };
  };

  const getDoughnutData = () => {
    const total = filteredReports.reduce((sum, report) => sum + report.totalComplaints, 0);
    const resolved = filteredReports.reduce((sum, report) => sum + report.resolvedComplaints, 0);
    const pending = filteredReports.reduce((sum, report) => sum + report.pendingComplaints, 0);

    return {
      labels: ['Resolved', 'Pending'],
      datasets: [
        {
          data: [resolved, pending],
          backgroundColor: [
            'rgba(75, 192, 192, 0.8)',
            'rgba(255, 206, 86, 0.8)'
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(255, 206, 86, 1)'
          ],
          borderWidth: 1
        }
      ]
    };
  };

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
        // Extract just the filename from the full path
        const photoPath = data.profilePhoto.split('\\').pop();
        setCurrentProfilePhoto(`http://localhost:5000/uploads/staff-photos/${photoPath}`);
      }

      const processedData = {
        name: data.name || 'Not available',
        staffId: data.staffId || staffId || 'Not available',
        email: data.email || 'Not available',
        role: data.role || 'Not available',
        phone: data.phone || 'Not available',
        createdAt: data.createdAt || new Date().toISOString(),
        profilePhoto: data.profilePhoto || null
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
    } else if (activeTab === 'summaryReports') {
      fetchEscalatedComplaints();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'summaryReports') {
      // Get the current user's ID
      const userData = JSON.parse(localStorage.getItem('user'));
      const staffId = userData?.staffId || userData?.userId || userData?.id;

      if (staffId) {
        // Filter complaints that were resolved by this dean
        const deanResolvedComplaints = complaints.filter(complaint => 
          complaint.status === 'resolved' && 
          complaint.resolvedBy === staffId
        );
        console.log('Resolved complaints in useEffect:', deanResolvedComplaints); // Debug log
        setResolvedComplaints(deanResolvedComplaints);
      }
    }
  }, [activeTab, complaints]);

  const fetchEscalatedComplaints = async () => {
    setLoadingComplaints(true);
    setComplaintError(null);
    try {
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user'));
      const staffId = userData?.staffId || userData?.userId || userData?.id;

      // Fetch escalated complaints
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

      console.log('Fetched complaints:', data.data); // Debug log

      // Set all complaints
      setComplaints(data.data);
      
      // If we're on the summary reports tab, update resolved complaints
      if (activeTab === 'summaryReports') {
        const resolvedComplaints = data.data.filter(complaint => 
          complaint.status === 'resolved' && 
          complaint.resolvedBy === staffId
        );
        console.log('Filtered resolved complaints:', resolvedComplaints); // Debug log
        setResolvedComplaints(resolvedComplaints);
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
      setComplaintError(error.message);
    } finally {
      setLoadingComplaints(false);
    }
  };

  const fetchSummaryReports = async () => {
    setLoadingSummaryReports(true);
    setSummaryReportsError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/complaints/summary', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to fetch summary reports: ${response.status}`);
      }

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch summary reports');
      }

      // Extract unique blocks from the reports and sort them
      const blockNumbers = data.data.map(report => {
        const block = String(report.blockNumber).trim();
        return block;
      }).filter(block => block !== '' && block !== undefined && block !== null);

      const uniqueBlocks = ['all', ...new Set(blockNumbers)].sort((a, b) => {
        if (a === 'all') return -1;
        if (b === 'all') return 1;
        return parseInt(a) - parseInt(b);
      });

      setAvailableBlocks(uniqueBlocks);
      setSummaryReports(data.data);
    } catch (error) {
      console.error('Error fetching summary reports:', error);
      setSummaryReportsError(error.message);
    } finally {
      setLoadingSummaryReports(false);
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
      const staffId = userData?.staffId || userData?.userId || userData?.id;

      if (!staffId) {
        throw new Error('Staff ID not found in user data');
      }

      const response = await fetch(`http://localhost:5000/api/admin/staff/${staffId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formPayload
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const updatedData = await response.json();
      
      // Update the profile photo if it was changed
      if (updatedData.profilePhoto) {
        // Extract just the filename from the full path
        const photoPath = updatedData.profilePhoto.split('\\').pop();
        setCurrentProfilePhoto(`http://localhost:5000/uploads/staff-photos/${photoPath}`);
      }

      // Update dean data with new values
      setDeanData(prev => ({
        ...prev,
        name: formData.fullName,
        email: formData.email,
        phone: formData.phoneNumber,
        profilePhoto: updatedData.profilePhoto || prev.profilePhoto
      }));

      // Reset form and photo states
      setNewProfilePhoto(null);
      setNewProfilePreview(null);
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      }));

      setError(null);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveComplaint = async (complaintId) => {
    try {
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user'));
      const staffId = userData?.staffId || userData?.userId || userData?.id;

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

      // Update the complaints list
      await fetchEscalatedComplaints();
      
      alert('Complaint resolved successfully');
    } catch (error) {
      console.error('Error resolving complaint:', error);
      setComplaintError(error.message);
    }
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    setIsDarkMode(!isDarkMode);
  };

  const handleBlockChange = (e) => {
    setSelectedBlock(e.target.value);
  };

  const filteredReports = selectedBlock === 'all' 
    ? [{
        proctorName: 'All Proctors',
        blockNumber: 'All Blocks',
        totalComplaints: summaryReports.reduce((sum, report) => sum + report.totalComplaints, 0),
        resolvedComplaints: summaryReports.reduce((sum, report) => sum + report.resolvedComplaints, 0),
        pendingComplaints: summaryReports.reduce((sum, report) => sum + report.pendingComplaints, 0),
        summary: `Total: ${summaryReports.reduce((sum, report) => sum + report.totalComplaints, 0)}, 
                 Resolved: ${summaryReports.reduce((sum, report) => sum + report.resolvedComplaints, 0)}, 
                 Pending: ${summaryReports.reduce((sum, report) => sum + report.pendingComplaints, 0)}`
      }]
    : summaryReports.filter(report => String(report.blockNumber).trim() === selectedBlock);

  return (
    <div className={`dean-container ${darkMode ? 'dark-mode' : ''}`}>
      <div className="dean-header">
        <h1>Dean's Dashboard</h1>
        <div className="dean-header-actions">
          <button className="dean-theme-toggle" onClick={toggleTheme}>
            {isDarkMode ? <FaSun className="dean-theme-icon" /> : <FaMoon className="dean-theme-icon" />}
          </button>
          <DeanNotificationBell />
          <button className="dean-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="dean-main-content">
        <div className="dean-sidebar">
          <button
            className={`dean-nav-btn ${activeTab === 'complaints' ? 'active' : ''}`}
            onClick={() => setActiveTab('complaints')}
          >
            Manage Complaints
          </button>
          <button
            className={`dean-nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('profile');
              fetchDeanData();
            }}
          >
            Profile
          </button>
          <button
            className={`dean-nav-btn ${activeTab === 'editProfile' ? 'active' : ''}`}
            onClick={() => setActiveTab('editProfile')}
          >
            Edit Profile
          </button>
          <button
            className={`dean-nav-btn ${activeTab === 'summaryReports' ? 'active' : ''}`}
            onClick={() => setActiveTab('summaryReports')}
          >
            Summary Report
          </button>
        </div>

        <div className="dean-content-area">
          {activeTab === 'complaints' && (
            <div className="dean-section">
              <h2>Escalated Complaints</h2>
              {loadingComplaints && <p className="dean-loading">Loading complaints...</p>}
              {complaintError && <p className="dean-error">Error: {complaintError}</p>}

              <div className="dean-complaints-grid">
                {complaints.map(complaint => (
                  <div key={complaint._id} className="dean-complaint-card">
                    <div className="dean-complaint-header">
                      <h3>{complaint.complaintType}</h3>
                      <span className={`dean-status ${complaint.status.toLowerCase()}`}>
                        {complaint.status}
                      </span>
                    </div>
                    <div className="dean-complaint-details">
                      <p><strong>Specific Issue:</strong> {complaint.specificInfo}</p>
                      <p><strong>Description:</strong> {complaint.description}</p>
                      <p><strong>Block:</strong> {complaint.blockNumber}</p>
                      <p><strong>Dorm:</strong> {complaint.dormNumber}</p>
                      <p><strong>Date:</strong> {new Date(complaint.createdAt).toLocaleDateString()}</p>
                      <p><strong>Escalation Reason:</strong> {complaint.escalationReason}</p>
                      <p><strong>Escalated At:</strong> {new Date(complaint.escalatedAt).toLocaleDateString()}</p>
                      {complaint.isUrgent && <p className="dean-urgent-tag">URGENT</p>}
                    </div>
                    <div className="dean-complaint-actions">
                      <button
                        className="dean-resolve-btn"
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
            <div className="dean-section">
              <h2>View Profile</h2>
              {loading && <p className="dean-loading">Loading profile...</p>}
              {error && <p className="dean-error">Error: {error}</p>}

              <div className="dean-profile-container">
                {deanData && (
                  <>
                    <div className="dean-profile-header">
                      {currentProfilePhoto ? (
                        <img
                          src={currentProfilePhoto}
                          alt="Profile"
                          className="dean-profile-photo"
                          onError={(e) => {
                            console.error('Failed to load profile photo:', currentProfilePhoto);
                            e.target.style.display = 'none';
                            setError('Failed to load profile photo');
                          }}
                        />
                      ) : (
                        <div className="dean-profile-photo-placeholder">
                          {deanData.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <h3 className="dean-full-name">{deanData.name}</h3>
                      <p className="dean-user-id">{deanData.staffId}</p>
                    </div>
                    <div className="dean-profile-details">
                      <div className="dean-detail-item">
                        <span className="dean-detail-label">Email:</span>
                        <span className="dean-detail-value">{deanData.email}</span>
                      </div>
                      <div className="dean-detail-item">
                        <span className="dean-detail-label">Phone:</span>
                        <span className="dean-detail-value">{deanData.phone}</span>
                      </div>
                      <div className="dean-detail-item">
                        <span className="dean-detail-label">Role:</span>
                        <span className="dean-detail-value">{deanData.role}</span>
                      </div>
                      <div className="dean-detail-item">
                        <span className="dean-detail-label">Member Since:</span>
                        <span className="dean-detail-value">
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
            <div className="dean-section">
              <h2>Edit Profile</h2>
              {loading && <p className="dean-loading">Updating profile...</p>}
              {error && <p className="dean-error">Error: {error}</p>}

              <div className="dean-profile-container">
                <form onSubmit={handleProfileUpdate}>
                  <div className="dean-profile-photo-edit">
                    <div
                      className="dean-photo-preview"
                      onClick={() => document.getElementById('profilePhotoInput').click()}
                    >
                      {newProfilePreview ? (
                        <img src={newProfilePreview} alt="Preview" className="dean-profile-image" />
                      ) : currentProfilePhoto ? (
                        <img src={currentProfilePhoto} alt="Current Profile" className="dean-profile-image" />
                      ) : (
                        <div className="dean-upload-placeholder">
                          <span className="dean-upload-icon">+</span>
                          <span className="dean-upload-text">Upload Photo</span>
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
                    {fileError && <p className="dean-error">{fileError}</p>}
                  </div>

                  <div className="dean-form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="dean-form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="dean-form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      required
                    />
                  </div>

                  <div className="dean-form-group">
                    <label>Current Password</label>
                    <input
                      type="password"
                      value={formData.currentPassword}
                      onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                      placeholder="Leave blank to keep current password"
                    />
                  </div>

                  <div className="dean-form-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      placeholder="Leave blank to keep current password"
                    />
                  </div>

                  <div className="dean-form-group">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      value={formData.confirmNewPassword}
                      onChange={(e) => setFormData({ ...formData, confirmNewPassword: e.target.value })}
                      placeholder="Leave blank to keep current password"
                    />
                  </div>

                  <div className="dean-form-actions">
                    <button type="submit" className="dean-submit-btn">Update Profile</button>
                    <button type="button" className="dean-cancel-btn" onClick={() => setActiveTab('profile')}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'summaryReports' && (
            <div className="dean-section dean-tasks-section">
              <div className="dean-tasks-header">
                <h2>Dean's Tasks Overview</h2>
                <div className="dean-time-filter">
                  <label htmlFor="timeSelect">Time Period:</label>
                  <select 
                    id="timeSelect"
                    value={selectedBlock}
                    onChange={handleBlockChange}
                    className="dean-time-select"
                  >
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>
              </div>

              {loadingComplaints && <p className="dean-loading">Loading tasks...</p>}
              {complaintError && <p className="dean-error">Error: {complaintError}</p>}

              <div className="dean-tasks-container">
                <div className="dean-task-card">
                  <div className="dean-task-header">
                    <h3>Resolved Complaints</h3>
                    <div className="dean-task-stats">
                      <div className="dean-stat-item">
                        <span className="dean-stat-label">Total Resolved</span>
                        <span className="dean-stat-value dean-resolved">{resolvedComplaints.length}</span>
                      </div>
                      <div className="dean-stat-item">
                        <span className="dean-stat-label">Today</span>
                        <span className="dean-stat-value">
                          {resolvedComplaints.filter(c => 
                            new Date(c.resolvedAt).toDateString() === new Date().toDateString()
                          ).length}
                        </span>
                      </div>
                      <div className="dean-stat-item">
                        <span className="dean-stat-label">This Week</span>
                        <span className="dean-stat-value">
                          {resolvedComplaints.filter(c => {
                            const complaintDate = new Date(c.resolvedAt);
                            const today = new Date();
                            const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
                            return complaintDate >= weekStart;
                          }).length}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="dean-task-details">
                    <p>Recent Resolutions:</p>
                    {resolvedComplaints.length === 0 ? (
                      <p className="dean-no-resolutions">No resolved complaints yet</p>
                    ) : (
                      <ul className="dean-activity-list">
                        {resolvedComplaints.slice(0, 5).map(complaint => (
                          <li key={complaint._id} className="dean-activity-item">
                            <span className="dean-activity-type">{complaint.complaintType}</span>
                            <span className="dean-activity-status" data-status="Resolved">Resolved</span>
                            <span className="dean-activity-time">
                              {new Date(complaint.resolvedAt).toLocaleString()}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeanPage;