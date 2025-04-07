import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFlag, faCommentDots, faTimes, faExpand, faBell } from '@fortawesome/free-solid-svg-icons';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import '../styles/ProctorDashboard.css';

function ProctorDashboard() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isNavActive, setIsNavActive] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [report, setReport] = useState('');
  const [proctorId, setProctorId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [proctorData, setProctorData] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [abortController, setAbortController] = useState(null);
  const [expandedImage, setExpandedImage] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setAbortController(controller);
    return () => controller.abort();
  }, []);

  const handleNavigation = (section) => {
    setActiveSection(section);
    setIsNavActive(false);
    if (section === 'notifications') {
      setUnreadCount(0); // Reset unread count when viewing notifications
    }
  };

  const toggleNav = () => {
    setIsNavActive(!isNavActive);
  };

  const handleVerify = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/complaints/${id}/verify`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: abortController?.signal
      });

      if (!response.ok) throw new Error('Failed to verify complaint');

      setNotifications(notifications.map(notification =>
        notification._id === id ? { ...notification, status: 'verified' } : notification
      ));
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error verifying complaint:', error);
        setError('Failed to verify complaint');
      }
    }
  };

  const handleDismiss = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/complaints/${id}/dismiss`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: abortController?.signal
      });

      if (!response.ok) throw new Error('Failed to dismiss complaint');

      setNotifications(notifications.filter(notification => notification._id !== id));
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error dismissing complaint:', error);
        setError('Failed to dismiss complaint');
      }
    }
  };

  const handleFlagUrgent = async (id, isUrgent) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/complaints/${id}/flag`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: abortController?.signal
      });

      if (!response.ok) throw new Error('Failed to flag complaint as urgent');

      setNotifications(notifications.map(notification =>
        notification._id === id ? { ...notification, isUrgent: !isUrgent } : notification
      ));
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error flagging complaint:', error);
        setError('Failed to flag complaint as urgent');
      }
    }
  };

  const handleWriteReport = () => {
    console.log('Report submitted:', report);
    setReport('');
  };

  const handleViewComplaint = (complaint) => {
    setSelectedComplaint(complaint);
  };

  const handleExpandImage = (imageUrl) => {
    setExpandedImage(imageUrl);
  };

  const fetchProctorData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found. Please log in.');

      const userData = JSON.parse(localStorage.getItem('user'));
      if (!userData?.userId) throw new Error('No user data found. Please log in again.');

      const response = await fetch(`http://localhost:5000/api/admin/staff/${userData.userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: abortController?.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Failed to fetch proctor data. Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Fetched proctor data:', data);

      if (!data) throw new Error('No data received from server');

      let profilePhotoUrl = null;
      if (data.profilePhoto) {
        const filename = data.profilePhoto.split('\\').pop();
        profilePhotoUrl = `http://localhost:5000/uploads/staff-photos/${filename}`;
      }

      const proctorInfo = {
        name: data.name || 'Not available',
        staffId: data.staffId || 'Not available',
        email: data.email || 'Not available',
        role: data.role || 'Not available',
        phone: data.phone || 'Not available',
        profilePhoto: profilePhotoUrl,
        block: data.block || 'Not available',
        createdAt: data.createdAt || new Date().toISOString()
      };

      setProctorData(proctorInfo);
      await fetchComplaints(proctorInfo.block);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching proctor data:', err);
        setError(err.message || 'Failed to fetch proctor data');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchComplaints = async (blockNumber) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/complaints?blockNumber=${blockNumber}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: abortController?.signal
      });

      if (!response.ok) throw new Error('Failed to fetch complaints');

      const data = await response.json();
      const transformedComplaints = data.map(complaint => ({
        _id: complaint._id,
        title: `${complaint.complaintType}: ${complaint.specificInfo}`,
        description: complaint.description,
        isUrgent: complaint.isUrgent || false,
        status: complaint.status || 'pending',
        feedback: complaint.feedback || '',
        file: complaint.file,
        dormNumber: complaint.dormNumber,
        userId: complaint.userId,
        createdAt: complaint.createdAt,
        isRead: false // Add read status
      }));

      // Count unread notifications
      const newUnreadCount = transformedComplaints.filter(c => !c.isRead).length;
      setUnreadCount(newUnreadCount);

      setNotifications(transformedComplaints);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching complaints:', error);
        setError('Failed to fetch complaints');
      }
    }
  };

  const markAsRead = (id) => {
    setNotifications(notifications.map(notification =>
      notification._id === id ? { ...notification, isRead: true } : notification
    ));
    setUnreadCount(prev => prev > 0 ? prev - 1 : 0); // Add this line
  };

  useEffect(() => {
    fetchProctorData();
  }, []);

  return (
    <div className="proctor-dashboard">
      <div className="sidebar">
        <h1>Proctor Dashboard</h1>
        <ul>
          <li onClick={() => handleNavigation('notifications')}>
            Notifications {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </li>
          <li onClick={() => handleNavigation('profile')}>Profile</li>
          <li onClick={() => handleNavigation('report')}>Write Report</li>
          <li onClick={() => handleNavigation('summary-report')}>Summary Report</li>
        </ul>
      </div>

      <div className="content">
        <div className="main-content">
          {activeSection === 'notifications' && (
            <div className="notifications-page">
              <div className="block-indicator">
                <h1>Block {proctorData?.block || 'Not Assigned'}</h1>
                {notifications.length > 0 && (
                  <div className="complaint-indicator">
                    <span className="indicator-dot"></span>
                    <span>Active Complaints: {notifications.length}</span>
                  </div>
                )}
              </div>

              <div className="notifications-container">
                <h2>Complaints</h2>
                {notifications.length === 0 ? (
                  <div className="no-complaints">
                    <p>No complaints found for your block.</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`notification-item ${notification.isUrgent ? 'urgent' : ''} ${!notification.isRead ? 'unread' : ''}`}
                      onClick={() => markAsRead(notification._id)}
                    >
                      <div className="notification-header">
                        <h3>{notification.title}</h3>
                        <div className="notification-status">
                          <span className={`status-badge ${notification.status || 'pending'}`}>
                            {notification.status || 'Pending'}
                          </span>
                          {notification.isUrgent && (
                            <span className="status-badge urgent">
                              <FontAwesomeIcon icon={faFlag} /> Urgent
                            </span>
                          )}
                          <span className="notification-time">
                            {new Date(notification.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="notification-details">
                        <p><strong>Student ID:</strong> {notification.userId}</p>
                        <p><strong>Dorm Number:</strong> {notification.dormNumber}</p>
                        <p><strong>Description:</strong> {notification.description}</p>
                        {notification.file && (
                          <div className="complaint-photo-container">
                            <div className="complaint-photo">
                              <img
                                src={`http://localhost:5000/${notification.file}`}
                                alt="Complaint evidence"
                                className="complaint-image"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleExpandImage(`http://localhost:5000/${notification.file}`);
                                }}
                              />
                              <button
                                className="expand-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleExpandImage(`http://localhost:5000/${notification.file}`);
                                }}
                              >
                                <FontAwesomeIcon icon={faExpand} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="notification-actions">
                        <button
                          className={`btn verify-btn ${notification.status === 'verified' ? 'verified' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVerify(notification._id);
                          }}
                          disabled={notification.status === 'verified'}
                        >
                          {notification.status === 'verified' ? 'Verified' : 'Verify'}
                        </button>
                        <button
                          className={`btn dismiss-btn ${notification.status === 'dismissed' ? 'dismissed' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDismiss(notification._id);
                          }}
                          disabled={notification.status === 'dismissed'}
                        >
                          {notification.status === 'dismissed' ? 'Dismissed' : 'Dismiss'}
                        </button>
                        <button
                          className={`btn flag-btn ${notification.isUrgent ? 'flagged' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFlagUrgent(notification._id, notification.isUrgent);
                          }}
                        >
                          <FontAwesomeIcon icon={faFlag} /> {notification.isUrgent ? 'Unflag' : 'Flag Urgent'}
                        </button>
                        <button
                          className="btn view-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewComplaint(notification);
                          }}
                        >
                          <FontAwesomeIcon icon={faCommentDots} /> View Complaint
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeSection === 'profile' && (
            <div className="profile-panel">
              <h2>Proctor Profile</h2>
              {loading ? (
                <p>Loading profile data...</p>
              ) : error ? (
                <p className="error-message">{error}</p>
              ) : proctorData ? (
                <div className="profile-container">
                  <div className="profile-header">
                    <div className="photo-upload">
                      <div className="profile-preview">
                        {proctorData.profilePhoto ? (
                          <img
                            src={proctorData.profilePhoto}
                            alt="Profile"
                            onError={(e) => {
                              console.log('Error loading profile photo');
                              e.target.style.display = 'none';
                              const placeholder = e.target.parentElement.querySelector('.upload-placeholder');
                              if (placeholder) {
                                placeholder.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div className="upload-placeholder" style={{ display: proctorData.profilePhoto ? 'none' : 'flex' }}>
                          <span>+</span>
                          <p>No Photo</p>
                        </div>
                      </div>
                    </div>
                    <div className="profile-info">
                      <h3 className="full-name">{proctorData.name}</h3>
                      <p className="user-id">ID: {proctorData.staffId}</p>
                      <p className="role">{proctorData.role}</p>
                    </div>
                  </div>

                  <div className="profile-details">
                    <div className="detail-section">
                      <h4>Contact Information</h4>
                      <div className="detail-item">
                        <span className="detail-label">Email:</span>
                        <span className="detail-value">{proctorData.email}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Phone Number:</span>
                        <span className="detail-value">{proctorData.phone}</span>
                      </div>
                    </div>

                    <div className="detail-section">
                      <h4>Assignment Information</h4>
                      <div className="detail-item">
                        <span className="detail-label">Block:</span>
                        <span className="detail-value">{proctorData.block}</span>
                      </div>
                    </div>

                    <div className="detail-section">
                      <h4>Account Information</h4>
                      <div className="detail-item">
                        <span className="detail-label">Account Created:</span>
                        <span className="detail-value">
                          {new Date(proctorData.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p>No profile data available</p>
              )}
            </div>
          )}

          {activeSection === 'report' && (
            <div className="report-panel">
              <h2>Write Report</h2>
              <textarea className='txt' value={report} onChange={(e) => setReport(e.target.value)} placeholder="Write your report here..." />
              <button onClick={handleWriteReport}>Submit Report</button>
            </div>
          )}

          {activeSection === 'summary-report' && (
            <div className="summary-report-panel">
              <h2>Block {proctorData?.block} Summary Report</h2>
              <div className="stats-container">
                <div className="stat-card total">
                  <FontAwesomeIcon icon={faFlag} className="stat-icon" />
                  <div className="stat-content">
                    <h3>Total Complaints</h3>
                    <p>{notifications.length}</p>
                    <div className="stat-trend">↑ 12% from last month</div>
                  </div>
                </div>

                <div className="stat-card verified">
                  <FontAwesomeIcon icon={faCheckCircle} className="stat-icon" />
                  <div className="stat-content">
                    <h3>Verified</h3>
                    <p>{notifications.filter(n => n.status === 'verified').length}</p>
                    <div className="stat-subtext">({((notifications.filter(n => n.status === 'verified').length / notifications.length) * 100 || 0).toFixed(1)}%)</div>
                  </div>
                </div>

                <div className="stat-card pending">
                  <FontAwesomeIcon icon={faClock} className="stat-icon" />
                  <div className="stat-content">
                    <h3>Pending</h3>
                    <p>{notifications.filter(n => n.status === 'pending').length}</p>
                    <div className="stat-subtext">Avg. resolution time: 2.3 days</div>
                  </div>
                </div>

                <div className="stat-card urgent">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="stat-icon" />
                  <div className="stat-content">
                    <h3>Urgent</h3>
                    <p>{notifications.filter(n => n.isUrgent).length}</p>
                    <div className="stat-subtext">Active priority cases</div>
                  </div>
                </div>
              </div>

              <div className="report-chart">
                <h3>Complaint Trends</h3>
                <div className="chart-placeholder">
                  {/* Add your chart implementation here */}
                  <p>Chart showing weekly complaint trends</p>
                </div>
              </div>
            </div>
          )}


          {activeSection === 'dashboard' && (
            <div className="dashboard-panel">
              <div className="dashboard-content">
                <h2>Welcome to Proctor Dashboard</h2>
                <p>
                  This is your central hub for managing and monitoring student complaints. Here, you can effectively handle notifications,
                  maintain your profile, generate detailed reports, and access summary data to ensure a smooth resolution process.
                </p>
                <div className="quick-stats">
                  <div className="stat-item">
                    <h3>Active Complaints</h3>
                    <p>{notifications.length}</p>
                  </div>
                  <div className="stat-item">
                    <h3>Your Block</h3>
                    <p>{proctorData?.block || 'Not assigned'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Image Modal */}
      {expandedImage && (
        <div className="image-modal" onClick={() => setExpandedImage(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setExpandedImage(null)}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <img src={expandedImage} alt="Expanded view" />
          </div>
        </div>
      )}

      {/* Complaint Details Modal */}
      {selectedComplaint && (
        <div className="complaint-modal" onClick={() => setSelectedComplaint(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedComplaint(null)}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <h2>Complaint Details</h2>
            <h3>{selectedComplaint.title}</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <strong>Student ID:</strong> {selectedComplaint.userId}
              </div>
              <div className="detail-item">
                <strong>Dorm Number:</strong> {selectedComplaint.dormNumber}
              </div>
              <div className="detail-item">
                <strong>Status:</strong>
                <span className={`status-badge ${selectedComplaint.status || 'pending'}`}>
                  {selectedComplaint.status || 'Pending'}
                </span>
              </div>
              <div className="detail-item">
                <strong>Date:</strong> {new Date(selectedComplaint.createdAt).toLocaleString()}
              </div>
            </div>
            <div className="description-section">
              <h4>Description:</h4>
              <p>{selectedComplaint.description}</p>
            </div>
            {selectedComplaint.feedback && (
              <div className="feedback-section">
                <h4>Feedback:</h4>
                <p>{selectedComplaint.feedback}</p>
              </div>
            )}
            {selectedComplaint.file && (
              <div className="image-section">
                <h4>Attached Image:</h4>
                <img
                  src={`http://localhost:5000/${selectedComplaint.file}`}
                  alt="Complaint evidence"
                  style={{ maxWidth: '300px', cursor: 'zoom-in' }}
                  onClick={() => handleExpandImage(`http://localhost:5000/${selectedComplaint.file}`)}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProctorDashboard;