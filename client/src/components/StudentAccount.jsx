import React, { useState, useEffect } from 'react';
import '../styles/Student.css';
import { Star, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFlag } from '@fortawesome/free-solid-svg-icons';

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
    const [successMessage, setSuccessMessage] = useState('');
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
    const [currentProfilePhoto, setCurrentProfilePhoto] = useState(null);

    // New state for feedback form
    const [feedbackRating, setFeedbackRating] = useState(0);
    const [feedbackComment, setFeedbackComment] = useState('');
    const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState(false);
    const [feedbackSubmissionStatus, setFeedbackSubmissionStatus] = useState(null);

    // Add new state for complaints
    const [complaints, setComplaints] = useState([]);
    const [loadingComplaints, setLoadingComplaints] = useState(false);
    const [statusNotification, setStatusNotification] = useState(null);

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

        const formData = new FormData();
        formData.append('complaintType', complaintType);
        formData.append('specificInfo', specificInfo);
        formData.append('description', description);
        formData.append('blockNumber', profile?.blockNumber || '');
        formData.append('dormNumber', profile?.dormNumber || '');
        formData.append('userId', profile?.userId || '');
        if (file) {
            formData.append('file', file);
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/complaints', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to submit complaint');
            }

            const data = await response.json();
            setSuccessMessage(`Complaint submitted: ${data.complaintType} - ${data.specificInfo}`);
            setError(null);
            // Reset form fields
            setComplaintType('');
            setSpecificInfo('');
            setDescription('');
            setFile(null);
        } catch (error) {
            setError('Error submitting complaint: ' + (error.message || 'Unknown error'));
            setSuccessMessage('');
        }
    };

    const toggleNav = () => {
        setIsNavActive(!isNavActive);
    };

    // New function for handling feedback submission
    const handleFeedbackSubmit = async (e) => {
        e.preventDefault();
        setIsFeedbackSubmitting(true);
        setFeedbackSubmissionStatus(null);

        // Ensure feedbackRating and feedbackComment are valid
        if (feedbackRating === 0 && !feedbackComment.trim()) {
            setFeedbackSubmissionStatus('error');
            setIsFeedbackSubmitting(false);
            return;
        }

        try {
            const token = localStorage.getItem('token'); // Ensure you have a valid token
            const userId = localStorage.getItem('userId'); // Make sure this is set
            if (!userId) {
                throw new Error('User ID is not available. Please log in.');
            }

            const response = await fetch('http://localhost:5000/api/feedback/submit', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    rating: feedbackRating,
                    comment: feedbackComment,
                    userId: userId, // Pass the userId here
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to submit feedback');
            }

            const data = await response.json();
            console.log('Feedback submitted:', data);
            setFeedbackSubmissionStatus('success');
            setFeedbackRating(0);
            setFeedbackComment('');
        } catch (error) {
            console.error('Error submitting feedback:', error);
            setFeedbackSubmissionStatus('error');
        } finally {
            setIsFeedbackSubmitting(false);
        }
    };

    // New function for handling star clicks
    const handleStarClick = (selectedRating) => {
        setFeedbackRating(selectedRating);
    };

    // Add new function to fetch complaints
    const fetchComplaints = async () => {
        try {
            setLoadingComplaints(true);
            const token = localStorage.getItem('token');
            const userId = profile?.userId;

            if (!userId) {
                throw new Error('User ID not available');
            }

            const response = await fetch(`http://localhost:5000/api/complaints?userId=${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch complaints');
            }

            const data = await response.json();
            setComplaints(data);

            // Check for status changes and show notifications
            data.forEach(complaint => {
                if (complaint.status === 'verified' || complaint.status === 'dismissed' || complaint.isUrgent) {
                    handleStatusNotification(complaint);
                }
            });
        } catch (error) {
            console.error('Error fetching complaints:', error);
            setError('Failed to load complaints');
        } finally {
            setLoadingComplaints(false);
        }
    };

    // Add useEffect to fetch complaints when the component mounts and when activeSection changes
    useEffect(() => {
        if (activeSection === 'complaintStatus') {
            fetchComplaints();
        }
    }, [activeSection, profile?.userId]);

    // Add this function to handle complaint deletion
    const handleDeleteComplaint = async (complaintId) => {
        if (!window.confirm('Are you sure you want to delete this complaint?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/complaints/${complaintId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Delete error response:', errorText);
                throw new Error('Failed to delete complaint');
            }

            // Remove the deleted complaint from the state
            setComplaints(prevComplaints =>
                prevComplaints.filter(complaint => complaint._id !== complaintId)
            );

            alert('Complaint deleted successfully');
        } catch (error) {
            console.error('Error deleting complaint:', error);
            alert('Failed to delete complaint. Please try again.');
        }
    };

    // Add this function to handle status notifications
    const handleStatusNotification = (complaint) => {
        let message = '';
        if (complaint.status === 'verified') {
            message = 'Your complaint has been verified by the proctor.';
        } else if (complaint.status === 'dismissed') {
            message = 'Your complaint has been dismissed by the proctor.';
        }
        if (complaint.isUrgent) {
            message += ' This complaint has been flagged as urgent.';
        }
        setStatusNotification({ message, complaintId: complaint._id });
    };

    // Add this function to close the notification
    const closeStatusNotification = () => {
        setStatusNotification(null);
    };

    return (
        <div className="student-dashboard">
            <div className="student-sidebar">
                <h1>Student Dashboard</h1>
                <ul>
                    <li onClick={() => handleNavigation('complaintForm')}>Complaint Form</li>
                    <li onClick={() => handleNavigation('viewProfile')}>View Profile</li>
                    <li onClick={() => handleNavigation('editProfile')}>Edit Profile</li>
                    <li onClick={() => handleNavigation('complaintStatus')}>Complaint Status</li>
                    <li onClick={() => handleNavigation('provideFeedback')}>Provide Feedback</li>
                </ul>
            </div>

            <div className="student-content">
                <div className="student-top-nav">
                    <span className="student-hamburger" onClick={toggleNav}>
                        {isNavActive ? 'x' : '☰'}
                    </span>
                    <div className={`student-nav-items ${isNavActive ? 'active' : ''}`}>
                        <span onClick={() => handleNavigation('complaintForm')}>Complaint Form</span>
                        <span onClick={() => handleNavigation('viewProfile')}>View Profile</span>
                        <span onClick={() => handleNavigation('editProfile')}>Edit Profile</span>
                        <span onClick={() => handleNavigation('complaintStatus')}>Complaint Status</span>
                        <span onClick={() => handleNavigation('provideFeedback')}>Provide Feedback</span>
                    </div>
                </div>
                {/* Navigation Buttons for Desktop View */}
                <div className="student-desk-nav">
                    <button onClick={() => handleNavigation('complaintForm')}>Complaint Form</button>
                    <button onClick={() => handleNavigation('viewProfile')}>View Profile</button>
                    <button onClick={() => handleNavigation('editProfile')}>Edit Profile</button>
                    <button onClick={() => handleNavigation('complaintStatus')}>Complaint Status</button>
                    <button onClick={() => handleNavigation('provideFeedback')}>Provide Feedback</button>
                </div>

                {activeSection === 'complaintForm' && (
                    <section className="student-complaint-form">
                        <h2>Complaint Form</h2>
                        <form onSubmit={handleSubmitComplaint}>
                            <div className="student-form-groups">
                                <label>User ID:</label>
                                <input
                                    type="text"
                                    value={profile?.userId || ''}
                                    readOnly
                                    className="student-readonly-input"
                                />
                            </div>
                            <div className="student-form-groups">
                                <label>Block Number:</label>
                                <input
                                    type="text"
                                    value={profile?.blockNumber || ''}
                                    readOnly
                                    className="student-readonly-input"
                                />
                            </div>
                            <div className="student-form-groups">
                                <label>Dorm Number:</label>
                                <input
                                    type="text"
                                    value={profile?.dormNumber || ''}
                                    readOnly
                                    className="student-readonly-input"
                                />
                            </div>
                            <label>
                                Type of Problem:
                                <select value={complaintType} onChange={(e) => setComplaintType(e.target.value)} required>
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
                                    required
                                />
                            </label>
                            <label>
                                Description:
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe your complaint..."
                                    required
                                />
                            </label>
                            <label>
                                Upload a Photograph (max 5 MB):
                                <input type="file" accept=".jpg,.png" onChange={handleFileChange} />
                                {fileError && <p className="student-error">{fileError}</p>}
                            </label>
                            <button type="submit">Submit Complaint</button>
                        </form>
                        {successMessage && <p className="student-success">{successMessage}</p>}
                        {error && <p className="student-error">{error}</p>}
                    </section>
                )}

                {activeSection === 'viewProfile' && (
                    <section className="student-view-profile">
                        <h2>View Profile</h2>
                        {loading && <p className="student-loading">Loading profile...</p>}
                        {error && <p className="student-error">Error: {error}</p>}
                        {profile && (
                            <div className="student-profile-container">
                                <div className="student-profile-header">
                                    {currentProfilePhoto ? (
                                        <img
                                            src={currentProfilePhoto}
                                            alt="Profile"
                                            className="student-profile-photo"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                setError('Failed to load profile photo');
                                            }}
                                        />
                                    ) : (
                                        <div className="student-profile-photo-placeholder">No Photo</div>
                                    )}
                                    <h3 className='full-name'>{profile.fullName}</h3>
                                    <p className="user-id">{profile.userId}</p>
                                </div>
                                <div className="student-profile-details">
                                    <div className="student-detail-item">
                                        <span className="student-detail-label">Department:</span>
                                        <span className="student-detail-value">{profile.department}</span>
                                    </div>
                                    <div className="student-detail-item">
                                        <span className="student-detail-label">Email:</span>
                                        <span className="student-detail-value">{profile.email}</span>
                                    </div>
                                    <div className="student-detail-item">
                                        <span className="student-detail-label">Phone Number:</span>
                                        <span className="student-detail-value">{profile.phoneNumber}</span>
                                    </div>
                                    <div className="student-detail-item">
                                        <span className="student-detail-label">Gender:</span>
                                        <span className="student-detail-value">{profile.gender}</span>
                                    </div>
                                    <div className="student-detail-item">
                                        <span className="student-detail-label">College:</span>
                                        <span className="student-detail-value">{profile.college}</span>
                                    </div>
                                    <div className="student-detail-item">
                                        <span className="student-detail-label">Account Created:</span>
                                        <span className="student-detail-value">
                                            {new Date(profile.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {activeSection === 'editProfile' && (
                    <section className="student-edit-profile">
                        <h2>Edit Profile</h2>
                        {loading && <p className="student-loading">Saving changes...</p>}
                        {error && <p className="student-error">Error: {error}</p>}

                        <form onSubmit={handleProfileUpdate}>
                            <div className="student-profile-photo-edit">
                                <div
                                    className="student-photo-preview"
                                    onClick={() => document.getElementById('profilePhotoInput').click()}
                                >
                                    {newProfilePreview ? (
                                        <img src={newProfilePreview} alt="Preview" className="student-profile-image" />
                                    ) : profile?.profilePhoto ? (
                                        <img src={profile.profilePhoto} alt="Current Profile" className="student-profile-image" />
                                    ) : (
                                        <div className="student-upload-placeholder">
                                            <span className="student-upload-icon">+</span>
                                            <span className="student-upload-text">Upload Photo</span>
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
                                {fileError && <p className="student-error">{fileError}</p>}
                            </div>
                            <div className="student-form-fields">
                                <label>
                                    Full Name:
                                    <input
                                        className="student-narrow-input"
                                        type="text"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    />
                                </label>

                                <label>
                                    Email:
                                    <input
                                        className="student-narrow-input"
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

                                <div className="student-gender-selection">
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

                                <div className="student-password-change-section">
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
                    <motion.section
                        className="student-feedback-section"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h2 className="student-feedback-title">Provide Feedback</h2>
                        <form onSubmit={handleFeedbackSubmit} className="student-feedback-form">
                            <div className="student-star-rating" style={{ gap: '18px' }}> {/* Added gap here */}
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <motion.button
                                        key={star}
                                        type="button"
                                        onClick={() => handleStarClick(star)}
                                        whileHover={{ scale: 1.2 }}
                                        whileTap={{ scale: 0.9 }}
                                        className={star <= feedbackRating ? 'star active' : 'star'}
                                        aria-label={`Rate ${star} stars`}
                                    >
                                        <Star
                                            color={star <= feedbackRating ? '#FFD700' : '#ddd'}
                                        />
                                    </motion.button>
                                ))}
                                <p className="student-rating-text">
                                    {feedbackRating
                                        ? `Rated ${feedbackRating} ${feedbackRating === 1 ? 'star' : 'stars'}`
                                        : 'Click to rate'}
                                </p>
                            </div>

                            <textarea
                                placeholder="Provide your feedback..."
                                value={feedbackComment}
                                onChange={(e) => setFeedbackComment(e.target.value)}
                                className="student-feedback-textarea"
                                rows={4}
                                disabled={isFeedbackSubmitting}
                            />
                            <AnimatePresence>
                                {feedbackSubmissionStatus === 'error' && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="student-error-message"
                                    >
                                        Please provide a rating or feedback comment.
                                    </motion.p>
                                )}
                            </AnimatePresence>

                            <button type="submit" disabled={isFeedbackSubmitting} className="student-feedback-button">
                                {isFeedbackSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" />
                                        Submit Feedback
                                    </>
                                )}
                            </button>

                            <AnimatePresence>
                                {feedbackSubmissionStatus === 'success' && (
                                    <motion.p
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="student-success-message"
                                    >
                                        Thank you for your feedback!
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </form>
                    </motion.section>
                )}

                {activeSection === 'complaintStatus' && (
                    <section className="student-complaint-status">
                        <h2>Complaint Status</h2>
                        {loadingComplaints ? (
                            <p>Loading complaints...</p>
                        ) : complaints.length === 0 ? (
                            <p>No complaints submitted yet.</p>
                        ) : (
                            <div className="student-complaints-list">
                                {complaints.map((complaint) => (
                                    <div key={complaint._id} className={`student-complaint-card ${complaint.isUrgent ? 'urgent' : ''}`}>
                                        <div className="student-complaint-header">
                                            <h3>{complaint.complaintType}</h3>
                                            <div className="student-complaint-status">
                                                <span className={`student-status-badge ${complaint.status?.toLowerCase() || 'pending'}`}>
                                                    {complaint.status || 'Pending'}
                                                </span>
                                                {complaint.isUrgent && (
                                                    <span className="student-status-badge urgent">
                                                        <FontAwesomeIcon icon={faFlag} /> Urgent
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="student-complaint-details">
                                            <p><strong>Specific Issue:</strong> {complaint.specificInfo}</p>
                                            <p><strong>Description:</strong> {complaint.description}</p>
                                            <p><strong>Block:</strong> {complaint.blockNumber}</p>
                                            <p><strong>Dorm:</strong> {complaint.dormNumber}</p>
                                            <p><strong>Submitted:</strong> {new Date(complaint.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        {complaint.file && (
                                            <div className="student-complaint-image">
                                                <img
                                                    src={`http://localhost:5000/${complaint.file}`}
                                                    alt="Complaint evidence"
                                                    className="student-complaint-photo"
                                                />
                                            </div>
                                        )}
                                        <div className="student-complaint-actions">
                                            <button
                                                className="student-delete-btn"
                                                onClick={() => handleDeleteComplaint(complaint._id)}
                                            >
                                                Delete Complaint
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}
            </div>

            {statusNotification && (
                <div className="student-status-notification">
                    <p>{statusNotification.message}</p>
                    <button onClick={closeStatusNotification}>OK</button>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
