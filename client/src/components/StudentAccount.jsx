import React, { useState, useEffect } from 'react';
import NotificationBell from '../components/NotificationBell';
import '../styles/Student.css';
import { Star, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCommentDots, faMoon, faSun, faBell, faSignOutAlt, faExpand, faTimes, faUser, faChalkboardTeacher, faCalendarAlt, faBook, faCog, faHome, faStar } from '@fortawesome/free-solid-svg-icons';
import { faFlag } from '@fortawesome/free-solid-svg-icons';
import { FaBars } from 'react-icons/fa';

const Dashboard = () => {
    const [activeSection, setActiveSection] = useState('dashboard');
    const [complaintType, setComplaintType] = useState('');
    const [specificInfo, setSpecificInfo] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState(null);
    const [fileError, setFileError] = useState('');
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [newProfilePhoto, setNewProfilePhoto] = useState(null);
    const [newProfilePreview, setNewProfilePreview] = useState(null);
    const [isNavActive, setIsNavActive] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [currentProfilePhoto, setCurrentProfilePhoto] = useState(null);
    const [unreadStatusUpdates, setUnreadStatusUpdates] = useState([]);

    const [allColleges, setAllColleges] = useState([]); // For dynamic colleges
    const [loadingColleges, setLoadingColleges] = useState(false);
    const [loadingDepartments, setLoadingDepartments] = useState(false);
    const [availableDepartments, setAvailableDepartments] = useState([]);

    // New state for feedback form
    const [feedbackRating, setFeedbackRating] = useState(0);
    const [feedbackComment, setFeedbackComment] = useState('');
    const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState(false);
    const [feedbackSubmissionStatus, setFeedbackSubmissionStatus] = useState(null);

    // Add new state for complaints
    const [complaints, setComplaints] = useState([]);
    const [loadingComplaints, setLoadingComplaints] = useState(false);
    const [formData, setFormData] = useState({
        fullName: profile?.fullName || '',
        email: profile?.email || '',
        phoneNumber: profile?.phoneNumber || '',
        department: profile?.department || '',
        gender: profile?.gender || '',
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
        college: profile?.college || ''
    });

    const [feedbackStatus, setFeedbackStatus] = useState([]);

    // Validation helpers
    const validateName = (name) => /^[A-Za-z ]+$/.test(name.trim());
    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const validatePhone = (phone) => {
        if (phone.startsWith('09')) return /^09\d{8}$/.test(phone);
        if (phone.startsWith('+251')) return /^\+251\d{9,10}$/.test(phone);
        return false;
    };
    const validatePassword = (password) => {
        if (!password) return true; // allow blank if not changing
        return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[!@#$%^&*]/.test(password);
    };

    const [editErrors, setEditErrors] = useState({});

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
        const errors = {};
        if (!validateName(formData.fullName)) errors.fullName = 'Name must contain only letters and spaces.';
        if (!validateEmail(formData.email)) errors.email = 'Invalid email address.';
        if (!validatePhone(formData.phoneNumber)) errors.phoneNumber = 'Phone must be 10 digits (09...) or 13 digits (+251...)';
        if (formData.newPassword && !validatePassword(formData.newPassword)) errors.newPassword = 'Password must be 8+ chars, upper, lower, number, special.';
        if (formData.newPassword !== formData.confirmNewPassword) errors.confirmNewPassword = 'Passwords do not match.';
        setEditErrors(errors);
        if (Object.keys(errors).length > 0) return;
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
        const fetchColleges = async () => {
            try {
                setLoadingColleges(true);
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:5000/api/colleges', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) throw new Error('Failed to fetch colleges');

                const data = await response.json();
                setAllColleges(data);
            } catch (error) {
                console.error('Error fetching colleges:', error);
                setError('Failed to load colleges');
            } finally {
                setLoadingColleges(false);
            }
        };

        fetchColleges();
    }, []);

    // Update departments when college changes
    useEffect(() => {
        const fetchDepartments = async (collegeName) => {
            try {
                setLoadingDepartments(true);
                setError(null);

                if (!collegeName) {
                    setAvailableDepartments([]);
                    return;
                }

                console.log(`Fetching departments for college: ${collegeName}`);
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:5000/api/colleges/${collegeName}/departments`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch departments');
                }

                const data = await response.json();
                console.log(`Departments fetched: ${data.length}`);
                setAvailableDepartments(data);
            } catch (error) {
                console.error('Error fetching departments:', error);
                setError(error.message || 'Failed to load departments');
            } finally {
                setLoadingDepartments(false);
            }
        };

        if (formData.college) {
            // Find the college ID from the selected college name
            if (formData.college) {
                fetchDepartments(formData.college); // This should be the college name
            }
        }
    }, [formData.college]);

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

            // Fetch departments for the current college
            if (profile.college) {
                fetchDepartments(profile.college);
            }
        }
    }, [profile, activeSection]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            const validTypes = [
                'image/jpeg', 'image/png',
                'audio/mpeg', 'audio/wav', 'audio/mp3',
                'video/mp4', 'video/quicktime', 'video/x-msvideo'
            ];
            const isValidType = validTypes.includes(selectedFile.type);
            const isValidSize = selectedFile.size <= 50 * 1024 * 1024; // 50MB limit

            if (isValidType && isValidSize) {
                setFile(selectedFile);
                setNewProfilePhoto(selectedFile);
                const reader = new FileReader();
                reader.onloadend = () => setNewProfilePreview(reader.result);
                reader.readAsDataURL(selectedFile);
                setFileError('');
            } else {
                setFileError('File must be an image (JPG/PNG), audio (MP3/WAV), or video (MP4/MOV/AVI) and less than 50MB');
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

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/feedback/submit', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    rating: feedbackRating,
                    comment: feedbackComment,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to submit feedback');
            }

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

            // Try to get userId from profile state first
            let userId = profile?.userId;

            // If not available in profile state, try to get from localStorage
            if (!userId) {
                const storedProfile = localStorage.getItem('userProfile');
                if (storedProfile) {
                    const parsedProfile = JSON.parse(storedProfile);
                    userId = parsedProfile.userId;
                }
            }

            if (!userId) {
                throw new Error('User ID not available');
            }

            // Add userId as a query parameter
            const response = await fetch(`http://localhost:5000/api/complaints?userId=${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error('Failed to fetch complaints');

            const data = await response.json();
            setComplaints(data);
        } catch (error) {
            console.error('Error fetching complaints:', error);
            setError(error.message);
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

    useEffect(() => {
        if (availableDepartments.length > 0) {
            setError(null); // Clear error if we have departments
        }
    }, [availableDepartments]);

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

    // Toggle dark mode
    const toggleDarkMode = () => {
        const newDarkMode = !darkMode;
        setDarkMode(newDarkMode);
        document.body.classList.toggle('dark-mode', newDarkMode);
        localStorage.setItem('darkMode', newDarkMode ? 'enabled' : 'disabled');
    };
    useEffect(() => {
        const savedMode = localStorage.getItem('darkMode');
        if (savedMode === 'enabled') {
            setDarkMode(true);
            document.body.classList.add('dark-mode');
        }
    }, []);


    // Handle logout
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };
    const fetchColleges = async () => {
        try {
            setLoadingColleges(true);
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/colleges', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error('Failed to fetch colleges');

            const data = await response.json();
            setAllColleges(data);
        } catch (error) {
            console.error('Error fetching colleges:', error);
            setError('Failed to load colleges');
        } finally {
            setLoadingColleges(false);
        }
    };

    const fetchDepartments = async (collegeName) => {
        try {
            setLoadingDepartments(true);
            setError(null);

            if (!collegeName) {
                setAvailableDepartments([]);
                return;
            }

            console.log(`Fetching departments for college: ${collegeName}`);
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/colleges/${collegeName}/departments`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch departments');
            }

            const data = await response.json();
            console.log(`Departments fetched: ${data.length}`);
            setAvailableDepartments(data);
        } catch (error) {
            console.error('Error fetching departments:', error);
            setError(error.message || 'Failed to load departments');
        } finally {
            setLoadingDepartments(false);
        }
    };

    // Fetch unread status updates
    const fetchUnreadStatusUpdates = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                'http://localhost:5000/api/complaints/unread-status-updates',
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (response.ok) {
                const data = await response.json();
                setUnreadStatusUpdates(data);
            }
        } catch (error) {
            console.error('Error fetching unread status updates:', error);
        }
    };

    useEffect(() => {
        if (activeSection === 'complaintStatus') {
            fetchUnreadStatusUpdates();

            // Set up polling every 30 seconds
            const interval = setInterval(fetchUnreadStatusUpdates, 30000);
            return () => clearInterval(interval);
        }
    }, [activeSection]);

    // Mark status update as viewed
    const markStatusUpdateAsRead = async (complaintId, updateId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `http://localhost:5000/api/complaints/${complaintId}/status-updates/${updateId}/view`,
                {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            if (response.ok) {
                setUnreadStatusUpdates(prev =>
                    prev.filter(update => update._id !== updateId)
                );
            }
        } catch (error) {
            console.error('Error marking status update as read:', error);
        }
    };

    useEffect(() => {
        // Check URL parameters for section
        const urlParams = new URLSearchParams(window.location.search);
        const section = urlParams.get('section');
        if (section === 'complaintStatus') {
            setActiveSection('complaintStatus');
        }
    }, []);

    const fetchFeedbackStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/feedback', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                throw new Error('Failed to fetch feedback status');
            }
            const data = await response.json();
            // Filter feedback for current student
            const studentFeedback = data.filter(f => f.userId === profile?.userId);
            setFeedbackStatus(studentFeedback);
        } catch (error) {
            console.error('Error fetching feedback status:', error);
        }
    };

    useEffect(() => {
        if (profile?.userId) {
            fetchFeedbackStatus();
        }
    }, [profile?.userId]);

    // Add useEffect to auto-clear error and success messages
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [error]);
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    // Add a function to close sidebar when clicking outside
    useEffect(() => {
        if (!isSidebarOpen) return;
        const handleClick = (e) => {
            if (e.target.closest('.mobile-sidebar') || e.target.closest('.hamburger-icon')) return;
            setIsSidebarOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [isSidebarOpen]);

    return (
        <div className={`student-dashboard-modern${darkMode ? ' dark' : ''}`}>
            {/* Hamburger for mobile */}
            <div className="hamburger-icon" style={{
                display: 'none',
                position: 'fixed',
                top: 24,
                left: 18,
                zIndex: 2000
            }}
            onClick={() => setIsSidebarOpen(true)}
            >
                <FaBars size={28} color="#fba53b" />
            </div>
            {/* Sidebar for desktop */}
            <aside className="modern-sidebar">
                <div className="sidebar-header">
                    <span className="sidebar-logo">Student Dashboard</span>
                </div>
                <nav className="sidebar-nav">
                    <ul>
                        <li className={activeSection === 'dashboard' ? 'active' : ''} onClick={() => handleNavigation('dashboard')}>
                            <FontAwesomeIcon icon={faHome} /> <span>Dashboard</span>
                        </li>
                        <li className={activeSection === 'complaintForm' ? 'active' : ''} onClick={() => handleNavigation('complaintForm')}>
                            <FontAwesomeIcon icon={faCommentDots} /> <span>Complaint Form</span>
                        </li>
                        <li className={activeSection === 'viewProfile' ? 'active' : ''} onClick={() => handleNavigation('viewProfile')}>
                            <FontAwesomeIcon icon={faUser} /> <span>View Profile</span>
                        </li>
                        <li className={activeSection === 'editProfile' ? 'active' : ''} onClick={() => handleNavigation('editProfile')}>
                            <FontAwesomeIcon icon={faCog} /> <span>Edit Profile</span>
                        </li>
                        <li className={activeSection === 'complaintStatus' ? 'active' : ''} onClick={() => handleNavigation('complaintStatus')}>
                            <FontAwesomeIcon icon={faBook} /> <span>Complaint Status</span>
                        </li>
                        <li className={activeSection === 'provideFeedback' ? 'active' : ''} onClick={() => handleNavigation('provideFeedback')}>
                            <FontAwesomeIcon icon={faStar} /> <span>Feedback</span>
                        </li>
                    </ul>
                </nav>
                <div className="sidebar-footer">
                    <button className="logout-btn" onClick={handleLogout}>
                        <FontAwesomeIcon icon={faSignOutAlt} /> Log Out
                    </button>
                </div>
            </aside>
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div className="mobile-sidebar-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(0,0,0,0.4)',
                    zIndex: 2100
                }}>
                    <nav className="mobile-sidebar" style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '75vw',
                        maxWidth: 320,
                        height: '100vh',
                        background: 'linear-gradient(135deg, #232a4d 60%, #2e2e54 100%)',
                        color: '#fff',
                        boxShadow: '2px 0 16px rgba(30,40,90,0.15)',
                        borderRadius: '0 32px 32px 0',
                        zIndex: 2200,
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '32px 0 0 0'
                    }}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px 24px 32px'}}>
                            <span className="sidebar-logo" style={{fontSize: '2rem', color: '#fba53b'}}>Student Dashboard</span>
                            <button style={{background: 'none', border: 'none', color: '#fff', fontSize: 28, cursor: 'pointer'}} onClick={() => setIsSidebarOpen(false)}>&times;</button>
                        </div>
                        <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
                            <li className={activeSection === 'dashboard' ? 'active' : ''} onClick={() => { handleNavigation('dashboard'); setIsSidebarOpen(false); }} style={{padding: '14px 32px', cursor: 'pointer'}}>
                                <FontAwesomeIcon icon={faHome} /> <span>Dashboard</span>
                            </li>
                            <li className={activeSection === 'complaintForm' ? 'active' : ''} onClick={() => { handleNavigation('complaintForm'); setIsSidebarOpen(false); }} style={{padding: '14px 32px', cursor: 'pointer'}}>
                                <FontAwesomeIcon icon={faCommentDots} /> <span>Complaint Form</span>
                            </li>
                            <li className={activeSection === 'viewProfile' ? 'active' : ''} onClick={() => { handleNavigation('viewProfile'); setIsSidebarOpen(false); }} style={{padding: '14px 32px', cursor: 'pointer'}}>
                                <FontAwesomeIcon icon={faUser} /> <span>View Profile</span>
                            </li>
                            <li className={activeSection === 'editProfile' ? 'active' : ''} onClick={() => { handleNavigation('editProfile'); setIsSidebarOpen(false); }} style={{padding: '14px 32px', cursor: 'pointer'}}>
                                <FontAwesomeIcon icon={faCog} /> <span>Edit Profile</span>
                            </li>
                            <li className={activeSection === 'complaintStatus' ? 'active' : ''} onClick={() => { handleNavigation('complaintStatus'); setIsSidebarOpen(false); }} style={{padding: '14px 32px', cursor: 'pointer'}}>
                                <FontAwesomeIcon icon={faBook} /> <span>Complaint Status</span>
                            </li>
                            <li className={activeSection === 'provideFeedback' ? 'active' : ''} onClick={() => { handleNavigation('provideFeedback'); setIsSidebarOpen(false); }} style={{padding: '14px 32px', cursor: 'pointer'}}>
                                <FontAwesomeIcon icon={faStar} /> <span>Feedback</span>
                            </li>
                            <li style={{padding: '14px 32px', cursor: 'pointer'}} onClick={() => { handleLogout(); setIsSidebarOpen(false); }}>
                                <FontAwesomeIcon icon={faSignOutAlt} /> <span>Log Out</span>
                            </li>
                        </ul>
                    </nav>
                </div>
            )}
            <main className="modern-main-content">
                <header className="modern-topbar">
                    <div className="topbar-left">
                        {/* Search bar removed */}
                    </div>
                    <div className="topbar-right">
                     
                        <NotificationBell userId={profile?.userId} className="notification-bell" />
                        <button className="dark-mode-toggle" onClick={toggleDarkMode}>
                            <FontAwesomeIcon icon={darkMode ? faSun : faMoon} />
                        </button>
                        <div className="modern-profile-avatar">
                            {currentProfilePhoto ? (
                                <img src={currentProfilePhoto} alt="Profile" />
                            ) : (
                                <FontAwesomeIcon icon={faUser} />
                            )}
                            <span>{profile?.fullName?.split(' ')[0] || 'Student'}</span>
                        </div>
                    </div>
                </header>

                {activeSection === 'dashboard' && (
                    <section className="modern-dashboard-overview">
                        <div className="modern-welcome-card awesome-welcome">
                            <div className="welcome-text">
                                <h2>Welcome, {profile?.fullName?.split(' ')[0] || 'Student'}!</h2>
                                <p>
                                    We're glad to have you here. This is your space to manage your facility complaints, update your profile, and provide feedback to help us improve your campus experience.<br /><br />
                                    <strong>Tip:</strong> Use the sidebar to quickly access all features. If you have any issues, don't hesitate to submit a complaint or reach out for support. Your comfort and satisfaction matter!
                                </p>
                                <p style={{marginTop: '18px', fontWeight: 500, color: '#fba53b'}}>Have a great day and make your voice heard!</p>
                            </div>

                        </div>
                    </section>
                )}

                {activeSection !== 'dashboard' && (
                    <div className="student-content">
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
                                            <option value="Bed">Bed</option>
                                            <option value="Locker">Locker</option>
                                            <option value="Pillow">Pillow</option>
                                            <option value="Furniture">Furniture</option>
                                            <option value="Cheapwood">Cheapwood</option>
                                            <option value="Bulb">Bulb</option>
                                            <option value="Socket">Socket</option>
                                            <option value="Mattress">Mattress</option>
                                            <option value="Other">Other</option>
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
                                        Upload Evidence (Image/Audio/Video, max 50MB):
                                        <input 
                                            type="file" 
                                            accept=".jpg,.png,.mp3,.wav,.mp4,.mov,.avi" 
                                            onChange={handleFileChange} 
                                        />
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
                                            ) : currentProfilePhoto ? (
                                                <img src={currentProfilePhoto} alt="Current Profile" className="student-profile-image" />
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
                                                value={formData.fullName || ''}
                                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                            />
                                            {editErrors.fullName && <span className="error-message">{editErrors.fullName}</span>}
                                        </label>

                                        <label>
                                            Email:
                                            <input
                                                className="student-narrow-input"
                                                type="email"
                                                value={formData.email || ''}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            />
                                            {editErrors.email && <span className="error-message">{editErrors.email}</span>}
                                        </label>

                                        <label>
                                            Phone Number:
                                            <input
                                                type="tel"
                                                value={formData.phoneNumber || ''}
                                                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                            />
                                            {editErrors.phoneNumber && <span className="error-message">{editErrors.phoneNumber}</span>}
                                        </label>

                                        <label>
                                            College:
                                            <select
                                                value={formData.college || ''}
                                                onChange={(e) => {
                                                    const selectedCollegeName = e.target.value;
                                                    setFormData({ ...formData, college: selectedCollegeName, department: '' });
                                                }}
                                                disabled={loadingColleges}
                                            >
                                                <option value="">
                                                    {loadingColleges ? 'Loading colleges...' : 'Select College'}
                                                </option>
                                                {allColleges?.length > 0 ? (
                                                    allColleges.map((college) => (
                                                        <option key={college._id} value={college.name}>
                                                            {college.name}
                                                        </option>
                                                    ))
                                                ) : (
                                                    <option value="" disabled>
                                                        No colleges available
                                                    </option>
                                                )}
                                            </select>
                                        </label>

                                        <label>
                                            Department:
                                            <select
                                                value={formData.department || ''}
                                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                                disabled={!formData.college || loadingDepartments}
                                            >
                                                <option value="">
                                                    {loadingDepartments
                                                        ? 'Loading departments...'
                                                        : !formData.college
                                                            ? 'Select a college first'
                                                            : availableDepartments?.length === 0
                                                                ? 'No departments available'
                                                                : 'Select Department'}
                                                </option>
                                                {availableDepartments?.length > 0 &&
                                                    availableDepartments.map((dept) => (
                                                        <option 
                                                            key={dept._id} 
                                                            value={dept.name}
                                                            selected={dept.name === profile?.department}
                                                        >
                                                            {dept.name}
                                                        </option>
                                                    ))
                                                }
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
                                                    placeholder="Enter new password (min 8 chars, upper, lower, number, special)"
                                                />
                                                {editErrors.newPassword && <span className="error-message">{editErrors.newPassword}</span>}
                                            </label>

                                            <label>
                                                Confirm New Password:
                                                <input
                                                    type="password"
                                                    value={formData.confirmNewPassword}
                                                    onChange={(e) => setFormData({ ...formData, confirmNewPassword: e.target.value })}
                                                    placeholder="Confirm new password"
                                                />
                                                {editErrors.confirmNewPassword && <span className="error-message">{editErrors.confirmNewPassword}</span>}
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
                                <h2 className="student-feedback-title">
                                    <span role="img" aria-label="feedback">💭</span> Provide Feedback <span role="img" aria-label="feedback">💭</span>
                                </h2>
                                <form onSubmit={handleFeedbackSubmit} className="student-feedback-form">
                                    <div className="student-star-rating" style={{ gap: '18px' }}>
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
                                                ? `Rated ${feedbackRating} ${feedbackRating === 1 ? 'star' : 'stars'} ${feedbackRating >= 4 ? '😊' : feedbackRating >= 3 ? '😐' : '😔'}`
                                                : 'Click to rate ⭐'}
                                        </p>
                                    </div>

                                    <textarea
                                        placeholder="Share your thoughts with us... 💭"
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
                                                Please provide a rating or feedback comment. ❌
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
                                                Submit Feedback ✨
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
                                                Thank you for your feedback! 🙏
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
                                ) : error ? (
                                    <p className="student-error">Error: {error}</p>
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
                                                    <div className="student-complaint-media">
                                                        {complaint.file.match(/\.(jpg|jpeg|png)$/i) ? (
                                                            <img
                                                                src={`http://localhost:5000/${complaint.file}`}
                                                                alt="Complaint evidence"
                                                                className="student-complaint-photo"
                                                            />
                                                        ) : complaint.file.match(/\.(mp4|mov|avi)$/i) ? (
                                                            <video 
                                                                controls 
                                                                className="student-complaint-video"
                                                                src={`http://localhost:5000/${complaint.file}`}
                                                            >
                                                                Your browser does not support the video tag.
                                                            </video>
                                                        ) : complaint.file.match(/\.(mp3|wav)$/i) ? (
                                                            <audio 
                                                                controls 
                                                                className="student-complaint-audio"
                                                                src={`http://localhost:5000/${complaint.file}`}
                                                            >
                                                                Your browser does not support the audio tag.
                                                            </audio>
                                                        ) : null}
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
                )}
            </main>

            {unreadStatusUpdates.length > 0 && (
                <div className="status-notifications">
                    {unreadStatusUpdates.map(update => (
                        <div
                            key={update._id}
                            className="status-notification"
                            onClick={() => markStatusUpdateAsRead(update.complaintId, update._id)}
                        >
                            <div className="notification-header">
                                <span className="notification-title">
                                    Complaint Update: {update.complaintType}
                                </span>
                                {update.status.includes('urgent') && (
                                    <span className="urgent-badge">Urgent</span>
                                )}
                            </div>
                            <p className="notification-message">
                                Your complaint "{update.specificInfo}" has been {update.status}
                            </p>
                            <span className="notification-time">
                                {new Date(update.changedAt).toLocaleString()}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dashboard;
