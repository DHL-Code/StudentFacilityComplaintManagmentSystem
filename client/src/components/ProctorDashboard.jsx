import React, { useState, useEffect } from 'react';
import ProctorNotificationBell from '../components/ProctorNotificationBell';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFlag, faCommentDots, faMoon, faSun, faBell, faSignOutAlt, faExpand, faTimes, faCheckCircle, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/ProctorDashboard.css';

function ProctorDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [notifications, setNotifications] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [report, setReport] = useState('');
  const [reportError, setReportError] = useState('');
  const [reportSuccess, setReportSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [proctorData, setProctorData] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [expandedImage, setExpandedImage] = useState(null);
  const [unreadComplaints, setUnreadComplaints] = useState([]);
  const [summaryStats, setSummaryStats] = useState({
    totalComplaints: 0,
    pending: 0,
    verified: 0,
    urgent: 0
  });
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showProfileUpdateModal, setShowProfileUpdateModal] = useState(false);
  const [profileUpdateMessage, setProfileUpdateMessage] = useState('');
  const [isUpdateSuccess, setIsUpdateSuccess] = useState(false);

  // Consolidated data fetching
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const userData = JSON.parse(localStorage.getItem('user'));

        if (!userData?.userId) {
          throw new Error('User data not found');
        }

        // Fetch proctor data first
        const proctorResponse = await fetch(
          `http://localhost:5000/api/admin/staff/${userData.userId}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );

        if (!proctorResponse.ok) throw new Error('Failed to fetch proctor data');

        const proctorData = await proctorResponse.json();
        const processedData = {
          name: proctorData.name || 'Not available',
          staffId: proctorData.staffId || 'Not available',
          email: proctorData.email || 'Not available',
          role: proctorData.role || 'Not available',
          phone: proctorData.phone || 'Not available',
          block: proctorData.block || 'Not assigned',
          createdAt: proctorData.createdAt || new Date().toISOString()
        };

        setProctorData(processedData);

        // Only fetch complaints if block is assigned
        if (processedData.block) {
          const complaintsResponse = await fetch(
            `http://localhost:5000/api/complaints?blockNumber=${processedData.block}&proctorId=${processedData.staffId}`,
            { headers: { 'Authorization': `Bearer ${token}` } }
          );

          if (!complaintsResponse.ok) {
            throw new Error(complaintsResponse.error || 'Failed to fetch complaints');
          }

          const complaintsData = await complaintsResponse.json();
          const transformedComplaints = complaintsData.map(complaint => ({
            ...complaint,
            isNew: !complaint.viewedByProctor
          }));

          setNotifications(transformedComplaints);
          updateUnreadCount(transformedComplaints);
          updateSummaryStats(transformedComplaints);
        }
      } catch (error) {
        console.error('Error:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch unread complaints
  useEffect(() => {
    const fetchUnreadComplaints = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/complaints/unread', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setUnreadComplaints(data);
        }
      } catch (error) {
        console.error('Error fetching unread complaints:', error);
      }
    };

    if (activeSection === 'notifications') {
      fetchUnreadComplaints();
    }
  }, [activeSection]);


  // Refresh complaints when switching to notifications tab
  useEffect(() => {
    if (activeSection === 'notifications' && proctorData?.block) {
      const fetchComplaints = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(
            `http://localhost:5000/api/complaints?blockNumber=${proctorData.block}&proctorId=${proctorData.staffId}`,
            { headers: { 'Authorization': `Bearer ${token}` } }
          );

          if (response.ok) {
            const data = await response.json();
            setNotifications(data);
            updateUnreadCount(data);
          }
        } catch (error) {
          console.error('Error fetching complaints:', error);
          setError('Failed to refresh complaints');
        }
      };

      fetchComplaints();
    }
  }, [activeSection, proctorData?.block, proctorData?.staffId]);

  const updateUnreadCount = (complaints) => {
    const newCount = complaints.filter(c => c.isNew).length;
    setUnreadCount(newCount);
  };

  const updateSummaryStats = (complaints) => {
    setSummaryStats({
      totalComplaints: complaints.length,
      pending: complaints.filter(c => c.status === 'pending').length,
      verified: complaints.filter(c => c.status === 'verified').length,
      urgent: complaints.filter(c => c.isUrgent).length
    });
  };

  const markComplaintAsViewed = async (complaintId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/complaints/${complaintId}/view-proctor`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setUnreadComplaints(prev =>
        prev.filter(complaint => complaint._id !== complaintId)
      );
    } catch (error) {
      console.error('Error marking complaint as viewed:', error);
    }
  };
  const handleViewComplaint = async (complaint) => {
    setSelectedComplaint(complaint);
    setShowComplaintModal(true);

    if (!complaint.viewedByProctor) {
      try {
        await markComplaintAsViewed(complaint._id, proctorData.staffId);

        setNotifications(prev =>
          prev.map(n =>
            n._id === complaint._id
              ? { ...n, viewedByProctor: true, isNew: false }
              : n
          )
        );
        setUnreadCount(prev => prev - 1);
      } catch (error) {
        console.error('Error marking complaint as viewed:', error);
      }
    }
  };


  const handleComplaintAction = async (action, id, currentValue) => {
    try {
      const token = localStorage.getItem('token');
      let endpoint, body;

      if (action === 'flag') {
        endpoint = `http://localhost:5000/api/complaints/${id}/flag`;
        body = JSON.stringify({ isUrgent: !currentValue });
      } else {
        endpoint = `http://localhost:5000/api/complaints/${id}/${action}`;
        body = null;
      }

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: body
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${action} complaint`);
      }

      const updatedComplaint = await response.json();

      // Update local state
      setNotifications(prev => prev.map(notification =>
        notification._id === id ? updatedComplaint : notification
      ));

      // Update selected complaint if it's the one being modified
      if (selectedComplaint?._id === id) {
        setSelectedComplaint(updatedComplaint);
      }
    } catch (error) {
      console.error(`Error ${action}ing complaint:`, error);
      setError(`Failed to ${action} complaint: ${error.message}`);
    }
  };
  const handleDeleteComplaint = async (complaintId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/complaints/${complaintId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );

      if (!response.ok) throw new Error('Failed to delete complaint');

      // Remove the deleted complaint from state
      setNotifications(prev => prev.filter(c => c._id !== complaintId));
      updateSummaryStats(notifications.filter(c => c._id !== complaintId));

      // Close modal if open
      if (selectedComplaint?._id === complaintId) {
        setSelectedComplaint(null);
      }
    } catch (error) {
      console.error('Error deleting complaint:', error);
      setError('Failed to delete complaint');
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-mode');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const handleExpandImage = (imageUrl) => {
    setExpandedImage(imageUrl);
  };

  const filteredComplaints = notifications.filter(complaint => {
    if (selectedFilter === 'pending') return complaint.status === 'pending';
    if (selectedFilter === 'verified') return complaint.status === 'verified';
    if (selectedFilter === 'urgent') return complaint.isUrgent;
    return true;
  });

  const handlePrintReport = () => {
    window.print();
  };

  const handleNavigation = (section) => {
    setActiveSection(section);
    setIsMobileNavOpen(false);
  };

  // Add this useEffect to handle navigation state
  useEffect(() => {
    if (location.state) {
      const { section, complaintId } = location.state;
      if (section) {
        setActiveSection(section);
        if (complaintId) {
          // Find and set the selected complaint
          const complaint = notifications.find(n => n._id === complaintId);
          if (complaint) {
            setSelectedComplaint(complaint);
            setShowComplaintModal(true);
          }
        }
      }
      // Clear the navigation state to prevent the modal from showing again on refresh
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, notifications, navigate, location.pathname]);

  // Update the close modal handler
  const handleCloseModal = () => {
    setSelectedComplaint(null);
    setShowComplaintModal(false);
  };

  const handleEditProfile = () => {
    setIsEditingProfile(true);
    setEditFormData({
      name: proctorData.name,
      email: proctorData.email,
      phone: proctorData.phone,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      // Validate passwords if they are being changed
      if (editFormData.newPassword || editFormData.confirmPassword) {
        if (editFormData.newPassword !== editFormData.confirmPassword) {
          throw new Error('New passwords do not match');
        }
        if (editFormData.newPassword.length < 6) {
          throw new Error('New password must be at least 6 characters long');
        }
        if (!editFormData.currentPassword) {
          throw new Error('Current password is required to change password');
        }
      }

      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/admin/staff/${proctorData.staffId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: editFormData.name,
            email: editFormData.email,
            phone: editFormData.phone,
            currentPassword: editFormData.currentPassword,
            newPassword: editFormData.newPassword
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const updatedData = await response.json();
      setProctorData(prev => ({
        ...prev,
        name: editFormData.name,
        email: editFormData.email,
        phone: editFormData.phone
      }));
      setIsEditingProfile(false);
      setError(null);
      
      // Show success modal
      setProfileUpdateMessage('Profile updated successfully!');
      setIsUpdateSuccess(true);
      setShowProfileUpdateModal(true);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Failed to update profile. Please try again.');
      
      // Show error modal
      setProfileUpdateMessage(error.message || 'Failed to update profile. Please try again.');
      setIsUpdateSuccess(false);
      setShowProfileUpdateModal(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setError(null);
  };

  const handleCloseProfileUpdateModal = () => {
    setShowProfileUpdateModal(false);
    setProfileUpdateMessage('');
  };

  const handleWriteReport = async () => {
    try {
      if (!report.trim()) {
        setReportError('Please write a report before submitting');
        return;
      }

      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user'));

      console.log('Submitting report with data:', {
        proctorId: userData.userId,
        proctorName: proctorData.name,
        block: proctorData.block,
        content: report
      });

      const response = await fetch('http://localhost:5000/api/proctor/submit-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          proctorId: userData.userId,
          proctorName: proctorData.name,
          block: proctorData.block,
          content: report
        })
      });

      console.log('Server response status:', response.status);
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error('Failed to submit report');
      }

      setReportSuccess('Report submitted successfully!');
      setReport('');
      setReportError('');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setReportSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error submitting report:', error);
      setReportError('Failed to submit report. Please try again.');
    }
  };

  return (
    <div className={`proctor-dashboard ${darkMode ? 'dark-mode' : ''}`}>
      <button className="proctor-mobile-nav-toggle" onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}>
        ☰
      </button>
      {/* Top Navigation Bar */}
      <div className="top-nav">
        <div className="nav-brand">
          <h1>Proctor Dashboard</h1>
          {proctorData?.block && <span className="block-badge">Block {proctorData.block}</span>}
        </div>
        <div className="nav-actions">
          <button className="dark-mode-toggle" onClick={toggleDarkMode}>
            <FontAwesomeIcon icon={darkMode ? faSun : faMoon} />
            {darkMode ? ' Light Mode' : ' Dark Mode'}
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            <FontAwesomeIcon icon={faSignOutAlt} /> Logout
          </button>
          {/* Replace NotificationBell with ProctorNotificationBell */}
          <ProctorNotificationBell userId={proctorData?.staffId} />
        </div>
      </div>

      <div className={`proctor-mobile-nav ${isMobileNavOpen ? 'active' : ''}`}>

        <button className="proctor-mobile-nav-item" onClick={() => handleNavigation('dashboard')}>
          Dashboard
        </button>
        <button className="proctor-mobile-nav-item" onClick={() => handleNavigation('notifications')}>
          Complaints
        </button>
        <button className="proctor-mobile-nav-item" onClick={() => handleNavigation('profile')}>
          My Profile
        </button>
        <button className="proctor-mobile-nav-item" onClick={() => handleNavigation('report')}>
          Write Report
        </button>
        <button className="proctor-mobile-nav-item" onClick={() => handleNavigation('summary-report')}>
          Summary Report
        </button>
        <button className="proctor-mobile-nav-item" onClick={toggleDarkMode}>
          <FontAwesomeIcon icon={darkMode ? faSun : faMoon} />
          {darkMode ? ' Light Mode' : ' Dark Mode'}
        </button>
        <button className="proctor-mobile-nav-item" onClick={handleLogout}>
          <FontAwesomeIcon icon={faSignOutAlt} /> Logout
        </button>
        {/* Replace NotificationBell with ProctorNotificationBell */}
        <ProctorNotificationBell userId={proctorData?.staffId} />
      </div>

      <div className="dashboard-container">
        {/* Sidebar Navigation */}
        <div className="sidebar">
          <div className="sidebar-menu">
            <button
              className={`menu-item ${activeSection === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveSection('dashboard')}
            >
              Dashboard Overview
            </button>
            <button
              className={`menu-item ${activeSection === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveSection('notifications')}
            >
              <span className="menu-item-content">
                Complaints
              </span>
            </button>
            <button
              className={`menu-item ${activeSection === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveSection('profile')}
            >
              My Profile
            </button>
            <button
              className={`menu-item ${activeSection === 'report' ? 'active' : ''}`}
              onClick={() => setActiveSection('report')}
            >
              Write Report
            </button>
            <button
              className={`menu-item ${activeSection === 'summary-report' ? 'active' : ''}`}
              onClick={() => setActiveSection('summary-report')}
            >
              Summary Report
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="main-content">
          {loading && <div className="loading-overlay">Loading...</div>}
          {error && <div className="error-message">{error}</div>}

          {/* Dashboard Overview */}
          {activeSection === 'dashboard' && (
            <div className="dashboard-overview">
              <h2>Welcome, {proctorData?.name || 'Proctor'}</h2>
              <p className="welcome-message">
                Manage student complaints and dormitory issues efficiently from your dashboard.
                Quickly access all the tools you need to verify, flag, and resolve complaints.
              </p>

              <div className="stats-cards">
                <div className="stat-card total">
                  <h3>Total Complaints</h3>
                  <p>{summaryStats.totalComplaints}</p>
                </div>
                <div className="stat-card pending">
                  <h3>Pending</h3>
                  <p>{summaryStats.pending}</p>
                </div>
                <div className="stat-card verified">
                  <h3>Verified</h3>
                  <p>{summaryStats.verified}</p>
                </div>
                <div className="stat-card urgent">
                  <h3>Urgent</h3>
                  <p>{summaryStats.urgent}</p>
                </div>
              </div>

              <div className="quick-actions">
                <h3>Quick Actions</h3>
                <div className="action-buttons">
                  <button
                    className="action-btn view-complaints"
                    onClick={() => setActiveSection('notifications')}
                  >
                    <FontAwesomeIcon icon={faBell} /> View Complaints
                  </button>
                  <button
                    className="action-btn write-report"
                    onClick={() => setActiveSection('report')}
                  >
                    <FontAwesomeIcon icon={faCommentDots} /> Write Report
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Complaints Section */}
          {activeSection === 'notifications' && (
            <div className="complaints-section">
              <div className="section-header">
                <h2>Student Complaints</h2>
                <div className="complaint-filters">
                  <button
                    className={`filter-btn ${selectedFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setSelectedFilter('all')}
                  >
                    All ({notifications.length})
                  </button>
                  <button
                    className={`filter-btn ${selectedFilter === 'pending' ? 'active' : ''}`}
                    onClick={() => setSelectedFilter('pending')}
                  >
                    Pending ({summaryStats.pending})
                  </button>
                  <button
                    className={`filter-btn ${selectedFilter === 'verified' ? 'active' : ''}`}
                    onClick={() => setSelectedFilter('verified')}
                  >
                    Verified ({summaryStats.verified})
                  </button>
                  <button
                    className={`filter-btn ${selectedFilter === 'urgent' ? 'active' : ''}`}
                    onClick={() => setSelectedFilter('urgent')}
                  >
                    Urgent ({summaryStats.urgent})
                  </button>
                </div>
              </div>

              <div className="complaints-list">
                {filteredComplaints.length === 0 ? (
                  <div className="no-complaints">
                    <p>No complaints found matching the current filter</p>
                  </div>
                ) : (
                  <div className="proctor-complaints-container">
                    <div className="proctor-complaints-grid">
                      {filteredComplaints.map((complaint) => (
                        <div
                          key={complaint._id}
                          className={`proctor-complaint-card ${complaint.isUrgent ? 'urgent' : ''} ${complaint.isNew ? 'unread' : ''}`}
                          onClick={() => {
                            handleViewComplaint(complaint);
                            // Immediately mark as read when clicked
                            if (complaint.isNew) {
                              const updated = notifications.map(n =>
                                n._id === complaint._id ? { ...n, isNew: false } : n
                              );
                              setNotifications(updated);
                              updateUnreadCount(updated);
                            }
                          }}
                        >

                          <div className="complaint-header">
                            <div className="complaint-meta">
                              <span className={`status-badge ${complaint.status}`}>
                                {complaint.status}
                              </span>
                              {complaint.isUrgent && (
                                <span className="urgent-badge">
                                  <FontAwesomeIcon icon={faFlag} /> Urgent
                                </span>
                              )}
                              {complaint.isNew && (
                                <div className="unread-indicator">
                                  <span className="notification-badge">New</span>
                                </div>
                              )}
                            </div>
                            <span className="complaint-date">
                              {new Date(complaint.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="complaint-body">
                            <h3 className="complaint-title">{complaint.complaintType}: {complaint.specificInfo}</h3>
                            <p className="complaint-description">{complaint.description}</p>

                            <div className="complaint-details">
                              <p><strong>Student ID:</strong> {complaint.userId}</p>
                              <p><strong>Dorm Number:</strong> {complaint.dormNumber}</p>
                            </div>

                            {complaint.file && (
                              <div className="complaint-image-container">
                                <img
                                  src={`http://localhost:5000/${complaint.file}`}
                                  alt="Complaint evidence"
                                  className="complaint-image"
                                  onClick={() => handleExpandImage(`http://localhost:5000/${complaint.file}`)}
                                />
                                <button
                                  className="expand-image-btn"
                                  onClick={() => handleExpandImage(`http://localhost:5000/${complaint.file}`)}
                                >
                                  <FontAwesomeIcon icon={faExpand} />
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="complaint-actions">
                            <button
                              className={`action-btn verify ${complaint.status === 'verified' ? 'verified' : ''}`}
                              onClick={() => handleComplaintAction('verify', complaint._id)}
                              disabled={complaint.status === 'verified'}
                            >
                              {complaint.status === 'verified' ? 'Verified' : 'Verify'}
                            </button>
                            <button
                              className={`action-btn dismiss ${complaint.status === 'dismissed' ? 'dismissed' : ''}`}
                              onClick={() => handleComplaintAction('dismiss', complaint._id)}
                              disabled={complaint.status === 'dismissed'}
                            >
                              {complaint.status === 'dismissed' ? 'Dismissed' : 'Dismiss'}
                            </button>
                            <button
                              className={`action-btn flag ${complaint.isUrgent ? 'flagged' : ''}`}
                              onClick={() => handleComplaintAction('flag', complaint._id, complaint.isUrgent)}
                            >
                              <FontAwesomeIcon icon={faFlag} /> {complaint.isUrgent ? 'Unflag' : 'Flag Urgent'}
                            </button>
                            <button
                              className="action-btn delete"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteComplaint(complaint._id);
                              }}
                            >
                              Delete
                            </button>
                            <button
                              className="action-btn view"
                              onClick={() => handleViewComplaint(complaint)}
                            >
                              View Details
                            </button>

                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Profile Section */}
          {activeSection === 'profile' && proctorData && (
            <div className="profile-section">
              <h2>My Profile</h2>
              {isEditingProfile ? (
                <div className="edit-profile-form">
                  <div className="form-group">
                    <label htmlFor="name">Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={editFormData.name}
                      onChange={handleEditFormChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={editFormData.email}
                      onChange={handleEditFormChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">Phone</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={editFormData.phone}
                      onChange={handleEditFormChange}
                    />
                  </div>
                  
                  <div className="password-change-section">
                    <h3>Change Password</h3>
                    <div className="form-group">
                      <label htmlFor="currentPassword">Current Password</label>
                      <input
                        type="password"
                        id="currentPassword"
                        name="currentPassword"
                        value={editFormData.currentPassword}
                        onChange={handleEditFormChange}
                        placeholder="Enter current password"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="newPassword">New Password</label>
                      <input
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        value={editFormData.newPassword}
                        onChange={handleEditFormChange}
                        placeholder="Enter new password"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="confirmPassword">Confirm New Password</label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={editFormData.confirmPassword}
                        onChange={handleEditFormChange}
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>

                  {error && <div className="error-message">{error}</div>}
                  <div className="form-actions">
                    <button className="save-btn" onClick={handleSaveProfile}>Save Changes</button>
                    <button className="cancel-btn" onClick={handleCancelEdit}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="profile-card">
                  <div className="profile-header">
                    <div className="avatar">
                      {proctorData.name.charAt(0)}
                    </div>
                    <div className="profile-info">
                      <h3>{proctorData.name}</h3>
                      <p className="role">{proctorData.role}</p>
                      <p className="staff-id">ID: {proctorData.staffId}</p>
                    </div>
                  </div>

                  <div className="profile-details">
                    <div className="detail-group">
                      <h4>Contact Information</h4>
                      <div className="detail-item">
                        <span className="detail-label">Email:</span>
                        <span className="detail-value">{proctorData.email}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Phone:</span>
                        <span className="detail-value">{proctorData.phone}</span>
                      </div>
                    </div>

                    <div className="detail-group">
                      <h4>Assignment</h4>
                      <div className="detail-item">
                        <span className="detail-label">Block:</span>
                        <span className="detail-value">{proctorData.block}</span>
                      </div>
                    </div>

                    <div className="detail-group">
                      <h4>Account</h4>
                      <div className="detail-item">
                        <span className="detail-label">Member Since:</span>
                        <span className="detail-value">
                          {new Date(proctorData.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="profile-actions">
                    <button className="edit-btn" onClick={handleEditProfile}>
                      Edit Profile
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Write Report Section */}
          {activeSection === 'report' && (
            <div className="report-section">
              <h2>Write Incident Report</h2>
              <div className="report-form">
                <textarea
                  value={report}
                  onChange={(e) => setReport(e.target.value)}
                  placeholder="Describe the incident in detail..."
                  className="report-textarea"
                />
                {reportError && <div className="error-message">{reportError}</div>}
                {reportSuccess && <div className="success-message">{reportSuccess}</div>}
                <div className="form-actions">
                  <button className="submit-btn" onClick={handleWriteReport}>
                    Submit Report
                  </button>
                  <button className="cancel-btn" onClick={() => {
                    setReport('');
                    setReportError('');
                    setReportSuccess('');
                  }}>
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Summary Report Section */}
          {activeSection === 'summary-report' && (
            <div className="summary-report-section">
              <h2>Block {proctorData?.block} Summary Report</h2>

              <div className="report-period">
                <h3>Report Period: {new Date().toLocaleDateString()}</h3>
              </div>

              <div className="summary-stats">
                <div className="stat-card">
                  <h4>Total Complaints</h4>
                  <p className="stat-value">{summaryStats.totalComplaints}</p>
                </div>
                <div className="stat-card">
                  <h4>Pending Resolution</h4>
                  <p className="stat-value">{summaryStats.pending}</p>
                </div>
                <div className="stat-card">
                  <h4>Verified Issues</h4>
                  <p className="stat-value">{summaryStats.verified}</p>
                </div>
                <div className="stat-card">
                  <h4>Urgent Matters</h4>
                  <p className="stat-value">{summaryStats.urgent}</p>
                </div>
              </div>

              <div className="complaints-breakdown">
                <h3>Complaints Breakdown</h3>
                <div className="breakdown-chart">
                  {/* This would be replaced with an actual chart component */}
                  <div className="chart-placeholder">
                    <p>Visual chart would display here</p>
                    <div className="chart-bars">
                      <div className="bar pending" style={{ height: `${(summaryStats.pending / summaryStats.totalComplaints) * 100}%` }}></div>
                      <div className="bar verified" style={{ height: `${(summaryStats.verified / summaryStats.totalComplaints) * 100}%` }}></div>
                      <div className="bar urgent" style={{ height: `${(summaryStats.urgent / summaryStats.totalComplaints) * 100}%` }}></div>
                    </div>
                    <div className="chart-labels">
                      <span>Pending</span>
                      <span>Verified</span>
                      <span>Urgent</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="notable-issues">
                <h3>Notable Issues</h3>
                {notifications.filter(c => c.isUrgent || c.status === 'verified').length > 0 ? (
                  <ul className="issues-list">
                    {notifications
                      .filter(c => c.isUrgent || c.status === 'verified')
                      .map(complaint => (
                        <li key={complaint._id} className="issue-item">
                          <span className="issue-type">{complaint.complaintType}</span>
                          <span className="issue-desc">{complaint.specificInfo}</span>
                          <span className={`issue-status ${complaint.isUrgent ? 'urgent' : ''}`}>
                            {complaint.isUrgent ? 'Urgent' : 'Verified'}
                          </span>
                        </li>
                      ))
                    }
                  </ul>
                ) : (
                  <p className="no-issues">No notable issues to report</p>
                )}
              </div>

              <div className="report-actions">
                <button className="print-btn" onClick={handlePrintReport}>Print Report</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Complaint Detail Modal */}
      {showComplaintModal && selectedComplaint && (
        <div className="complaint-modal">
          <div className="modal-content">
            <button className="close-modal" onClick={handleCloseModal}>
              <FontAwesomeIcon icon={faTimes} />
            </button>

            <h2>Complaint Details</h2>

            <div className="complaint-meta">
              <span className={`status-badge ${selectedComplaint.status}`}>
                {selectedComplaint.status}
              </span>
              {selectedComplaint.isUrgent && (
                <span className="urgent-badge">
                  <FontAwesomeIcon icon={faFlag} /> Urgent
                </span>
              )}
              <span className="complaint-date">
                {new Date(selectedComplaint.createdAt).toLocaleString()}
              </span>
            </div>

            <h3 className="complaint-title">{selectedComplaint.complaintType}: {selectedComplaint.specificInfo}</h3>

            <div className="complaint-detail-item">
              <h4>Student Information</h4>
              <p><strong>Student ID:</strong> {selectedComplaint.userId}</p>
              <p><strong>Dorm Number:</strong> {selectedComplaint.dormNumber}</p>
            </div>

            <div className="complaint-detail-item">
              <h4>Description</h4>
              <p>{selectedComplaint.description}</p>
            </div>

            {selectedComplaint.file && (
              <div className="complaint-detail-item">
                <h4>Evidence</h4>
                <div className="complaint-image-container">
                  <img
                    src={`http://localhost:5000/${selectedComplaint.file}`}
                    alt="Complaint evidence"
                    className="complaint-image"
                    onClick={() => handleExpandImage(`http://localhost:5000/${selectedComplaint.file}`)}
                  />
                  <button
                    className="expand-image-btn"
                    onClick={() => handleExpandImage(`http://localhost:5000/${selectedComplaint.file}`)}
                  >
                    <FontAwesomeIcon icon={faExpand} /> Expand
                  </button>
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button
                className={`action-btn verify ${selectedComplaint.status === 'verified' ? 'verified' : ''}`}
                onClick={() => {
                  handleComplaintAction('verify', selectedComplaint._id);
                  handleCloseModal();
                }}
                disabled={selectedComplaint.status === 'verified'}
              >
                {selectedComplaint.status === 'verified' ? 'Verified' : 'Verify'}
              </button>
              <button
                className={`action-btn dismiss ${selectedComplaint.status === 'dismissed' ? 'dismissed' : ''}`}
                onClick={() => {
                  handleComplaintAction('dismiss', selectedComplaint._id);
                  handleCloseModal();
                }}
                disabled={selectedComplaint.status === 'dismissed'}
              >
                {selectedComplaint.status === 'dismissed' ? 'Dismissed' : 'Dismiss'}
              </button>
              <button
                className={`action-btn flag ${selectedComplaint.isUrgent ? 'flagged' : ''}`}
                onClick={() => {
                  handleComplaintAction('flag', selectedComplaint._id, selectedComplaint.isUrgent);
                  handleCloseModal();
                }}
              >
                <FontAwesomeIcon icon={faFlag} /> {selectedComplaint.isUrgent ? 'Unflag' : 'Flag Urgent'}
              </button>
              <button
                className="action-btn delete"
                onClick={() => {
                  handleDeleteComplaint(selectedComplaint._id);
                  handleCloseModal();
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Image Modal */}
      {expandedImage && (
        <div className="image-modal" onClick={() => setExpandedImage(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setExpandedImage(null)}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <img src={expandedImage} alt="Expanded view" className="expanded-image" />
          </div>
        </div>
      )}
      {unreadComplaints.length > 0 && (
        <div className="notification-banner">
          <h3>New Complaints ({unreadComplaints.length})</h3>
          {unreadComplaints.map(complaint => (
            <div
              key={complaint._id}
              className="notification-item"
              onClick={() => {
                handleViewComplaint(complaint);
                markComplaintAsViewed(complaint._id);
              }}
            >
              <p>{complaint.complaintType}: {complaint.specificInfo}</p>
              <span className="notification-time">
                {new Date(complaint.createdAt).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Profile Update Modal */}
      {showProfileUpdateModal && (
        <div className="profile-update-modal">
          <div className="modal-content">
            <button className="close-modal" onClick={handleCloseProfileUpdateModal}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <div className={`modal-icon ${isUpdateSuccess ? 'success' : 'error'}`}>
              {isUpdateSuccess ? (
                <FontAwesomeIcon icon={faCheckCircle} />
              ) : (
                <FontAwesomeIcon icon={faExclamationCircle} />
              )}
            </div>
            <h2>{isUpdateSuccess ? 'Success' : 'Error'}</h2>
            <p>{profileUpdateMessage}</p>
            <div className="modal-actions">
              <button 
                className={`modal-btn ${isUpdateSuccess ? 'success' : 'error'}`}
                onClick={handleCloseProfileUpdateModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default ProctorDashboard;