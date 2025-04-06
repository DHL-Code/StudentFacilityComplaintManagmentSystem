import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFlag, faCommentDots } from '@fortawesome/free-solid-svg-icons';
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

  useEffect(() => {
    // Create a new AbortController for this component instance
    const controller = new AbortController();
    setAbortController(controller);

    // Cleanup function
    return () => {
      controller.abort();
    };
  }, []);

  const handleNavigation = (section) => {
    setActiveSection(section);
    setIsNavActive(false);
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

      if (!response.ok) {
        throw new Error('Failed to verify complaint');
      }

      setNotifications(notifications.map(notification => 
        notification._id === id ? { ...notification, status: 'verified' } : notification
      ));
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted');
        return;
      }
      console.error('Error verifying complaint:', error);
      setError('Failed to verify complaint');
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

      if (!response.ok) {
        throw new Error('Failed to dismiss complaint');
      }

      setNotifications(notifications.filter(notification => notification._id !== id));
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted');
        return;
      }
      console.error('Error dismissing complaint:', error);
      setError('Failed to dismiss complaint');
    }
  };

  const handleFlagUrgent = async (id) => {
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

      if (!response.ok) {
        throw new Error('Failed to flag complaint as urgent');
      }

      setNotifications(notifications.map(notification => 
        notification._id === id ? { ...notification, isUrgent: true } : notification
      ));
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted');
        return;
      }
      console.error('Error flagging complaint:', error);
      setError('Failed to flag complaint as urgent');
    }
  };

  const handleWriteReport = () => {
    console.log('Report submitted:', report);
    setReport('');
  };

  const handleViewFeedback = (complaint) => {
    setSelectedComplaint(complaint);
  };

  const fetchProctorData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found. Please log in.');
      }

      const userData = JSON.parse(localStorage.getItem('user'));
      if (!userData || !userData.userId) {
        throw new Error('No user data found. Please log in again.');
      }

      const response = await fetch(`http://localhost:5000/api/admin/staff/${userData.userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: abortController?.signal
      });

      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || `Failed to fetch proctor data. Status: ${response.status}`;
        } catch (e) {
          errorMessage = `Failed to fetch proctor data. Status: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Fetched proctor data:', data);
      
      if (!data) {
        throw new Error('No data received from server');
      }

      let profilePhotoUrl = null;
      if (data.profilePhoto) {
        const filename = data.profilePhoto.split('\\').pop();
        profilePhotoUrl = `http://localhost:5000/uploads/staff-photos/${filename}`;
        console.log('Profile photo URL:', profilePhotoUrl);
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
      
      console.log('Processed proctor data:', proctorInfo);
      setProctorData(proctorInfo);

      await fetchComplaints(proctorInfo.block);
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Fetch aborted');
        return;
      }
      console.error('Error fetching proctor data:', err);
      setError(err.message || 'Failed to fetch proctor data');
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

      if (!response.ok) {
        throw new Error('Failed to fetch complaints');
      }

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
        createdAt: complaint.createdAt
      }));

      setNotifications(transformedComplaints);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted');
        return;
      }
      console.error('Error fetching complaints:', error);
      setError('Failed to fetch complaints');
    }
  };

  useEffect(() => {
    fetchProctorData();
  }, []);

  return (
    <div className="proctor-dashboard">
      <div className="sidebar">
        <h1>Proctor Dashboard</h1>
        <ul>
          <li onClick={() => handleNavigation('notifications')}>Notifications</li>
          <li onClick={() => handleNavigation('profile')}>Profile</li>
          <li onClick={() => handleNavigation('report')}>Write Report</li>
          <li onClick={() => handleNavigation('summary-report')}>Summary Report</li>
        </ul>
      </div>

      <div className="content">
        <div className="top-nav">
          <span className="hamburger" onClick={toggleNav}>
            {isNavActive ? 'x' : '☰'}
          </span>
          <div className={`nav-items ${isNavActive ? 'active' : ''}`}>
            <span onClick={() => handleNavigation('notifications')}>Notifications</span>
            <span onClick={() => handleNavigation('profile')}>Profile</span>
            <span onClick={() => handleNavigation('report')}>Write Report</span>
            <span onClick={() => handleNavigation('summary-report')}>Summary Report</span>
          </div>
        </div>

        <div className="desk-nav">
          <button onClick={() => handleNavigation('notifications')}>Notifications</button>
          <button onClick={() => handleNavigation('profile')}>Profile</button>
          <button onClick={() => handleNavigation('report')}>Write Report</button>
          <button onClick={() => handleNavigation('summary-report')}>Summary Report</button>
        </div>

        <div className="content">
          {activeSection === 'notifications' && (
            <div className="notifications-page">
              <h1>Block {proctorData?.block || 'Not Assigned'}</h1>
              <div className="notifications-container">
                <h2>Notifications</h2>
                {notifications.map((notification) => (
                  <div key={notification._id} className={`notification-item ${notification.isUrgent ? 'urgent' : ''}`}>
                    <div className="notification-header">
                      <h3>{notification.title}</h3>
                      <span className="notification-time">
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="notification-details">
                      <p><strong>Student ID:</strong> {notification.userId}</p>
                      <p><strong>Dorm Number:</strong> {notification.dormNumber}</p>
                      <p><strong>Description:</strong> {notification.description}</p>
                      {notification.file && (
                        <div className="complaint-photo">
                          <img 
                            src={`http://localhost:5000/${notification.file}`}
                            alt="Complaint evidence"
                            className="complaint-image"
                          />
                        </div>
                      )}
                    </div>
                    <div className="notification-actions">
                      <button className="verify-btn" onClick={() => handleVerify(notification._id)}>Verify</button>
                      <button className="dismiss-btn" onClick={() => handleDismiss(notification._id)}>Dismiss</button>
                      {notification.isUrgent && (
                        <button className="flag-btn" onClick={() => handleFlagUrgent(notification._id)}>
                          <FontAwesomeIcon icon={faFlag} /> Flag Urgent
                        </button>
                      )}
                      <button className="feedback-btn" onClick={() => handleViewFeedback(notification)}>
                        <FontAwesomeIcon icon={faCommentDots} /> View Feedback
                      </button>
                    </div>
                  </div>
                ))}
                {selectedComplaint && (
                  <div className="complaint-details">
                    <h2>Complaint Details</h2>
                    <h3>{selectedComplaint.title}</h3>
                    <p><strong>Student ID:</strong> {selectedComplaint.userId}</p>
                    <p><strong>Dorm Number:</strong> {selectedComplaint.dormNumber}</p>
                    <p><strong>Description:</strong> {selectedComplaint.description}</p>
                    <p><strong>Feedback:</strong> {selectedComplaint.feedback}</p>
                    {selectedComplaint.file && (
                      <div className="complaint-photo">
                        <img 
                          src={`http://localhost:5000/${selectedComplaint.file}`}
                          alt="Complaint evidence"
                          className="complaint-image"
                        />
                      </div>
                    )}
                    <button onClick={() => setSelectedComplaint(null)}>Close</button>
                  </div>
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
            <h2>Summary Report</h2>
            <p>This is the summary report section.</p>
          </div>
        )}

        {activeSection === 'dashboard' && (
          <div className="dashboard-panel">
            <div className="dashboard-content">
              <h2>Welcome to Proctor Dashboard</h2>
              <p>
                This is your central hub for managing and monitoring online assessments. Here, you can effectively handle notifications,
                maintain your profile, generate detailed reports, and access summary data to ensure a smooth and fair examination process.
              </p>
              <p>
                Use the navigation on the left to quickly access various sections. If you have any questions, click the help icon <FontAwesomeIcon icon={faQuestionCircle} />.
              </p>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

export default ProctorDashboard;