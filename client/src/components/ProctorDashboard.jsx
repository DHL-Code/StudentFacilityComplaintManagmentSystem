import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFlag,faUserEdit, faUpload, faCommentDots } from '@fortawesome/free-solid-svg-icons';
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
  const [proctorProfile, setProctorProfile] = useState({
    proctorId: 'P12345',
    gender: 'Male',
    email: 'john.doe@example.com',
    phone: '123-456-7890',
    password: '',
    newPassword: '',
    confirmPassword: '',
    profilePicture: null,
  });
  const [passwordError, setPasswordError] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

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

  const handleProfileEdit = () => {
    setIsEditingProfile(true);
  };

  const handleProfileSave = () => {
    if (proctorProfile.newPassword) {
      if (proctorProfile.newPassword !== proctorProfile.confirmPassword) {
        setPasswordError('New password and confirm password do not match.');
        return;
      }
      if (proctorProfile.password !== 'currentPassword') {
        setPasswordError('Incorrect current password.');
        return;
      }
    }
    setIsEditingProfile(false);
    setPasswordError('');
  };

  const handleProfileChange = (e) => {
    setProctorProfile({ ...proctorProfile, [e.target.name]: e.target.value });
  };

  const handleProfilePictureChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setProctorProfile({ ...proctorProfile, profilePicture: URL.createObjectURL(e.target.files[0]) });
    }
  };

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

        <div className="desktop-nav">
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
        </div>


        {activeSection === 'profile' && (
           <div className="profile-panel">
           <h2>Proctor Profile</h2>
           {isEditingProfile ? (
             <div className="profile-form">
               <div className="form-group">
                 <label htmlFor="proctorId">Proctor ID</label>
                 <input type="text" name="proctorId" id="proctorId" value={proctorProfile.proctorId} onChange={handleProfileChange} />
               </div>
               <div className="form-group">
                 <label htmlFor="gender">Gender</label>
                 <input type="text" name="gender" id="gender" value={proctorProfile.gender} onChange={handleProfileChange} />
               </div>
               <div className="form-group">
                 <label htmlFor="email">Email</label>
                 <input type="email" name="email" id="email" value={proctorProfile.email} onChange={handleProfileChange} />
               </div>
               <div className="form-group">
                 <label htmlFor="phone">Phone</label>
                 <input type="tel" name="phone" id="phone" value={proctorProfile.phone} onChange={handleProfileChange} />
               </div>
               <div className="form-group">
                 <label htmlFor="password">Current Password</label>
                 <input type="password" name="password" id="password" onChange={handleProfileChange} />
               </div>
               <div className="form-group">
                 <label htmlFor="newPassword">New Password</label>
                 <input type="password" name="newPassword" id="newPassword" onChange={handleProfileChange} />
               </div>
               <div className="form-group">
                 <label htmlFor="confirmPassword">Confirm New Password</label>
                 <input type="password" name="confirmPassword" id="confirmPassword" onChange={handleProfileChange} />
               </div>
               {passwordError && <p className="error-message">{passwordError}</p>}
               <div className="form-group">
                 <label htmlFor="profilePictureUpload" className="profile-picture-upload">
                   <FontAwesomeIcon icon={faUpload} /> Upload Profile Picture
                 </label>
                 <input id="profilePictureUpload" type="file" onChange={handleProfilePictureChange} style={{ display: 'none' }} />
                 {proctorProfile.profilePicture && <img src={proctorProfile.profilePicture} alt="Profile" className="profile-preview" />}
               </div>
               <div className="form-actions">
                 <button onClick={handleProfileSave}>Save</button>
                 <button onClick={() => setIsEditingProfile(false)}>Cancel</button>
               </div>
             </div>
           ) : (
             <div className="profile-details">
               {proctorProfile.profilePicture && <img src={proctorProfile.profilePicture} alt="Profile" className="profile-preview" />}
               <p><strong>Proctor ID:</strong> {proctorProfile.proctorId}</p>
               <p><strong>Gender:</strong> {proctorProfile.gender}</p>
               <p><strong>Email:</strong> {proctorProfile.email}</p>
               <p><strong>Phone:</strong> {proctorProfile.phone}</p>
               <button className="edit-profile-btn" onClick={() => setIsEditingProfile(true)}>
                 <FontAwesomeIcon icon={faUserEdit} /> Edit Profile
               </button>
             </div>
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
  );
}

export default ProctorDashboard;