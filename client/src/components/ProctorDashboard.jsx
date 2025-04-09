import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFlag, faCommentDots, faMoon, faSun, faBell, faSignOutAlt, faExpand, faTimes } from '@fortawesome/free-solid-svg-icons';
import '../styles/ProctorDashboard.css';

function ProctorDashboard() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [notifications, setNotifications] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  // Update your state and functions
  const [viewedComplaints, setViewedComplaints] = useState([]);
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [proctorData, setProctorData] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [expandedImage, setExpandedImage] = useState(null);
  const [summaryStats, setSummaryStats] = useState({
    totalComplaints: 0,
    pending: 0,
    verified: 0,
    urgent: 0
  });

  const markComplaintAsViewed = async (complaintId, proctorId) => {
    try {
      // Validate IDs
      if (!complaintId || !proctorId) {
        throw new Error('Invalid complaintId or proctorId');
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token missing');
      }

      const response = await fetch(
        `http://localhost:5000/api/complaints/${complaintId}/view`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            proctorId: proctorId.toString()
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to mark complaint as viewed');
      }

      return await response.json();
    } catch (error) {
      console.error('Error in markComplaintAsViewed:', {
        error: error.message,
        complaintId,
        proctorId,
        time: new Date().toISOString()
      });
      throw error;
    }
  };

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-mode');
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // Fetch proctor data and complaints
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const userData = JSON.parse(localStorage.getItem('user'));

        if (!userData?.userId) {
          throw new Error('User data not found');
        }

        // Fetch proctor data
        const proctorResponse = await fetch(`http://localhost:5000/api/admin/staff/${userData.userId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!proctorResponse.ok) throw new Error('Failed to fetch proctor data');
        const proctorData = await proctorResponse.json();

        // Process proctor data
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

        // Fetch complaints with both parameters
        const complaintsResponse = await fetch(
          `http://localhost:5000/api/complaints?blockNumber=${processedData.block}&proctorId=${processedData.staffId}`,
          {
            headers: { 'Authorization': `Bearer ${token}` },
          }
        );

        if (!complaintsResponse.ok) {
          const errorData = await complaintsResponse.json();
          throw new Error(errorData.error || 'Failed to fetch complaints');
        }

        const complaintsData = await complaintsResponse.json();

        const transformedComplaints = complaintsData.map(complaint => ({
          ...complaint,
          isNew: !complaint.viewedByProctor
        }));

        setNotifications(transformedComplaints);
        updateUnreadCount(transformedComplaints);
        updateSummaryStats(transformedComplaints);

      } catch (error) {
        console.error('Error:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /* Update unread count function */
  const updateUnreadCount = (complaints) => {
    const newCount = complaints.filter(c => c.isNew).length;
    setUnreadCount(newCount);
  };

  //summary statistics
  const updateSummaryStats = (complaints) => {
    setSummaryStats({
      totalComplaints: complaints.length,
      pending: complaints.filter(c => c.status === 'pending').length,
      verified: complaints.filter(c => c.status === 'verified').length,
      urgent: complaints.filter(c => c.isUrgent).length
    });
  };

  // Handle viewing a complaint (marks it as read)
  const handleViewComplaint = async (complaint) => {
    setSelectedComplaint(complaint);

    // Check if we have all required data before proceeding
    if (!complaint?._id || !proctorData?.staffId) {
      console.error('Missing required data:', {
        complaintId: complaint?._id,
        proctorId: proctorData?.staffId
      });
      return;
    }

    if (complaint.isNew) {
      try {
        console.log('Marking complaint as viewed:', {
          complaintId: complaint._id,
          proctorId: proctorData.staffId
        });

        const updatedComplaint = await markComplaintAsViewed(
          complaint._id,
          proctorData.staffId
        );

        // Update local state only if the API call succeeded
        const updatedNotifications = notifications.map(n =>
          n._id === complaint._id
            ? {
              ...n,
              isNew: false,
              viewedByProctor: true,
              viewedBy: updatedComplaint.viewedBy
            }
            : n
        );

        setNotifications(updatedNotifications);
        updateUnreadCount(updatedNotifications);

      } catch (error) {
        console.error('Error marking complaint as viewed:', {
          error: error.message,
          complaint: complaint._id,
          proctor: proctorData?.staffId,
          stack: error.stack
        });
        setError(`Failed to update status: ${error.message}`);
      }
    }
  };
  // useEffect to load viewed complaints
  useEffect(() => {
    if (proctorData?.staffId) {
      const viewed = JSON.parse(localStorage.getItem(`viewed_${proctorData.staffId}`)) || [];
      setViewedComplaints(viewed);

      // Mark complaints as viewed on load
      const updatedNotifications = notifications.map(complaint => ({
        ...complaint,
        isNew: !viewed.includes(complaint._id)
      }));
      setNotifications(updatedNotifications);
      updateUnreadCount(updatedNotifications);
    }
  }, [proctorData?.staffId]);

  // Handle complaint actions (verify, dismiss, flag)
  const handleComplaintAction = async (action, id, currentValue) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = `http://localhost:5000/api/complaints/${id}/${action}`;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) throw new Error(`Failed to ${action} complaint`);

      // Update local state
      const updatedNotifications = notifications.map(notification => {
        if (notification._id === id) {
          if (action === 'verify') return { ...notification, status: 'verified' };
          if (action === 'dismiss') return { ...notification, status: 'dismissed' };
          if (action === 'flag') return { ...notification, isUrgent: !currentValue };
          return notification;
        }
        return notification;
      });

      setNotifications(updatedNotifications);
      updateSummaryStats(updatedNotifications);

    } catch (error) {
      console.error(`Error ${action}ing complaint:`, error);
      setError(`Failed to ${action} complaint`);
    }
  };

  // Handle image expansion
  const handleExpandImage = (imageUrl) => {
    setExpandedImage(imageUrl);
  };

  // Update the complaints filtering
  const filteredComplaints = notifications.filter(complaint => {
    if (selectedFilter === 'pending') return complaint.status === 'pending';
    if (selectedFilter === 'verified') return complaint.status === 'verified';
    if (selectedFilter === 'urgent') return complaint.isUrgent;
    return true; // all complaints
  });

  // Print report handler
  const handlePrintReport = () => {
    window.print();
  };

  const handleNavigation = (section) => {
    setActiveSection(section);
    setIsMobileNavOpen(false); // Close mobile nav when a link is clicked
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
        </div>
      </div>

      <div className={`proctor-mobile-nav ${isMobileNavOpen ? 'active' : ''}`}>

        <button className="proctor-mobile-nav-item" onClick={() => handleNavigation('dashboard')}>
          Dashboard
        </button>
        <button className="proctor-mobile-nav-item" onClick={() => handleNavigation('notifications')}>
          Complaints {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
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
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
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
              </div>
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
                <div className="form-actions">
                  <button className="submit-btn" onClick={() => handleWriteReport()}>
                    Submit Report
                  </button>
                  <button className="cancel-btn" onClick={() => setReport('')}>
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
      {selectedComplaint && (
        <div className="complaint-modal">
          <div className="modal-content">
            <button className="close-modal" onClick={() => setSelectedComplaint(null)}>
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
                  setSelectedComplaint(null);
                }}
                disabled={selectedComplaint.status === 'verified'}
              >
                {selectedComplaint.status === 'verified' ? 'Verified' : 'Verify'}
              </button>
              <button
                className={`action-btn dismiss ${selectedComplaint.status === 'dismissed' ? 'dismissed' : ''}`}
                onClick={() => {
                  handleComplaintAction('dismiss', selectedComplaint._id);
                  setSelectedComplaint(null);
                }}
                disabled={selectedComplaint.status === 'dismissed'}
              >
                {selectedComplaint.status === 'dismissed' ? 'Dismissed' : 'Dismiss'}
              </button>
              <button
                className={`action-btn flag ${selectedComplaint.isUrgent ? 'flagged' : ''}`}
                onClick={() => {
                  handleComplaintAction('flag', selectedComplaint._id, selectedComplaint.isUrgent);
                  setSelectedComplaint(null);
                }}
              >
                <FontAwesomeIcon icon={faFlag} /> {selectedComplaint.isUrgent ? 'Unflag' : 'Flag Urgent'}
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
    </div>
  );
}

export default ProctorDashboard;