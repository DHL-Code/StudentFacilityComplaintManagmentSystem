import React, { useState, useEffect } from 'react';
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

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        department: '',
        gender: '',
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
        college: ''
    });
    const [newProfilePhoto, setNewProfilePhoto] = useState(null);
    const [newProfilePreview, setNewProfilePreview] = useState(null);
    const [isNavActive, setIsNavActive] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [colleges, setColleges] = useState([
        {
            name: "Computing and Informatics",
            departments: ["Computer Science", "Software Engineering", "Information Technology", "Information Systems"],
        },
        {
            name: "Engineering",
            departments: ["Electrical Engineering", "Mechanical Engineering", "Civil Engineering", "Chemical Engineering"],
        },
        {
            name: "Business",
            departments: ["Business Administration", "Accounting", "Marketing", "Finance"],
        },
    ]);
    const [availableDepartments, setAvailableDepartments] = useState([]);
    const [currentProfilePhoto, setCurrentProfilePhoto] = useState(null); // Added state for current photo URL

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleNavigation = (section) => {
        setActiveSection(section);
        setIsNavActive(false);
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

        if (formData.currentPassword || formData.newPassword || formData.confirmNewPassword) {
            if (formData.newPassword !== formData.confirmNewPassword) {
                setError("New passwords don't match");
                setLoading(false);
                return;
            }
            if (formData.newPassword.length < 6) {
                setError("Password must be at least 6 characters");
                setLoading(false);
                return;
            }
        }

        const formPayload = new FormData();
        formPayload.append('fullName', formData.fullName);
        formPayload.append('email', formData.email);
        formPayload.append('phoneNumber', formData.phoneNumber);
        formPayload.append('department', formData.department);
        formPayload.append('gender', formData.gender);
        formPayload.append('college', formData.college);
        if (newProfilePhoto) formPayload.append('profilePhoto', newProfilePhoto);
        if (formData.currentPassword) {
            formPayload.append('currentPassword', formData.currentPassword);
            formPayload.append('newPassword', formData.newPassword);
        }

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
                throw new Error(errorData.message || 'Update failed');
            }
            const data = await response.json();

            // Update currentProfilePhoto *before* setting profile
            setCurrentProfilePhoto(data.user.profilePhoto);
            setProfile(data.user);

            // Only reset preview if a *new* photo was NOT uploaded
            if (!newProfilePhoto) {
                setNewProfilePreview(null);
            }

            alert('Profile updated successfully');

            setFormData({
                fullName: data.user.fullName,
                email: data.user.email,
                phoneNumber: data.user.phoneNumber,
                department: data.user.department,
                gender: data.user.gender,
                currentPassword: '',
                newPassword: '',
                confirmNewPassword: '',
                college: data.user.college
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
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
            // Update currentProfilePhoto *before* setting profile
            setCurrentProfilePhoto(data.profilePhoto);
            setProfile(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (formData.college) {
            const selectedCollege = colleges.find((col) => col.name === formData.college);
            if (selectedCollege) {
                setAvailableDepartments(selectedCollege.departments);
            } else {
                setAvailableDepartments([]);
            }
        } else {
            setAvailableDepartments([]);
        }
    }, [formData.college, colleges]);

    useEffect(() => {
        fetchProfile();
    }, []);

    useEffect(() => {
        if (profile && activeSection === 'editProfile') {
            setFormData({
                fullName: profile.fullName,
                email: profile.email,
                phoneNumber: profile.phoneNumber,
                department: profile.department,
                gender: profile.gender,
                currentPassword: '',
                newPassword: '',
                confirmNewPassword: '',
                college: profile.college
            });
            const selectedCollege = colleges.find((col) => col.name === profile.college);
            if (selectedCollege) {
                setAvailableDepartments(selectedCollege.departments);
            } else {
                setAvailableDepartments([]);
            }
        }
    }, [profile, activeSection, colleges]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            const isValidType = selectedFile.type === 'image/jpeg' || selectedFile.type === 'image/png';
            const isValidSize = selectedFile.size <= 5 * 1024 * 1024;

            if (isValidType && isValidSize) {
                setFile(selectedFile);
                setNewProfilePhoto(selectedFile);
                const reader = new FileReader();
                reader.onloadend = () => setNewProfilePreview(reader.result);
                reader.readAsDataURL(selectedFile);
                setFileError('');
            } else {
                setFileError('File must be a JPG or PNG and less than 5 MB.');
            }
        }
    };

    const handleSubmitComplaint = async (e) => {
        e.preventDefault();

        const userId = localStorage.getItem('userId');
        if (!userId) {
            alert('User not logged in. Please log in to submit a complaint.');
            return;
        }

        const formData = new FormData();
        formData.append('userId', userId);
        formData.append('complaintType', complaintType);
        formData.append('specificInfo', specificInfo);
        formData.append('description', description);
        if (file) {
            formData.append('file', file);
        }

        try {
            const response = await fetch('http://localhost:5000/api/complaints/submit', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to submit complaint');
            }

            const data = await response.json();
            alert('Complaint submitted successfully');
        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'An error occurred. Please try again.');
        }
    };

    const toggleNav = () => {
        setIsNavActive(!isNavActive);
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
                    <span className="hamburger" onClick={toggleNav}>
                        {isNavActive ? 'x' : '☰'}
                    </span>
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
                                            setFormData({...formData, college: selectedCollegeName, department: ''});
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
                                         onChange={(e) => setFormData({...formData, department: e.target.value})}
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
