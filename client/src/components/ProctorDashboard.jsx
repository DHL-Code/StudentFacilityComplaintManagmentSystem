import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFlag, faCommentDots } from '@fortawesome/free-solid-svg-icons';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import '../styles/ProctorDashboard.css';

function ProctorDashboard() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isNavActive, setIsNavActive] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New Complaint: Cheating Allegation', description: 'Student XYZ reported for cheating in exam.', isUrgent: false, feedback: "Student claims unfair accusation." },
    { id: 2, title: 'Complaint: Technical Issue', description: 'Student ABC reports technical difficulties during assessment.', isUrgent: true, feedback: "Student reports website crash" },
    { id: 3, title: 'Complaint: Unfair Question', description: 'Student DEF reports an ambiguous question.', isUrgent: false, feedback: "Student asking for question clarification" },
  ]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [report, setReport] = useState('');
  const [proctorId, setProctorId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [proctorData, setProctorData] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);

  const handleNavigation = (section) => {
    setActiveSection(section);
    setIsNavActive(false);
  };

  const toggleNav = () => {
    setIsNavActive(!isNavActive);
  };

  const handleVerify = (id) => {
    setNotifications(notifications.filter((notification) => notification.id !== id));
  };

  const handleDismiss = (id) => {
    setNotifications(notifications.filter((notification) => notification.id !== id));
  };

  const handleFlagUrgent = (id) => {
    setNotifications(notifications.map((notification) => (notification.id === id ? { ...notification, isUrgent: true } : notification)));
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

      // Process profile photo
      let profilePhotoUrl = null;
      if (data.profilePhoto) {
        // Extract just the filename from the full path
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
    } catch (err) {
      console.error('Error fetching proctor data:', err);
      setError(err.message || 'Failed to fetch proctor data');
    } finally {
      setLoading(false);
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
              <h2>Notifications</h2>
              {notifications.map((notification) => (
                <div key={notification.id} className={`notification-item ${notification.isUrgent ? 'urgent' : ''}`}>
                  <h3>{notification.title}</h3>
                  <p>{notification.description}</p>
                  <div className="notification-actions">
                    <button className="verify-btn" onClick={() => handleVerify(notification.id)}>Verify</button>
                    <button className="dismiss-btn" onClick={() => handleDismiss(notification.id)}>Dismiss</button>
                    {notification.isUrgent && (
                      <button className="flag-btn" onClick={() => handleFlagUrgent(notification.id)}>
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
                  <p>{selectedComplaint.description}</p>
                  <p><strong>Feedback:</strong> {selectedComplaint.feedback}</p>
                  <button onClick={() => setSelectedComplaint(null)}>Close</button>
                </div>
              )}
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