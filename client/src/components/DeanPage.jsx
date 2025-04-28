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
  const [darkMode, setDarkMode] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [summaryReports, setSummaryReports] = useState([]);
  const [loadingSummaryReports, setLoadingSummaryReports] = useState(false);
  const [summaryReportsError, setSummaryReportsError] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState('all');
  const [availableBlocks, setAvailableBlocks] = useState(['all']);
  const [resolvedComplaints, setResolvedComplaints] = useState([]);
  const [loadingResolved, setLoadingResolved] = useState(false);
  const [resolvedError, setResolvedError] = useState(null);
  const [hiddenComplaints, setHiddenComplaints] = useState(() => {
    const savedHiddenComplaints = localStorage.getItem('hiddenComplaints');
    return savedHiddenComplaints ? new Set(JSON.parse(savedHiddenComplaints)) : new Set();
  });

  useEffect(() => {
    localStorage.setItem('hiddenComplaints', JSON.stringify(Array.from(hiddenComplaints)));
  }, [hiddenComplaints]);

  useEffect(() => {
    document.body.classList.add('dark-mode');
  }, []);

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
    // Debug: Log filtered reports before chart data generation
    console.log('Filtered Reports for Charts:', filteredReports);

    const labels = filteredReports.map(report => 
      selectedBlock === 'all' ? 'All Blocks' : `Block ${report.blockNumber}`
    );

    const chartData = {
      labels,
      datasets: [
        {
          label: 'Total Escalated Complaints',
          data: filteredReports.map(report => report.totalComplaints),
          backgroundColor: 'rgba(54, 162, 235, 0.8)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        },
        {
          label: 'Resolved Complaints',
          data: filteredReports.map(report => report.resolvedComplaints),
          backgroundColor: 'rgba(75, 192, 192, 0.8)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        },
        {
          label: 'Pending (Escalated to Dean)',
          data: filteredReports.map(report => report.pendingComplaints),
          backgroundColor: 'rgba(255, 99, 132, 0.8)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }
      ]
    };

    // Debug: Log final chart data
    console.log('Chart Data:', chartData);

    return chartData;
  };

  const getDoughnutData = () => {
    const total = filteredReports.reduce((sum, report) => sum + report.totalComplaints, 0);
    const resolved = filteredReports.reduce((sum, report) => sum + report.resolvedComplaints, 0);
    const pending = filteredReports.reduce((sum, report) => sum + report.pendingComplaints, 0);

    // Debug: Log doughnut data calculations
    console.log('Doughnut Data Calculations:', { total, resolved, pending });

    return {
      labels: ['Resolved Complaints', 'Pending (Escalated to Dean)'],
      datasets: [
        {
          data: [resolved, pending],
          backgroundColor: [
            'rgba(75, 192, 192, 0.8)',
            'rgba(255, 99, 132, 0.8)'
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(255, 99, 132, 1)'
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

  const fetchEscalatedComplaints = async () => {
    setLoadingComplaints(true);
    setComplaintError(null);
    try {
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user'));
      const staffId = userData?.staffId || userData?.userId || userData?.id;

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

      // Debug: Log raw data
      console.log('Raw escalated complaints data:', data.data);

      // Set all complaints
      setComplaints(data.data);
      
      // Filter resolved complaints for the current dean (for the resolved list)
      const resolvedComplaints = data.data.filter(complaint => 
        complaint.status === 'resolved' && 
        complaint.resolvedBy === staffId
      );
      
      // Debug: Log resolved complaints
      console.log('Resolved complaints:', resolvedComplaints);

      // Group complaints by block for summary
      const blockStats = {};
      
      // First pass: Initialize block stats
      data.data.forEach(complaint => {
        const block = complaint.blockNumber;
        if (!blockStats[block]) {
          blockStats[block] = {
            total: 0,
            resolved: 0,
            pending: 0
          };
        }
      });

      // Second pass: Count complaints
      data.data.forEach(complaint => {
        const block = complaint.blockNumber;
        
        // Count total complaints
        blockStats[block].total++;

        // Debug: Log complaint status
        console.log(`Complaint ${complaint._id} in block ${block}:`, {
          status: complaint.status,
          resolvedBy: complaint.resolvedBy
        });

        // Count resolved complaints
        if (complaint.status === 'resolved') {
          blockStats[block].resolved++;
        }

        // Count pending complaints (escalated to dean)
        if (complaint.status === 'Escalated to dean') {
          blockStats[block].pending++;
        }
      });

      // Debug: Log block stats
      console.log('Block Statistics:', blockStats);

      // Convert block stats to array format for summary reports
      const summaryData = Object.entries(blockStats).map(([blockNumber, stats]) => {
        const report = {
          blockNumber,
          totalComplaints: stats.total,
          resolvedComplaints: stats.resolved,
          pendingComplaints: stats.pending
        };
        // Debug: Log each report
        console.log(`Report for block ${blockNumber}:`, report);
        return report;
      });

      // Debug: Log final summary data
      console.log('Final Summary Data:', summaryData);

      setSummaryReports(summaryData);
      setResolvedComplaints(resolvedComplaints);

      // Update available blocks
      const blockNumbers = data.data.map(complaint => {
        const block = String(complaint.blockNumber).trim();
        return block;
      }).filter(block => block !== '' && block !== undefined && block !== null);

      const uniqueBlocks = ['all', ...new Set(blockNumbers)].sort((a, b) => {
        if (a === 'all') return -1;
        if (b === 'all') return 1;
        return parseInt(a) - parseInt(b);
      });

      setAvailableBlocks(uniqueBlocks);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      setComplaintError(error.message);
    } finally {
      setLoadingComplaints(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'complaints' || activeTab === 'summaryReports') {
      fetchEscalatedComplaints();
    }
  }, [activeTab]);

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

  const handleClearComplaint = (complaintId) => {
    setHiddenComplaints(prev => {
      const newSet = new Set([...prev, complaintId]);
      localStorage.setItem('hiddenComplaints', JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  };

  const handleShowComplaint = (complaintId) => {
    setHiddenComplaints(prev => {
      const newSet = new Set(prev);
      newSet.delete(complaintId);
      localStorage.setItem('hiddenComplaints', JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  };

  const filteredComplaints = complaints.filter(complaint => !hiddenComplaints.has(complaint._id));

  const filteredReports = selectedBlock === 'all' 
    ? [{
        blockNumber: 'all',
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
                {filteredComplaints.map(complaint => (
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
                      {complaint.status.toLowerCase() === 'resolved' ? (
                        <button
                          className="dean-clear-btn"
                          onClick={() => handleClearComplaint(complaint._id)}
                        >
                          Clear
                        </button>
                      ) : (
                        <button
                          className="dean-resolve-btn"
                          onClick={() => handleResolveComplaint(complaint._id)}
                        >
                          Mark as Resolved
                        </button>
                      )}
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
            <div className="dean-section dean-summary-reports-section">
              <div className="dean-summary-reports-header">
                <h2>Summary Reports</h2>
                <div className="dean-block-filter">
                  <label htmlFor="blockSelect">Filter by Block:</label>
                  <select 
                    id="blockSelect"
                    value={selectedBlock}
                    onChange={handleBlockChange}
                    className="dean-block-select"
                  >
                    {availableBlocks.map(block => (
                      <option key={block} value={block}>
                        {block === 'all' ? 'All Blocks' : `Block ${block}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {loadingSummaryReports && <p className="dean-loading">Loading summary reports...</p>}
              {summaryReportsError && <p className="dean-error">Error: {summaryReportsError}</p>}

              {!loadingSummaryReports && !summaryReportsError && (
                <>
                  <div className="dean-charts-container">
                    <div className="chart-wrapper">
                      <Bar 
                        data={getChartData()} 
                        options={chartOptions}
                        ref={null}
                      />
                    </div>
                    <div className="chart-wrapper">
                      <Doughnut 
                        data={getDoughnutData()} 
                        options={doughnutOptions}
                        ref={null}
                      />
                    </div>
                  </div>

                  <div className="dean-summary-reports-container">
                    {filteredReports.length === 0 ? (
                      <p>No summary reports found for the selected block.</p>
                    ) : (
                      filteredReports.map(report => (
                        <div key={report.blockNumber} className="dean-summary-report-card">
                          <div className="dean-report-header">
                            <h3>{selectedBlock === 'all' ? 'Summary Report' : `Report from Block ${report.blockNumber}`}</h3>
                            <div className="dean-quick-stats">
                              <div className="dean-stat-item">
                                <span className="dean-stat-label">Total</span>
                                <span className="dean-stat-value">{report.totalComplaints}</span>
                              </div>
                              <div className="dean-stat-item">
                                <span className="dean-stat-label">Resolved</span>
                                <span className="dean-stat-value dean-resolved">{report.resolvedComplaints}</span>
                              </div>
                              <div className="dean-stat-item">
                                <span className="dean-stat-label">Pending</span>
                                <span className="dean-stat-value dean-pending">{report.pendingComplaints}</span>
                              </div>
                            </div>
                          </div>
                          <div className="dean-resolved-list">
                            <h4>Recently Resolved Complaints</h4>
                            {resolvedComplaints
                              .filter(c => c.blockNumber === report.blockNumber)
                              .slice(0, 5)
                              .map(complaint => (
                                <div key={complaint._id} className="dean-resolved-item">
                                  <span className="dean-complaint-type">{complaint.complaintType}</span>
                                  <span className="dean-resolved-date">
                                    {new Date(complaint.resolvedAt).toLocaleDateString()}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeanPage;