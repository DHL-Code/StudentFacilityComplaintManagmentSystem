// SupervisorPage.jsx
import React, { useState, useEffect } from 'react';
import '../styles/SupervisorStyles.css';
import { FaSun, FaMoon, FaBars, FaTimes } from 'react-icons/fa';

const SupervisorPage = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        gender: '',
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });
    const [currentProfilePhoto, setCurrentProfilePhoto] = useState(null);
    const [newProfilePhoto, setNewProfilePhoto] = useState(null);
    const [newProfilePreview, setNewProfilePreview] = useState(null);
    const [fileError, setFileError] = useState('');
    const [activeSection, setActiveSection] = useState('viewProfile');

    const [complaints, setComplaints] = useState([]);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [escalationReason, setEscalationReason] = useState('');
    const [showEscalationModal, setShowEscalationModal] = useState(false);
    const [loadingComplaints, setLoadingComplaints] = useState(false);
    const [complaintError, setComplaintError] = useState(null);
    const [escalatedComplaints, setEscalatedComplaints] = useState([]);
    const [loadingReports, setLoadingReports] = useState(false);
    const [reportsError, setReportsError] = useState(null);

    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme === 'dark';
    });

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    }, [isDarkMode]);

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    useEffect(() => {
        if (activeSection === 'complaints') {
            fetchVerifiedComplaints();
        } else if (activeSection === 'reports') {
            fetchEscalatedComplaints();
        }
    }, [activeSection]);

    const fetchProfile = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const userData = JSON.parse(localStorage.getItem('user'));
            
            if (!token || !userData || !userData.userId) {
                throw new Error('No authentication token or user data found');
            }

            console.log('Fetching profile for staff ID:', userData.userId);
            const response = await fetch(`http://localhost:5000/api/admin/staff/${userData.userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Fetch Profile Error:', errorData);
                throw new Error(errorData.message || 'Failed to fetch profile');
            }

            const data = await response.json();
            console.log('Fetched staff data:', data);
            
            // Handle profile photo URL
            if (data.profilePhoto) {
                // Check if the URL already starts with http://localhost:5000/
                if (data.profilePhoto.startsWith('http://localhost:5000/')) {
            setCurrentProfilePhoto(data.profilePhoto);
                } else {
                    // Extract just the filename from the full path, handling both forward and backward slashes
                    const photoPath = data.profilePhoto.split(/[\\/]/).pop();
                    setCurrentProfilePhoto(`http://localhost:5000/uploads/staff-photos/${photoPath}`);
                }
            }
            
            // Map the data to match our profile state structure
            const profileData = {
                fullName: data.name || '',
                email: data.email || '',
                phoneNumber: data.phone || '',
                gender: data.gender || '',
                userId: data.staffId || '',
                createdAt: data.createdAt || new Date().toISOString()
            };

            setProfile(profileData);

            setFormData({
                fullName: profileData.fullName,
                email: profileData.email,
                phoneNumber: profileData.phoneNumber,
                gender: profileData.gender,
                currentPassword: '',
                newPassword: '',
                confirmNewPassword: ''
            });

        } catch (err) {
            console.error('Error fetching profile:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchVerifiedComplaints = async () => {
        setLoadingComplaints(true);
        setComplaintError(null);
        try {
            const token = localStorage.getItem('token');
            const userData = JSON.parse(localStorage.getItem('user'));
            
            if (!token || !userData) {
                throw new Error('No authentication token found');
            }

            console.log('Fetching verified complaints...');
            const response = await fetch('http://localhost:5000/api/complaints/verified', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            // Log the response status and headers for debugging
            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));

            const data = await response.json();
            console.log('Response data:', data);

            if (!response.ok) {
                throw new Error(data.message || `Failed to fetch complaints: ${response.status}`);
            }

            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch complaints');
            }
            
            if (!Array.isArray(data.data)) {
                console.error('Received non-array data:', data.data);
                throw new Error('Invalid response format: expected an array of complaints');
            }

            if (data.data.length === 0) {
                console.log('No verified complaints found');
                setComplaintError('No verified complaints found');
            }

            setComplaints(data.data);
        } catch (error) {
            console.error('Error fetching verified complaints:', error);
            setComplaintError(error.message);
        } finally {
            setLoadingComplaints(false);
        }
    };

    const fetchEscalatedComplaints = async () => {
        setLoadingReports(true);
        setReportsError(null);
        try {
            const token = localStorage.getItem('token');
            const userData = JSON.parse(localStorage.getItem('user'));
            
            if (!token || !userData) {
                throw new Error('No authentication token found');
            }

            const response = await fetch('http://localhost:5000/api/complaints/escalated', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `Failed to fetch escalated complaints: ${response.status}`);
            }

            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch escalated complaints');
            }

            setEscalatedComplaints(data.data);
        } catch (error) {
            console.error('Error fetching escalated complaints:', error);
            setReportsError(error.message);
        } finally {
            setLoadingReports(false);
        }
    };

    const handleNavigation = (section) => {
        setActiveSection(section);
        setIsMobileMenuOpen(false);
        if (section === 'viewProfile' && !profile) {
            fetchProfile();
        }
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

        try {
            const token = localStorage.getItem('token');
            const userData = JSON.parse(localStorage.getItem('user'));
            
            if (!token || !userData || !userData.userId) {
                throw new Error('No authentication token or user data found');
            }

            const formPayload = new FormData();
            formPayload.append('name', formData.fullName);
            formPayload.append('email', formData.email);
            formPayload.append('phone', formData.phoneNumber);
            formPayload.append('gender', formData.gender);
            
            if (formData.currentPassword && formData.newPassword) {
                formPayload.append('currentPassword', formData.currentPassword);
                formPayload.append('newPassword', formData.newPassword);
            }
            
            if (newProfilePhoto) {
                formPayload.append('profilePhoto', newProfilePhoto);
            }

            console.log('Updating profile for staff ID:', userData.userId);
            const response = await fetch(`http://localhost:5000/api/admin/staff/${userData.userId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formPayload,
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Update Profile Error:', errorData);
                throw new Error(errorData.message || 'Update failed');
            }

            const data = await response.json();
            console.log('Profile update successful:', data);
            setProfile(data);
            alert('Profile updated successfully');
            
            await fetchProfile();
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
            const response = await fetch(`http://localhost:5000/api/complaints/${complaintId}/resolve`, {
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

            // Refresh complaints list
            await fetchVerifiedComplaints();
            alert('Complaint resolved successfully');
        } catch (error) {
            console.error('Error resolving complaint:', error);
            setComplaintError(error.message);
        }
    };

    const handleEscalateComplaint = async (complaintId) => {
        if (!escalationReason.trim()) {
            setComplaintError('Please provide a reason for escalation');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const userData = JSON.parse(localStorage.getItem('user'));
            
            if (!userData || !userData.userId) {
                throw new Error('Supervisor ID not found');
            }

            const response = await fetch(`http://localhost:5000/api/complaints/${complaintId}/escalate`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    reason: escalationReason,
                    supervisorId: userData.userId
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to escalate complaint');
            }

            if (!data.success) {
                throw new Error(data.message || 'Failed to escalate complaint');
            }

            // Remove the escalated complaint from the list
            setComplaints(complaints.filter(c => c._id !== complaintId));
            setShowEscalationModal(false);
            setEscalationReason('');
            
            // Refresh the escalated complaints list
            await fetchEscalatedComplaints();
            
            // Show success message
            alert('Complaint has been successfully escalated to the dean');
        } catch (error) {
            console.error('Error escalating complaint:', error);
            setComplaintError(error.message);
            alert('Failed to escalate complaint: ' + error.message);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    return (
        <div className="supervisor-page">
            <div className="Supervisor-mobile-header">
                <button className="Supervisor-hamburger-btn" onClick={toggleMobileMenu}>
                    {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
                </button>
                <h1>Supervisor Dashboard</h1>
                <div className="Supervisor-header-actions">
                    <button className="Supervisor-theme-toggle" onClick={toggleTheme}>
                        {isDarkMode ? <FaSun className="Supervisor-theme-icon" /> : <FaMoon className="Supervisor-theme-icon" />}
                    </button>
                    <button className="Supervisor-logout-btn" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </div>

            <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
                <button 
                    onClick={() => handleNavigation('viewProfile')}
                    className={activeSection === 'viewProfile' ? 'active' : ''}
                >
                    View Profile
                </button>
                <button 
                    onClick={() => handleNavigation('editProfile')}
                    className={activeSection === 'editProfile' ? 'active' : ''}
                >
                    Edit Profile
                </button>
                <button 
                    onClick={() => handleNavigation('complaints')}
                    className={activeSection === 'complaints' ? 'active' : ''}
                >
                    Complaint Management
                </button>
                <button 
                    onClick={() => handleNavigation('reports')}
                    className={activeSection === 'reports' ? 'active' : ''}
                >
                    Escalation Reports
                </button>
            </div>

            <div className="Supervisor-sidebar">
                <h2>Navigation</h2>
                <div className="Supervisor-sidebar-nav">
                    <button 
                        onClick={() => handleNavigation('viewProfile')}
                        className={activeSection === 'viewProfile' ? 'active' : ''}
                    >
                        View Profile
                    </button>
                    <button 
                        onClick={() => handleNavigation('editProfile')}
                        className={activeSection === 'editProfile' ? 'active' : ''}
                    >
                        Edit Profile
                    </button>
                    <button 
                        onClick={() => handleNavigation('complaints')}
                        className={activeSection === 'complaints' ? 'active' : ''}
                    >
                        Complaint Management
                    </button>
                    <button 
                        onClick={() => handleNavigation('reports')}
                        className={activeSection === 'reports' ? 'active' : ''}
                    >
                        Escalation Reports
                    </button>
                </div>
            </div>

            <div className="Supervisor-main-content">
                <div className="Supervisor-desktop-header">
                    <h1>Supervisor Dashboard</h1>
                    <div className="Supervisor-header-actions">
                        <button className="Supervisor-theme-toggle" onClick={toggleTheme}>
                            {isDarkMode ? <FaSun className="Supervisor-theme-icon" /> : <FaMoon className="Supervisor-theme-icon" />}
                        </button>
                        <button className="Supervisor-logout-btn" onClick={handleLogout}>
                            Logout
                        </button>
                    </div>
                </div>

                <div className="Supervisor-content-area">
                    {activeSection === 'viewProfile' && (
                        <section className="view-profile">
                            <h2>View Profile</h2>
                            {loading && <p className="loading">Loading profile...</p>}
                            {error && <p className="error">Error: {error}</p>}
                            {profile && (
                                <div className="profile-container">
                                    <div className="profile-header">
                                        {currentProfilePhoto ? (
                                            <img 
                                                src={currentProfilePhoto} 
                                                alt="Profile" 
                                                className="profile-photo"
                                                onError={(e) => {
                                                    console.error('Failed to load profile photo:', currentProfilePhoto);
                                                    e.target.style.display = 'none';
                                                    setError('Failed to load profile photo');
                                                }}
                                            />
                                        ) : (
                                            <div className="profile-photo-placeholder">No Photo</div>
                                        )}
                                        <h3 className="full-name">{profile.fullName}</h3>
                                        <p className="user-id">{profile.userId}</p>
                                    </div>
                                    <div className="profile-details">
                                        <div className="detail-item">
                                            <span className="detail-label">Email:</span>
                                            <span className="detail-value">{profile.email}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Phone Number:</span>
                                            <span className="detail-value">{profile.phoneNumber}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Gender:</span>
                                            <span className="detail-value">{profile.gender}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Account Created:</span>
                                            <span className="detail-value">
                                                {new Date(profile.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </section>
                    )}

                    {activeSection === 'editProfile' && (
                        <section className="edit-profile">
                            <h2>Edit Profile</h2>
                            {loading && <p className="loading">Saving changes...</p>}
                            {error && <p className="error">Error: {error}</p>}
                            <form onSubmit={handleProfileUpdate} className="edit-profile-form">
                            <div className="profile-photo-edit">
                                <div
                                    className="photo-preview"
                                    onClick={() => document.getElementById('profilePhotoInput').click()}
                                >
                                    {newProfilePreview ? (
                                        <img src={newProfilePreview} alt="Preview" className="profile-image" />
                                        ) : currentProfilePhoto ? (
                                            <img src={currentProfilePhoto} alt="Current Profile" className="profile-image" />
                                    ) : (
                                        <div className="upload-placeholder">
                                            <span className="upload-icon">+</span>
                                            <span className="upload-text">Upload Photo</span>
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
                                {fileError && <p className="error">{fileError}</p>}
                            </div>

                                <div className="form-section">
                                    <h3>Personal Information</h3>
                                    <div className="form-group">
                                <label>
                                    Full Name:
                                    <input
                                        type="text"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                                placeholder="Enter your full name"
                                    />
                                </label>
                                    </div>

                                    <div className="form-group">
                                <label>
                                    Email:
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="Enter your email"
                                    />
                                </label>
                                    </div>

                                    <div className="form-group">
                                <label>
                                    Phone Number:
                                    <input
                                        type="tel"
                                        value={formData.phoneNumber}
                                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                                placeholder="Enter your phone number"
                                    />
                                </label>
                                    </div>

                                    <div className="form-group">
                                        <span className="gender-label">Gender:</span>
                                        <div className="gender-options">
                                            <label className="gender-option">
                                        <input
                                            type="radio"
                                            value="male"
                                            checked={formData.gender === 'male'}
                                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                        />
                                        Male
                                    </label>
                                            <label className="gender-option">
                                        <input
                                            type="radio"
                                            value="female"
                                            checked={formData.gender === 'female'}
                                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                        />
                                        Female
                                    </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-section">
                                    <h3>Change Password</h3>
                                    <div className="form-group">
                                    <label>
                                        Current Password:
                                        <input
                                            type="password"
                                            value={formData.currentPassword}
                                            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                                            placeholder="Enter current password"
                                        />
                                    </label>
                                    </div>

                                    <div className="form-group">
                                    <label>
                                        New Password:
                                        <input
                                            type="password"
                                            value={formData.newPassword}
                                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                                placeholder="Enter new password"
                                        />
                                    </label>
                                    </div>

                                    <div className="form-group">
                                    <label>
                                        Confirm New Password:
                                        <input
                                            type="password"
                                            value={formData.confirmNewPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmNewPassword: e.target.value })}
                                            placeholder="Confirm new password"
                                        />
                                    </label>
                                </div>
                            </div>

                                <div className="form-actions">
                                    <button type="submit" className="save-button" disabled={loading}>
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                                </div>
                        </form>
                        </section>
                    )}

                    {activeSection === 'complaints' && (
                        <div className="complaints-section">
                            <h2>Complaint Management</h2>
                            {loadingComplaints && <p className="loading">Loading complaints...</p>}
                            {complaintError && <p className="error">Error: {complaintError}</p>}
                            
                            <div className="Supervisor-complaints-grid">
                                {complaints.map(complaint => (
                                    <div key={complaint._id} className="complaint-card">
                                        <div className="complaint-header">
                                            <h3>{complaint.complaintType}</h3>
                                            <span className={`status ${complaint.status.toLowerCase()}`}>
                                                {complaint.status}
                                            </span>
                                        </div>
                                        <div className="complaint-details">
                                            <p><strong>Specific Issue:</strong> {complaint.specificInfo}</p>
                                            <p><strong>Description:</strong> {complaint.description}</p>
                                            <p><strong>Block:</strong> {complaint.blockNumber}</p>
                                            <p><strong>Dorm:</strong> {complaint.dormNumber}</p>
                                            <p><strong>Date:</strong> {new Date(complaint.createdAt).toLocaleDateString()}</p>
                                            {complaint.isUrgent && <p className="urgent-tag">URGENT</p>}
                                        </div>
                                        <div className="complaint-actions">
                                            <button 
                                                className="resolve-btn"
                                                onClick={() => handleResolveComplaint(complaint._id)}
                                            >
                                                Mark as Resolved
                                            </button>
                                            <button 
                                                className="escalate-btn"
                                                onClick={() => {
                                                    setSelectedComplaint(complaint);
                                                    setShowEscalationModal(true);
                                                }}
                                            >
                                                Escalate to Dean
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Escalation Modal */}
                            {showEscalationModal && (
                                <div className="modal-overlay">
                                    <div className="modal-content">
                                        <h3>Escalate Complaint to Dean</h3>
                                        <p>Please provide a reason for escalating this complaint:</p>
                                        <textarea
                                            value={escalationReason}
                                            onChange={(e) => setEscalationReason(e.target.value)}
                                            placeholder="Enter reason for escalation..."
                                            rows="4"
                                        />
                                        <div className="modal-actions">
                                            <button 
                                                className="confirm-btn"
                                                onClick={() => handleEscalateComplaint(selectedComplaint._id)}
                                            >
                                                Confirm Escalation
                                            </button>
                                            <button 
                                                className="cancel-btn"
                                                onClick={() => {
                                                    setShowEscalationModal(false);
                                                    setEscalationReason('');
                                                    setSelectedComplaint(null);
                                                }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeSection === 'reports' && (
                        <div className="section reports-section">
                            <h2>Escalation Reports</h2>
                            {loadingReports && <p className="loading">Loading reports...</p>}
                            {reportsError && <p className="error">Error: {reportsError}</p>}
                            
                            <div className="reports-list">
                                {escalatedComplaints.length === 0 ? (
                                    <p>No escalated complaints found.</p>
                                ) : (
                                    escalatedComplaints.map(complaint => (
                                        <div key={complaint._id} className="report-card">
                                            <h3>{complaint.complaintType}</h3>
                                            <div className="report-details">
                                                <p><strong>Escalated On:</strong> {new Date(complaint.escalatedAt).toLocaleDateString()}</p>
                                                <p><strong>Status:</strong> {complaint.status}</p>
                                                <p><strong>Block:</strong> {complaint.blockNumber}</p>
                                                <p><strong>Dorm:</strong> {complaint.dormNumber}</p>
                                                <p><strong>Escalation Reason:</strong> {complaint.escalationReason}</p>
                                                {complaint.resolvedAt && (
                                                    <p><strong>Resolved On:</strong> {new Date(complaint.resolvedAt).toLocaleDateString()}</p>
                                                )}
                                            </div>
                                            <div className="report-actions">
                                                <button 
                                                    className="view-details-btn"
                                                    onClick={() => setSelectedComplaint(complaint)}
                                                >
                                                    View Full Details
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {selectedComplaint && (
                                <div className="modal-overlay">
                                    <div className="modal-content">
                                        <h3>Complaint Details</h3>
                                        <div className="complaint-full-details">
                                            <p><strong>Type:</strong> {selectedComplaint.complaintType}</p>
                                            <p><strong>Specific Issue:</strong> {selectedComplaint.specificInfo}</p>
                                            <p><strong>Description:</strong> {selectedComplaint.description}</p>
                                            <p><strong>Block:</strong> {selectedComplaint.blockNumber}</p>
                                            <p><strong>Dorm:</strong> {selectedComplaint.dormNumber}</p>
                                            <p><strong>Escalation Reason:</strong> {selectedComplaint.escalationReason}</p>
                                            <p><strong>Escalated On:</strong> {new Date(selectedComplaint.escalatedAt).toLocaleString()}</p>
                                            <p><strong>Status:</strong> {selectedComplaint.status}</p>
                                            {selectedComplaint.resolvedAt && (
                                                <p><strong>Resolved On:</strong> {new Date(selectedComplaint.resolvedAt).toLocaleString()}</p>
                                            )}
                                        </div>
                                        <div className="modal-actions">
                                            <button 
                                                className="close-btn"
                                                onClick={() => setSelectedComplaint(null)}
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SupervisorPage;