import React, { useState } from 'react';
import '../styles/Student.css';

const Dashboard = () => {
    const [activeSection, setActiveSection] = useState('complaintForm');
    const [complaintType, setComplaintType] = useState('');
    const [specificInfo, setSpecificInfo] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState(null);
    const [fileError, setFileError] = useState('');
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isNavActive, setIsNavActive] = useState(false); // State for mobile navigation visibility

    const handleNavigation = (section) => {
        setActiveSection(section);
        setIsNavActive(false); // Close mobile nav when navigating
        if (section === 'viewProfile' && !profile) {
            fetchProfile();
        }
    };

    const fetchProfile = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No token found. Please log in.');
            }

            const response = await fetch('http://localhost:5000/api/auth/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to fetch profile. Status: ${response.status}`);
            }

            const data = await response.json();
            setProfile(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            const isValidType = selectedFile.type === 'image/jpeg' || selectedFile.type === 'image/png';
            const isValidSize = selectedFile.size <= 5 * 1024 * 1024; // 5 MB

            if (isValidType && isValidSize) {
                setFile(selectedFile);
                setFileError('');
            } else {
                setFileError('File must be a JPG or PNG and less than 5 MB.');
            }
        }
    };

    const handleSubmitComplaint = (e) => {
        e.preventDefault();
        alert(`Complaint submitted:\nType: ${complaintType}\nDetails: ${specificInfo}\nDescription: ${description}\nFile: ${file?.name}`);
    };

    const toggleNav = () => {
        setIsNavActive(!isNavActive); // Toggle mobile navigation visibility
    };

    return (
        <div className="dashboard">
            <div className="sidebar">
                <h1>Student Dashboard</h1>
                <ul>
                    <li onClick={() => handleNavigation('complaintForm')}>Complaint Form</li>
                    <li onClick={() => handleNavigation('viewProfile')}>View Profile</li>
                    <li onClick={() => handleNavigation('editProfile')}>Edit Profile</li>
                    <li onClick={() => handleNavigation('provideFeedback')}>Provide Feedback</li>
                </ul>
            </div>

            <div className="content">
                <div className="top-nav">
                    <span className="hamburger" onClick={toggleNav}>☰</span> {/* Hamburger icon for mobile */}
                    <div className={`nav-items ${isNavActive ? 'active' : ''}`}>
                        <span onClick={() => handleNavigation('complaintForm')}>Complaint Form</span>
                        <span onClick={() => handleNavigation('viewProfile')}>View Profile</span>
                        <span onClick={() => handleNavigation('editProfile')}>Edit Profile</span>
                        <span onClick={() => handleNavigation('provideFeedback')}>Provide Feedback</span>
                    </div>
                </div>

                {/* Navigation Buttons for Desktop View */}
                <div className="desktop-nav">
                    <button onClick={() => handleNavigation('complaintForm')}>Complaint Form</button>
                    <button onClick={() => handleNavigation('viewProfile')}>View Profile</button>
                    <button onClick={() => handleNavigation('editProfile')}>Edit Profile</button>
                    <button onClick={() => handleNavigation('provideFeedback')}>Provide Feedback</button>
                </div>

                {activeSection === 'complaintForm' && (
                    <section className="complaint-form">
                        <h2>Complaint Form</h2>
                        <form onSubmit={handleSubmitComplaint}>
                            <label>
                                Type of Problem:
                                <select value={complaintType} onChange={(e) => setComplaintType(e.target.value)}>
                                    <option value="">Select...</option>
                                    <option value="Electricity">Electricity</option>
                                    <option value="Toilet Problem">Toilet Problem</option>
                                    <option value="Water Pipe Issue">Water Pipe Issue</option>
                                </select>
                            </label>
                            <label>
                                Specific Information:
                                <input
                                    type="text"
                                    value={specificInfo}
                                    onChange={(e) => setSpecificInfo(e.target.value)}
                                    placeholder="e.g., socket, wire, bulb..."
                                />
                            </label>
                            <label>
                                Description:
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe your complaint..."
                                />
                            </label>
                            <label>
                                Upload a Photograph (max 5 MB):
                                <input type="file" accept=".jpg,.png" onChange={handleFileChange} />
                                {fileError && <p className="error">{fileError}</p>}
                            </label>
                            <button type="submit">Submit Complaint</button>
                        </form>
                    </section>
                )}

                {activeSection === 'viewProfile' && (
                    <section className="view-profile">
                        <h2>View Profile</h2>
                        {loading && <p className="loading">Loading profile...</p>}
                        {error && <p className="error">Error: {error}</p>}
                        {profile && (
                            <div className="profile-container">
                                <div className="profile-header">
                                    {profile.profilePhoto ? (
                                        <img
                                            src={profile.profilePhoto}
                                            alt="Profile"
                                            className="profile-photo"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                setError('Failed to load profile photo');
                                            }}
                                        />
                                    ) : (
                                        <div className="profile-photo-placeholder">No Photo</div>
                                    )}
                                    <h3 className='full-name'>{profile.fullName}</h3>
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
                        <form>
                            <label>
                                Name:
                                <input type="text" defaultValue="Alex Johnson" />
                            </label>
                            <label>
                                Email:
                                <input type="email" defaultValue="alex.johnson@student.com" />
                            </label>
                            <button type="submit">Save Changes</button>
                        </form>
                    </section>
                )}

                {activeSection === 'provideFeedback' && (
                    <section className="provide-feedback">
                        <h2>Provide Feedback</h2>
                        <form>
                            <textarea placeholder="Provide your feedback..." />
                            <button type="submit">Submit Feedback</button>
                        </form>
                    </section>
                )}
            </div>
        </div>
    );
};

export default Dashboard;