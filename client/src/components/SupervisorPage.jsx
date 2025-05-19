// SupervisorPage.jsx
import React, { useState, useEffect } from 'react';
import SupervisorNotificationBell from '../components/SupervisorNotificationBell';
import '../styles/SupervisorStyles.css';
import { FaSun, FaMoon, FaBars, FaTimes } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

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
    const [activeSection, setActiveSection] = useState('dashboard');
    const [selectedComplaintId, setSelectedComplaintId] = useState(null);
    const location = useLocation();

    const [complaints, setComplaints] = useState([]);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [escalationReason, setEscalationReason] = useState('');
    const [showEscalationModal, setShowEscalationModal] = useState(false);
    const [loadingComplaints, setLoadingComplaints] = useState(false);
    const [complaintError, setComplaintError] = useState(null);
    const [escalatedComplaints, setEscalatedComplaints] = useState([]);
    const [loadingReports, setLoadingReports] = useState(false);
    const [reportsError, setReportsError] = useState(null);
    const [summaryReports, setSummaryReports] = useState([]);
    const [loadingSummaryReports, setLoadingSummaryReports] = useState(false);
    const [summaryReportsError, setSummaryReportsError] = useState(null);
    const [selectedBlock, setSelectedBlock] = useState('all');
    const [availableBlocks, setAvailableBlocks] = useState(['all']);
    const [reports, setReports] = useState([]);

    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme === 'dark';
    });

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const [validationErrors, setValidationErrors] = useState({
        newPassword: '',
        confirmNewPassword: ''
    });

    const [showValidationModal, setShowValidationModal] = useState(false);
    const [validationModalMessage, setValidationModalMessage] = useState('');

    const [editErrors, setEditErrors] = useState({});

    const [expandedImage, setExpandedImage] = useState(null);

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
        } else if (activeSection === 'summaryReports') {
            fetchSummaryReports();
        } else if (activeSection === 'viewReports') {
            fetchProctorReports();
        }
    }, [activeSection]);

    useEffect(() => {
        // Check for navigation state
        if (location.state) {
            if (location.state.section) {
                setActiveSection(location.state.section);
            }
            if (location.state.selectedComplaintId) {
                setSelectedComplaintId(location.state.selectedComplaintId);
            }
        }
    }, [location]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const fetchProfile = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const userData = JSON.parse(localStorage.getItem('user'));

            if (!token || !userData || !userData.userId) {
                throw new Error('No authentication token or user data found');
            }

            const response = await fetch(`http://localhost:5000/api/admin/staff/${userData.userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch profile');
            }

            const data = await response.json();
            
            // Handle profile photo URL
            if (data.profilePhoto) {
                if (data.profilePhoto.startsWith('http://localhost:5000/')) {
                    setCurrentProfilePhoto(data.profilePhoto);
                } else {
                    const photoPath = data.profilePhoto.split(/[\\/]/).pop();
                    setCurrentProfilePhoto(`http://localhost:5000/uploads/staff-photos/${photoPath}`);
                }
            }

            // Create profile data with proper defaults
            const profileData = {
                fullName: data.name || '',
                email: data.email || '',
                phoneNumber: data.phone || '',
                gender: data.gender || 'Not specified',
                userId: data.staffId || '',
                createdAt: data.createdAt || new Date().toISOString()
            };

            // Set profile state
            setProfile(profileData);

            // Set form data
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

            // First fetch the supervisor's profile to get their gender
            const profileResponse = await fetch(`http://localhost:5000/api/admin/staff/${userData.userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!profileResponse.ok) {
                const errorData = await profileResponse.json();
                throw new Error(errorData.message || 'Failed to fetch supervisor profile');
            }

            const profileData = await profileResponse.json();
            
            // Check if gender exists and is valid
            if (!profileData.gender || (profileData.gender !== 'male' && profileData.gender !== 'female')) {
                throw new Error('Invalid or missing gender in supervisor profile');
            }

            const supervisorGender = profileData.gender;

            // Send the gender directly as the blockRange parameter
            const url = `http://localhost:5000/api/complaints/verified?blockRange=${supervisorGender}`;
            
            console.log('Request URL:', url);

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Server error: ${response.status}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch verified complaints');
            }

            if (!Array.isArray(data.data)) {
                throw new Error('Invalid response format: expected an array of complaints');
            }

            // Filter out escalated complaints from the main view
            const filteredComplaints = data.data.filter(complaint => complaint.status !== 'escalated');

            console.log('Received complaints:', filteredComplaints.map(c => ({
                blockNumber: c.blockNumber,
                status: c.status
            })));

            setComplaints(filteredComplaints);
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

            // First fetch the supervisor's profile to get their gender
            const profileResponse = await fetch(`http://localhost:5000/api/admin/staff/${userData.userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!profileResponse.ok) {
                const errorData = await profileResponse.json();
                throw new Error(errorData.message || 'Failed to fetch supervisor profile');
            }

            const profileData = await profileResponse.json();
            
            // Check if gender exists and is valid
            if (!profileData.gender || (profileData.gender !== 'male' && profileData.gender !== 'female')) {
                throw new Error('Invalid or missing gender in supervisor profile');
            }

            const supervisorGender = profileData.gender;

            // Fetch all escalated complaints
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

            // Filter escalated complaints based on supervisor's gender
            const genderFilteredEscalations = data.data.filter(complaint => {
                const blockNumber = parseInt(complaint.blockNumber);
                if (supervisorGender === 'female') {
                    // Female blocks are from 224 to 237
                    return blockNumber >= 224 && blockNumber <= 237;
                } else {
                    // Male blocks are from 201 to 223
                    return blockNumber >= 201 && blockNumber <= 223;
                }
            });

            setEscalatedComplaints(genderFilteredEscalations);
        } catch (error) {
            console.error('Error fetching escalated complaints:', error);
            setReportsError(error.message);
        } finally {
            setLoadingReports(false);
        }
    };

    const fetchSummaryReports = async () => {
        setLoadingSummaryReports(true);
        setSummaryReportsError(null);
        try {
            const token = localStorage.getItem('token');
            const userData = JSON.parse(localStorage.getItem('user'));

            if (!token || !userData) {
                throw new Error('No authentication token found');
            }

            // First fetch the supervisor's profile to get their gender
            const profileResponse = await fetch(`http://localhost:5000/api/admin/staff/${userData.userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!profileResponse.ok) {
                const errorData = await profileResponse.json();
                throw new Error(errorData.message || 'Failed to fetch supervisor profile');
            }

            const profileData = await profileResponse.json();
            
            // Check if gender exists and is valid
            if (!profileData.gender || (profileData.gender !== 'male' && profileData.gender !== 'female')) {
                throw new Error('Invalid or missing gender in supervisor profile');
            }

            const supervisorGender = profileData.gender;

            // Fetch all summary reports
            const response = await fetch('http://localhost:5000/api/complaints/summary', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `Failed to fetch summary reports: ${response.status}`);
            }

            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch summary reports');
            }

            // Filter reports based on supervisor's gender
            const filteredReports = data.data.filter(report => {
                const blockNumber = parseInt(report.blockNumber);
                if (supervisorGender === 'female') {
                    // Female blocks are from 224 to 237
                    return blockNumber >= 224 && blockNumber <= 237;
                } else {
                    // Male blocks are from 201 to 223
                    return blockNumber >= 201 && blockNumber <= 223;
                }
            });

            // Extract unique blocks from the filtered reports and sort them
            const blockNumbers = filteredReports.map(report => {
                const block = String(report.blockNumber).trim();
                return block;
            }).filter(block => block !== '' && block !== undefined && block !== null);

            const uniqueBlocks = ['all', ...new Set(blockNumbers)].sort((a, b) => {
                if (a === 'all') return -1;
                if (b === 'all') return 1;
                return parseInt(a) - parseInt(b);
            });

            setAvailableBlocks(uniqueBlocks);
            setSummaryReports(filteredReports);
        } catch (error) {
            console.error('Error fetching summary reports:', error);
            setSummaryReportsError(error.message);
        } finally {
            setLoadingSummaryReports(false);
        }
    };

    const fetchProctorReports = async () => {
        setLoadingReports(true);
        setReportsError(null);
        try {
            const token = localStorage.getItem('token');
            const userData = JSON.parse(localStorage.getItem('user'));

            if (!token || !userData) {
                throw new Error('No authentication token found');
            }

            // First fetch the supervisor's profile to get their gender
            const profileResponse = await fetch(`http://localhost:5000/api/admin/staff/${userData.userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!profileResponse.ok) {
                const errorData = await profileResponse.json();
                throw new Error(errorData.message || 'Failed to fetch supervisor profile');
            }

            const profileData = await profileResponse.json();
            
            // Check if gender exists and is valid
            if (!profileData.gender || (profileData.gender !== 'male' && profileData.gender !== 'female')) {
                throw new Error('Invalid or missing gender in supervisor profile');
            }

            const supervisorGender = profileData.gender;

            // Fetch all proctor reports
            const response = await fetch('http://localhost:5000/api/proctor/reports', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch proctor reports');
            }

            // Filter reports based on supervisor's gender
            const genderFilteredReports = data.data.filter(report => {
                const blockNumber = parseInt(report.block);
                if (supervisorGender === 'female') {
                    // Female blocks are from 224 to 237
                    return blockNumber >= 224 && blockNumber <= 237;
                } else {
                    // Male blocks are from 201 to 223
                    return blockNumber >= 201 && blockNumber <= 223;
                }
            });

            setReports(genderFilteredReports || []);
        } catch (error) {
            console.error('Error fetching proctor reports:', error);
            setReportsError(error.message);
        } finally {
            setLoadingReports(false);
        }
    };

    const filteredReports = selectedBlock === 'all' 
        ? [{
            proctorName: 'All Proctors',
            blockNumber: 'All Blocks',
            totalComplaints: summaryReports.reduce((sum, report) => sum + report.totalComplaints, 0),
            resolvedComplaints: summaryReports.reduce((sum, report) => sum + report.resolvedComplaints, 0),
            pendingComplaints: summaryReports.reduce((sum, report) => sum + report.pendingComplaints, 0),
            summary: `Total: ${summaryReports.reduce((sum, report) => sum + report.totalComplaints, 0)}, 
                     Resolved: ${summaryReports.reduce((sum, report) => sum + report.resolvedComplaints, 0)}, 
                     Pending: ${summaryReports.reduce((sum, report) => sum + report.pendingComplaints, 0)}`
        }]
        : summaryReports.filter(report => String(report.blockNumber).trim() === selectedBlock);

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

    // Validation helpers
    const validateName = (name) => /^[A-Za-z ]+$/.test(name.trim());
    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const validatePhone = (phone) => {
        if (phone.startsWith('09')) return /^09\d{8}$/.test(phone);
        if (phone.startsWith('+251')) return /^\+251\d{9,10}$/.test(phone);
        return false;
    };
    const validatePassword = (password) => {
        if (!password) return true;
        return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[!@#$%^&*]/.test(password);
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Validate password fields
        if (name === 'newPassword') {
            const passwordErrors = validatePassword(value);
            setValidationErrors(prev => ({
                ...prev,
                newPassword: passwordErrors.length > 0 ? passwordErrors.join(" ") : ""
            }));
        } else if (name === 'confirmNewPassword') {
            if (value !== formData.newPassword) {
                setValidationErrors(prev => ({
                    ...prev,
                    confirmNewPassword: "Passwords do not match"
                }));
            } else {
                setValidationErrors(prev => ({
                    ...prev,
                    confirmNewPassword: ""
                }));
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
        if (Object.keys(errors).length > 0) { setLoading(false); return; }
        setLoading(true);
        setError(null);

        // Validate passwords if they are being changed
        if (formData.currentPassword || formData.newPassword || formData.confirmNewPassword) {
            if (formData.newPassword !== formData.confirmNewPassword) {
                setValidationModalMessage("New passwords don't match");
                setShowValidationModal(true);
                setLoading(false);
                return;
            }
            
            const passwordErrors = validatePassword(formData.newPassword);
            if (passwordErrors.length > 0) {
                setValidationModalMessage(passwordErrors.join("\n"));
                setShowValidationModal(true);
                setLoading(false);
                return;
            }
        }

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
                if (response.status === 401) {
                    setValidationModalMessage("Current password is incorrect");
                } else {
                    const errorData = await response.json();
                    setValidationModalMessage(errorData.message || 'Update failed');
                }
                setShowValidationModal(true);
                return;
            }

            const data = await response.json();
            console.log('Profile update successful:', data);
            setProfile(data);
            alert('Profile updated successfully');

            await fetchProfile();
        } catch (err) {
            console.error('Error updating profile:', err);
            setValidationModalMessage(err.message);
            setShowValidationModal(true);
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

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to resolve complaint');
            }

            if (!data.success) {
                throw new Error(data.message || 'Failed to resolve complaint');
            }

            // Update the complaints list by updating the status of the resolved complaint
            setComplaints(prevComplaints =>
                prevComplaints.map(complaint => 
                    complaint._id === complaintId 
                        ? { ...complaint, status: 'resolved', resolvedAt: new Date() }
                        : complaint
                )
            );

            // Show success message
            alert('Complaint has been successfully resolved');
        } catch (error) {
            console.error('Error resolving complaint:', error);
            setComplaintError(error.message);
            alert('Failed to resolve complaint: ' + error.message);
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

            // Update the complaints list by updating the status of the escalated complaint
            setComplaints(prevComplaints =>
                prevComplaints.map(complaint => 
                    complaint._id === complaintId 
                        ? { ...complaint, status: 'escalated', escalationReason: escalationReason, escalatedAt: new Date() }
                        : complaint
                )
            );
            setShowEscalationModal(false);
            setEscalationReason('');

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

    const handleBlockChange = (e) => {
        setSelectedBlock(e.target.value);
    };

    const handleDeleteComplaint = async (complaintId) => {
        if (!window.confirm('Are you sure you want to delete this complaint? This action cannot be undone.')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/complaints/${complaintId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete complaint');
            }

            // Remove the deleted complaint from the list
            setComplaints(prevComplaints =>
                prevComplaints.filter(complaint => complaint._id !== complaintId)
            );

            alert('Complaint deleted successfully');
        } catch (error) {
            console.error('Error deleting complaint:', error);
            setComplaintError(error.message);
            alert('Failed to delete complaint: ' + error.message);
        }
    };

    const ValidationModal = () => {
        if (!showValidationModal) return null;

        return (
            <div className="modal-overlay">
                <div className="modal-content">
                    <h3>Validation Error</h3>
                    <p>{validationModalMessage}</p>
                    <div className="modal-actions">
                        <button 
                            className="modal-button"
                            onClick={() => setShowValidationModal(false)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="supervisor-page">
            {/* Sidebar */}
            <div className="Supervisor-sidebar">
                <div className="sidebar-header">Supervisor Dashboard</div>
                <div className="Supervisor-sidebar-nav">
                    <button onClick={() => handleNavigation('dashboard')} className={activeSection === 'dashboard' ? 'active' : ''}>
                        Dashboard
                    </button>
                    <button onClick={() => handleNavigation('complaints')} className={activeSection === 'complaints' ? 'active' : ''}>
                        Complaint Management
                    </button>
                    <button onClick={() => handleNavigation('viewProfile')} className={activeSection === 'viewProfile' ? 'active' : ''}>
                        View Profile
                    </button>
                    <button onClick={() => handleNavigation('editProfile')} className={activeSection === 'editProfile' ? 'active' : ''}>
                        Edit Profile
                    </button>
                    <button onClick={() => handleNavigation('reports')} className={activeSection === 'reports' ? 'active' : ''}>
                        Escalation Reports
                    </button>
                    <button onClick={() => handleNavigation('summaryReports')} className={activeSection === 'summaryReports' ? 'active' : ''}>
                        View Summary Reports
                    </button>
                    <button onClick={() => handleNavigation('viewReports')} className={activeSection === 'viewReports' ? 'active' : ''}>
                        View Reports
                    </button>
                </div>
                <button className="Supervisor-logout-btn" onClick={handleLogout}>
                    Log Out
                </button>
            </div>
            {/* Main Content */}
            <div className="Supervisor-main-content">
                {/* Topbar */}
                <div className="modern-topbar">
                    <button className="Supervisor-theme-toggle" onClick={toggleTheme}>
                        {isDarkMode ? <FaSun /> : <FaMoon />}
                    </button>
                    <SupervisorNotificationBell userId={profile?._id || profile?.userId} />
                    <div className="modern-profile-avatar">
                        <span>{profile?.fullName || 'Supervisor'}</span>
                    </div>
                </div>
                <div className="Supervisor-content-area">
                    {/* Dashboard Welcome Card */}
                    {activeSection === 'dashboard' && (
                        <div className="supervisor-welcome-card">
                            <h2>Welcome, {profile?.fullName?.split(' ')[0] || 'Supervisor'}!</h2>
                            <p>
                                We're glad to have you here. This is your dedicated space to manage facility complaints, update your profile, and review important reports to help improve campus life for everyone.<br /><br />
                                <b>Tip:</b> Use the sidebar to quickly access all features. You can view and resolve complaints, escalate issues to the dean, and keep track of your assigned blocks. If you have any issues, don't hesitate to submit or escalate a complaint, or reach out for support.<br /><br />
                                Your role is vital in ensuring a safe, comfortable, and productive environment for all students. Thank you for your commitment and dedication!<br /><br />
                                <span className="supervisor-tip">Have a great day and make your voice heard!</span>
                            </p>
                        </div>
                    )}
                    {/* Existing sections (complaints, viewProfile, editProfile, reports, summaryReports, viewReports) remain unchanged, just update their root className to 'supervisor-card' */}
                    {activeSection === 'viewProfile' && (
                        <section className="supervisor-card">
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
                                                className="profile-photo-img"
                                                onClick={() => setExpandedImage(currentProfilePhoto)}
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
                                            <span className="detail-value">
                                                {profile.gender === 'male' ? 'Male' : 
                                                 profile.gender === 'female' ? 'Female' : 
                                                 'Not specified'}
                                            </span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Assigned Blocks:</span>
                                            <span className="detail-value">
                                                {profile.gender === 'male' ? '201-222' : 
                                                 profile.gender === 'female' ? '223-237' : 
                                                 'Not assigned'}
                                            </span>
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
                        <section className="supervisor-card">
                            <h2>Edit Profile</h2>
                            {loading && <p className="loading">Saving changes...</p>}
                            {error && <p className="error">Error: {error}</p>}
                            <form onSubmit={handleProfileUpdate} className="edit-profile-form">
                                <div className="profile-photo-edit">
                                    <div
                                        className="photo-preview"
                                        onClick={() => document.getElementById('profilePhotoInput').click()}
                                    >
                                        {(newProfilePreview || currentProfilePhoto) && (
                                            <img
                                                src={newProfilePreview || currentProfilePhoto}
                                                alt="Profile Preview"
                                                className="profile-photo-img"
                                                onClick={() => setExpandedImage(newProfilePreview || currentProfilePhoto)}
                                            />
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
                                        {editErrors.fullName && <span className="error-message">{editErrors.fullName}</span>}
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
                                        {editErrors.email && <span className="error-message">{editErrors.email}</span>}
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
                                        {editErrors.phoneNumber && <span className="error-message">{editErrors.phoneNumber}</span>}
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
                                                name="currentPassword"
                                                value={formData.currentPassword}
                                                onChange={handlePasswordChange}
                                                placeholder="Enter current password"
                                            />
                                        </label>
                                    </div>

                                    <div className="form-group">
                                        <label>
                                            New Password:
                                            <input
                                                type="password"
                                                name="newPassword"
                                                value={formData.newPassword}
                                                onChange={handlePasswordChange}
                                                placeholder="Enter new password"
                                                className={validationErrors.newPassword ? "error-input" : ""}
                                            />
                                        </label>
                                        {validationErrors.newPassword && (
                                            <span className="error-message">{validationErrors.newPassword}</span>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label>
                                            Confirm New Password:
                                            <input
                                                type="password"
                                                name="confirmNewPassword"
                                                value={formData.confirmNewPassword}
                                                onChange={handlePasswordChange}
                                                placeholder="Confirm new password"
                                                className={validationErrors.confirmNewPassword ? "error-input" : ""}
                                            />
                                        </label>
                                        {validationErrors.confirmNewPassword && (
                                            <span className="error-message">{validationErrors.confirmNewPassword}</span>
                                        )}
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
                        <section className="supervisor-card">
                            <h2>Complaint Management</h2>
                            {loadingComplaints && <p className="loading">Loading complaints...</p>}
                            {complaintError && <p className="error">Error: {complaintError}</p>}

                            <div className="Supervisor-complaints-grid">
                                {complaints.map(complaint => (
                                    <div key={complaint._id} className={`Supervisor-complaint-card ${complaint.status.toLowerCase()}`}>
                                        <div className="Supervisor-complaint-header">
                                            <h3>{complaint.complaintType}</h3>
                                            <span className={`status ${complaint.status.toLowerCase()}`}>
                                                {complaint.status}
                                            </span>
                                        </div>
                                        <div className="Supervisor-complaint-details">
                                            <p><strong>Specific Issue:</strong> {complaint.specificInfo}</p>
                                            <p><strong>Description:</strong> {complaint.description}</p>
                                            <p><strong>Block:</strong> {complaint.blockNumber}</p>
                                            <p><strong>Dorm:</strong> {complaint.dormNumber}</p>
                                            <p><strong>Date:</strong> {new Date(complaint.createdAt).toLocaleDateString()}</p>
                                            {complaint.isUrgent && <p className="urgent-tag">URGENT</p>}
                                            {complaint.status === 'resolved' && (
                                                <p><strong>Resolved On:</strong> {new Date(complaint.resolvedAt).toLocaleDateString()}</p>
                                            )}
                                            {complaint.file && (
                                                <div className="supervisor-complaint-media">
                                                    {complaint.file.match(/\.(jpg|jpeg|png)$/i) ? (
                                                        <img
                                                            src={`http://localhost:5000/${complaint.file}`}
                                                            alt="Complaint evidence"
                                                            className="complaint-evidence-img"
                                                            onClick={() => setExpandedImage(`http://localhost:5000/${complaint.file}`)}
                                                        />
                                                    ) : complaint.file.match(/\.(mp4|mov|avi)$/i) ? (
                                                        <video 
                                                            controls 
                                                            className="complaint-evidence-video"
                                                            src={`http://localhost:5000/${complaint.file}`}
                                                        >
                                                            Your browser does not support the video tag.
                                                        </video>
                                                    ) : complaint.file.match(/\.(mp3|wav)$/i) ? (
                                                        <audio 
                                                            controls 
                                                            className="complaint-evidence-audio"
                                                            src={`http://localhost:5000/${complaint.file}`}
                                                        >
                                                            Your browser does not support the audio tag.
                                                        </audio>
                                                    ) : null}
                                                </div>
                                            )}
                                        </div>
                                        <div className="Supervisor-complaint-actions">
                                            {complaint.status !== 'resolved' && (
                                                <>
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
                                                </>
                                            )}
                                            <button
                                                className="delete-btn"
                                                onClick={() => handleDeleteComplaint(complaint._id)}
                                            >
                                                Delete Complaint
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
                        </section>
                    )}
                    {activeSection === 'reports' && (
                        <section className="supervisor-card">
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
                                            {selectedComplaint.file && (
                                                <div className="supervisor-complaint-media">
                                                    {selectedComplaint.file.match(/\.(jpg|jpeg|png)$/i) ? (
                                                        <img
                                                            src={`http://localhost:5000/${selectedComplaint.file}`}
                                                            alt="Complaint evidence"
                                                            className="complaint-evidence-img"
                                                            onClick={() => setExpandedImage(`http://localhost:5000/${selectedComplaint.file}`)}
                                                        />
                                                    ) : selectedComplaint.file.match(/\.(mp4|mov|avi)$/i) ? (
                                                        <video 
                                                            controls 
                                                            className="complaint-evidence-video"
                                                            src={`http://localhost:5000/${selectedComplaint.file}`}
                                                        >
                                                            Your browser does not support the video tag.
                                                        </video>
                                                    ) : selectedComplaint.file.match(/\.(mp3|wav)$/i) ? (
                                                        <audio 
                                                            controls 
                                                            className="complaint-evidence-audio"
                                                            src={`http://localhost:5000/${selectedComplaint.file}`}
                                                        >
                                                            Your browser does not support the audio tag.
                                                        </audio>
                                                    ) : null}
                                                </div>
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
                        </section>
                    )}
                    {activeSection === 'summaryReports' && (
                        <section className="supervisor-card">
                            <div className="summary-reports-header">
                                <h2>Summary Reports from Proctors</h2>
                                <div className="block-filter">
                                    <label htmlFor="blockSelect">Filter by Block:</label>
                                    <select 
                                        id="blockSelect"
                                        value={selectedBlock}
                                        onChange={handleBlockChange}
                                        className="block-select"
                                    >
                                        {availableBlocks.map(block => (
                                            <option key={block} value={block}>
                                                {block === 'all' ? 'All Blocks' : `Block ${block}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {loadingSummaryReports && <p className="loading">Loading summary reports...</p>}
                            {summaryReportsError && <p className="error">Error: {summaryReportsError}</p>}

                            <div className="summary-reports-container">
                                {filteredReports.length === 0 ? (
                                    <p>No summary reports found for the selected block.</p>
                                ) : (
                                    filteredReports.map(report => (
                                        <div key={report.blockNumber} className="summary-report-card">
                                            <div className="report-header">
                                                <h3>{selectedBlock === 'all' ? 'Summary Report' : `Report from ${report.proctorName}`}</h3>
                                                <div className="quick-stats">
                                                    <div className="stat-item">
                                                        <span className="stat-label">Total</span>
                                                        <span className="stat-value">{report.totalComplaints}</span>
                                                    </div>
                                                    <div className="stat-item">
                                                        <span className="stat-label">Resolved</span>
                                                        <span className="stat-value resolved">{report.resolvedComplaints}</span>
                                                    </div>
                                                    <div className="stat-item">
                                                        <span className="stat-label">Pending</span>
                                                        <span className="stat-value pending">{report.pendingComplaints}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="charts-container">
                                                <div className="chart-wrapper">
                                                    <Doughnut
                                                        data={{
                                                            labels: ['Resolved', 'Pending'],
                                                            datasets: [{
                                                                data: [report.resolvedComplaints, report.pendingComplaints],
                                                                backgroundColor: ['#4CAF50', '#FFC107'],
                                                                borderColor: ['#388E3C', '#FFA000'],
                                                                borderWidth: 1
                                                            }]
                                                        }}
                                                        options={{
                                                            responsive: true,
                                                            maintainAspectRatio: false,
                                                            plugins: {
                                                                legend: {
                                                                    position: 'bottom',
                                                                    labels: {
                                                                        boxWidth: 12,
                                                                        padding: 10
                                                                    }
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </div>

                                                <div className="chart-wrapper">
                                                    <Bar
                                                        data={{
                                                            labels: ['Total', 'Resolved', 'Pending'],
                                                            datasets: [{
                                                                label: 'Number of Complaints',
                                                                data: [
                                                                    report.totalComplaints,
                                                                    report.resolvedComplaints,
                                                                    report.pendingComplaints
                                                                ],
                                                                backgroundColor: [
                                                                    '#2196F3',
                                                                    '#4CAF50',
                                                                    '#FFC107'
                                                                ],
                                                                borderColor: [
                                                                    '#1976D2',
                                                                    '#388E3C',
                                                                    '#FFA000'
                                                                ],
                                                                borderWidth: 1
                                                            }]
                                                        }}
                                                        options={{
                                                            responsive: true,
                                                            maintainAspectRatio: false,
                                                            scales: {
                                                                y: {
                                                                    beginAtZero: true,
                                                                    ticks: {
                                                                        stepSize: 1
                                                                    }
                                                                }
                                                            },
                                                            plugins: {
                                                                legend: {
                                                                    display: false
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    )}
                    {activeSection === 'viewReports' && (
                        <section className="supervisor-card">
                            <h2>Proctor Reports</h2>
                            {loadingReports && <p className="loading">Loading reports...</p>}
                            {reportsError && <p className="error">Error: {reportsError}</p>}
                            <div className="Supervisor-reports-list">
                                {reports.length === 0 ? (
                                    <p>No reports found.</p>
                                ) : (
                                    reports.map(report => (
                                        <div key={report._id} className="awesome-report-card">
                                            <div className="report-header">
                                                <span role="img" aria-label="report">📄</span> Report from <span className="report-key">{report.proctorName}</span>
                                            </div>
                                            <div className="Supervisor-report-details">
                                                <div><b>Block:</b> <span className="report-key">{report.block}</span></div>
                                                <div><b>Content:</b> {report.content}</div>
                                            </div>
                                            <div className="report-date">
                                                <span role="img" aria-label="calendar">📅</span> Submitted on: {new Date(report.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    )}
                </div>
            </div>
            <ValidationModal />
            {expandedImage && (
                <div className="modal-overlay" onClick={() => setExpandedImage(null)}>
                    <div className="modal-content" style={{maxWidth: '90vw', maxHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                        <img src={expandedImage} alt="Expanded" style={{maxWidth: '100%', maxHeight: '80vh', borderRadius: '16px'}} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupervisorPage;