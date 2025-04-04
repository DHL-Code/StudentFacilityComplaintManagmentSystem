// SupervisorPage.jsx
import React, { useState, useEffect } from 'react';
import '../styles/SupervisorStyles.css';

const SupervisorPage = () => {
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
        college: '' // Added college to formData
    });
    const [currentProfilePhoto, setCurrentProfilePhoto] = useState(null);
    const [newProfilePhoto, setNewProfilePhoto] = useState(null);
    const [newProfilePreview, setNewProfilePreview] = useState(null);
    const [fileError, setFileError] = useState('');
    const [activeSection, setActiveSection] = useState('viewProfile');

    const [complaints, setComplaints] = useState([
        { id: 1, title: "Broken AC", category: "Maintenance", 
          status: "Pending", description: "AC not working in Room 101", 
          proctor: "John Smith", escalated: false },
        { id: 2, title: "Leaking Roof", category: "Infrastructure", 
          status: "Under Review", description: "Water leakage in the library", 
          proctor: "Lisa Brown", escalated: false }
    ]);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [escalationReason, setEscalationReason] = useState("");
    const [reports] = useState([
        { id: 1, date: "2024-03-20", escalatedCount: 2, resolvedCount: 1 },
        { id: 2, date: "2024-03-21", escalatedCount: 1, resolvedCount: 0 }
    ]);

    useEffect(() => {
        fetchProfile(); // Ensure profile is fetched on component mount
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch('http://localhost:5000/api/auth/profile', {
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
            setCurrentProfilePhoto(data.profilePhoto);
            setProfile(data);

            // Populate formData if we have profile data
            setFormData({
                fullName: data.fullName,
                email: data.email,
                phoneNumber: data.phoneNumber,
                department: data.department,
                gender: data.gender,
                college: data.college, // Added college here
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

    const handleNavigation = (section) => {
        setActiveSection(section);
        if (section === 'viewProfile' && !profile) {
            fetchProfile(); // Fetch profile if navigating to viewProfile
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

        const formPayload = new FormData();
        formPayload.append('fullName', formData.fullName);
        formPayload.append('email', formData.email);
        formPayload.append('phoneNumber', formData.phoneNumber);
        formPayload.append('department', formData.department);
        formPayload.append('gender', formData.gender);
        formPayload.append('college', formData.college); // Added college to form data
        if (newProfilePhoto) formPayload.append('profilePhoto', newProfilePhoto);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/auth/profile', {
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
            setProfile(data); // Update the profile with new data
            alert('Profile updated successfully');
        } catch (err) {
            console.error('Error updating profile:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const escalateToDean = (complaintId) => {
        if (escalationReason.trim()) {
            setComplaints(complaints.map(comp =>
                comp.id === complaintId ? { 
                    ...comp, 
                    escalated: true,
                    status: "Escalated",
                    escalationReason: escalationReason
                } : comp
            ));
            setEscalationReason("");
            setSelectedComplaint(null);
        }
    };

    const resolveComplaint = (complaintId) => {
        setComplaints(complaints.map(comp =>
            comp.id === complaintId ? { 
                ...comp, 
                status: "Resolved",
                escalated: false
            } : comp
        ));
        setSelectedComplaint(null);
    };

    return (
        <div className="supervisor-page">
            <div className="sidebar">
                <h2>Navigation</h2>
                <ul>
                    <li>
                        <button 
                            onClick={() => handleNavigation('viewProfile')}
                            className={activeSection === 'viewProfile' ? 'active' : ''}
                        >
                            View Profile
                        </button>
                    </li>
                    <li>
                        <button 
                            onClick={() => handleNavigation('editProfile')}
                            className={activeSection === 'editProfile' ? 'active' : ''}
                        >
                            Edit Profile
                        </button>
                    </li>
                    <li>
                        <button 
                            onClick={() => handleNavigation('complaints')}
                            className={activeSection === 'complaints' ? 'active' : ''}
                        >
                            Complaint Management
                        </button>
                    </li>
                    <li>
                        <button 
                            onClick={() => handleNavigation('reports')}
                            className={activeSection === 'reports' ? 'active' : ''}
                        >
                            Escalation Reports
                        </button>
                    </li>
                </ul>
            </div>

            <div className="main-content">
                <h1>Supervisor Dashboard</h1>

                {/* Navigation Buttons */}
                <div className="navigation-buttons">
                    <button onClick={() => handleNavigation('viewProfile')} className={`nav-button ${activeSection === 'viewProfile' ? 'active' : ''}`}>
                        View Profile
                    </button>
                    <button onClick={() => handleNavigation('editProfile')} className={`nav-button ${activeSection === 'editProfile' ? 'active' : ''}`}>
                        Edit Profile
                    </button>
                    <button onClick={() => handleNavigation('complaints')} className={`nav-button ${activeSection === 'complaints' ? 'active' : ''}`}>
                        Complaint Management
                    </button>
                    <button onClick={() => handleNavigation('reports')} className={`nav-button ${activeSection === 'reports' ? 'active' : ''}`}>
                        Escalation Reports
                    </button>
                </div>

                {/* Conditional Rendering Based on Active Section */}
                <div className="content-area">
                    {activeSection === 'viewProfile' && (
                        <section className="view-profile">
                            <h2>View Profile</h2>
                            {loading && <p className="loading">Loading profile...</p>}
                            {error && <p className="error">Error: {error}</p>}
                            {profile && (
                                <div className="profile-container">
                                    <div className="profile-header">
                                        {currentProfilePhoto ? (
                                            <img src={currentProfilePhoto} alt="Profile" className="profile-photo" />
                                        ) : (
                                            <div className="profile-photo-placeholder">No Photo</div>
                                        )}
                                        <h3 className="full-name">{profile.fullName}</h3>
                                        <p className="user-id">{profile.userId}</p>
                                    </div>
                                    <div className="profile-details">
                                        <div className="detail-item">
                                            <span className="detail-label">Department:</span>
                                            <span className="detail-value">{profile.department}</span>
                                        </div>
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
                                            <span className="detail-label">College:</span>
                                            <span className="detail-value">{profile.college}</span>
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
                             <form onSubmit={handleProfileUpdate}>
                            <div className="profile-photo-edit">
                                <div
                                    className="photo-preview"
                                    onClick={() => document.getElementById('profilePhotoInput').click()}
                                >
                                    {newProfilePreview ? (
                                        <img src={newProfilePreview} alt="Preview" className="profile-image" />
                                    ) : profile?.profilePhoto ? (
                                        <img src={profile.profilePhoto} alt="Current Profile" className="profile-image" />
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
                            <div className="form-fields">
                                <label>
                                    Full Name:
                                    <input
                                        className="narrow-input"
                                        type="text"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    />
                                </label>

                                <label>
                                    Email:
                                    <input
                                        className="narrow-input"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </label>

                                <label>
                                    Phone Number:
                                    <input
                                        type="tel"
                                        value={formData.phoneNumber}
                                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                    />
                                </label>

                                <label>
                                    College:
                                    <select
                                        value={formData.college}
                                        onChange={(e) => {
                                            const selectedCollegeName = e.target.value;
                                            setFormData({ ...formData, college: selectedCollegeName, department: '' });
                                        }}
                                    >
                                        <option value="">Select College</option>
                                        {colleges.map((col) => (
                                            <option key={col.name} value={col.name}>
                                                {col.name}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label>
                                    Department:
                                    <select
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    >
                                        <option value="">Select Department</option>
                                        {availableDepartments.map((dept) => (
                                            <option key={dept} value={dept}>
                                                {dept}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <div className="gender-selection">
                                    <span className='gender'>Gender:</span>
                                    <label>
                                        <input
                                            type="radio"
                                            value="male"
                                            checked={formData.gender === 'male'}
                                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                        />
                                        Male
                                    </label>
                                    <label>
                                        <input
                                            type="radio"
                                            value="female"
                                            checked={formData.gender === 'female'}
                                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                        />
                                        Female
                                    </label>
                                </div>

                                <div className="password-change-section">
                                    <h3>Change Password</h3>

                                    <label>
                                        Current Password:
                                        <input
                                            type="password"
                                            value={formData.currentPassword}
                                            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                                            placeholder="Enter current password"
                                        />
                                    </label>

                                    <label>
                                        New Password:
                                        <input
                                            type="password"
                                            value={formData.newPassword}
                                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                            placeholder="Enter new password (min 6 characters)"
                                        />
                                    </label>

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

                            <button type="submit" disabled={loading}>
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                        </section>
                    )}

                    {activeSection === 'complaints' && (
                        <div className="section">
                            <h2>Complaint Management</h2>
                            <div className="complaints-grid">
                                {complaints.map(complaint => (
                                    <div key={complaint.id} className="complaint-card">
                                        <div className="complaint-header">
                                            <h3>{complaint.title}</h3>
                                            <span className={`status ${complaint.status.toLowerCase().replace(' ', '-')}`}>
                                                {complaint.status}
                                            </span>
                                        </div>
                                        <p>Category: {complaint.category}</p>
                                        <p>Proctor: {complaint.proctor}</p>
                                        <p>Description: {complaint.description}</p>
                                        <div className="action-buttons">
                                            <button onClick={() => setSelectedComplaint(complaint)}>
                                                Manage
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeSection === 'reports' && (
                        <div className="section">
                            <h2>Escalation Reports</h2>
                            <div className="reports-list">
                                {reports.map(report => (
                                    <div key={report.id} className="report-card">
                                        <h3>Report #{report.id}</h3>
                                        <p>Date: {report.date}</p>
                                        <p>Escalated Issues: {report.escalatedCount}</p>
                                        <p>Resolved Complaints: {report.resolvedCount}</p>
                                        <button onClick={() => console.log(report)}>
                                            View Full Details
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {selectedComplaint && (
                        <div className="modal-overlay">
                            <div className="modal-content">
                                <h3>{selectedComplaint.title} Management</h3>
                                <p>Submitted by: {selectedComplaint.proctor}</p>
                                
                                {selectedComplaint.status === "Escalated" ? (
                                    <div className="modal-section">
                                        <p><strong>Escalation Reason:</strong> {selectedComplaint.escalationReason}</p>
                                        <button 
                                            className="resolve-btn"
                                            onClick={() => resolveComplaint(selectedComplaint.id)}
                                        >
                                            Mark as Resolved
                                        </button>
                                    </div>
                                ) : (
                                    <div className="modal-section">
                                        <textarea
                                            placeholder="Reason for escalation..."
                                            value={escalationReason}
                                            onChange={(e) => setEscalationReason(e.target.value)}
                                            rows="4"
                                        />
                                        <div className="modal-actions">
                                            <button 
                                                className="confirm-btn"
                                                onClick={() => escalateToDean(selectedComplaint.id)}
                                            >
                                                Confirm Escalation
                                            </button>
                                            <button 
                                                className="resolve-btn"
                                                onClick={() => resolveComplaint(selectedComplaint.id)}
                                            >
                                                Mark as Resolved
                                            </button>
                                            <button 
                                                className="cancel-btn"
                                                onClick={() => setSelectedComplaint(null)}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SupervisorPage;