import React, { useState, useEffect } from 'react';
import AdminNotificationBell from '../components/AdminNotificationBell';
import '../styles/AdminStyles.css';
import { AlertCircle } from 'lucide-react';
import MessagePopup from './MessagePopup';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('account-approvals');
  const [accountRequests, setAccountRequests] = useState([]);
  const [staffAccounts, setStaffAccounts] = useState([]);
  const [adminAccounts, setAdminAccounts] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'proctor',
    password: '',
    profilePhoto: null,
    block: '',
    gender: '' // Add gender field
  });
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    profilePhoto: null
  });
  const [profilePreview, setProfilePreview] = useState(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [profileError, setProfileError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [newCollege, setNewCollege] = useState({ name: '' });
  const [newDepartment, setNewDepartment] = useState({ name: '', college: '' });
  const [colleges, setColleges] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [collegeErrorMessage, setCollegeErrorMessage] = useState('');
  const [departmentErrorMessage, setDepartmentErrorMessage] = useState('');
  const [editingCollege, setEditingCollege] = useState(null);
  const [editingDepartment, setEditingDepartment] = useState(null);

  const [validationErrors, setValidationErrors] = useState({
    email: '',
    phone: '',
    password: ''
  });

  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');

  const [adminData, setAdminData] = useState(null);
  const [error, setError] = useState(null);
  const [currentProfilePhoto, setCurrentProfilePhoto] = useState(null);

  const [reportData, setReportData] = useState(null);
  const [reportType, setReportType] = useState('proctor');
  const [timePeriod, setTimePeriod] = useState('weekly');
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');

  const [blocks, setBlocks] = useState([]);
  const [dorms, setDorms] = useState([]);
  const [newBlock, setNewBlock] = useState({ number: '' });
  const [newDorm, setNewDorm] = useState({ number: '', block: '' });
  const [editingBlock, setEditingBlock] = useState(null);
  const [editingDorm, setEditingDorm] = useState(null);
  const [blockErrorMessage, setBlockErrorMessage] = useState('');
  const [dormErrorMessage, setDormErrorMessage] = useState('');

  const [formErrors, setFormErrors] = useState({});

  const [studentApprovals, setStudentApprovals] = useState([]);
  const [csvFile, setCsvFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredApprovals, setFilteredApprovals] = useState([]);

  const [newStudent, setNewStudent] = useState({
    studentId: '',
    name: '',
    email: '',
    department: '',
    college: '',
    status: 'pending',
    registrationDate: new Date().toISOString().slice(0, 16)
  });
  const [showAddStudentForm, setShowAddStudentForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [editingStudentData, setEditingStudentData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  const [summaryReports, setSummaryReports] = useState([]);
  const [loadingSummaryReports, setLoadingSummaryReports] = useState(false);
  const [summaryReportsError, setSummaryReportsError] = useState(null);
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedBlock, setSelectedBlock] = useState('all');
  const [availableBlocks, setAvailableBlocks] = useState(['all']);
  const [showSummaryReports, setShowSummaryReports] = useState(false);

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const location = useLocation();

  useEffect(() => {
    // Check for navigation state and set active tab
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  // Fetch colleges on component mount, added error state
  useEffect(() => {
    const fetchColleges = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:5000/api/colleges');
        if (!response.ok) {
          throw new Error('Failed to fetch colleges');
        }
        const data = await response.json();
        setColleges(data);
      } catch (error) {
        console.error('Error fetching colleges', error);
        setCollegeErrorMessage('Failed to load colleges. Please check your network connection.');
      } finally {
        setLoading(false);
      }
    };
    fetchColleges();
  }, []);

  // Fetch feedback data
  useEffect(() => {
    if (activeTab === 'feedback') {
      fetchFeedback();
    } else if (activeTab === 'summary-reports') {
      fetchSummaryReports();
    }
  }, [activeTab]);

  const fetchFeedback = async () => {
    setFeedbackLoading(true);
    setFeedbackError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/feedback', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch feedback');
      }
      const data = await response.json();
      console.log('Fetched feedback data:', data);
      setFeedback(data);

      // Mark unviewed feedback as viewed
      const unviewedFeedback = data.filter(f => !f.viewedByAdmin);
      console.log('Unviewed feedback:', unviewedFeedback);

      for (const feedback of unviewedFeedback) {
        try {
          console.log('Marking feedback as viewed:', feedback._id);
          const viewResponse = await fetch(`http://localhost:5000/api/feedback/${feedback._id}/view`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!viewResponse.ok) {
            throw new Error('Failed to mark feedback as viewed');
          }

          const viewData = await viewResponse.json();
          console.log('Feedback marked as viewed:', viewData);
        } catch (error) {
          console.error('Error marking feedback as viewed:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
      setFeedbackError('Failed to load feedback data. Please try again later.');
    } finally {
      setFeedbackLoading(false);
    }
  };

  // Function to handle college creation
  const handleCreateCollege = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setCollegeErrorMessage('');

    if (!newCollege.name.trim()) {
      setCollegeErrorMessage('College name cannot be empty.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/colleges/create-college', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCollege), // Make SURE newCollege is being sent
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message);
        setNewCollege({ name: '' });
        // Fetch colleges again to update the list
        const collegesResponse = await fetch('http://localhost:5000/api/colleges');
        const collegesData = await collegesResponse.json();
        setColleges(collegesData);
      } else {
        setCollegeErrorMessage(data.message || 'Failed to create college'); // Use data.message
      }
    } catch (error) {
      console.error('Error creating college:', error);
      setCollegeErrorMessage('An error occurred while creating the college. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle department creation
  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setDepartmentErrorMessage('');

    if (!newDepartment.name.trim()) {
      setDepartmentErrorMessage('Department name cannot be empty.');
      setLoading(false);
      return;
    }
    if (!newDepartment.college) {
      setDepartmentErrorMessage('Please select a college for the department.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/departments/create-department', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newDepartment),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message);
        setNewDepartment({ name: '', college: '' });
        // Fetch departments again to update the list
        const departmentsResponse = await fetch('http://localhost:5000/api/departments');
        const departmentsData = await departmentsResponse.json();
        setDepartments(departmentsData);
      } else {
        setDepartmentErrorMessage(data.message || 'Failed to create department');
      }
    } catch (error) {
      console.error('Error creating department:', error);
      setDepartmentErrorMessage('An error occurred while creating the department. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add validation functions
  const handleEmailBlur = (e) => {
    const email = e.target.value;
    if (!email) {
      setValidationErrors(prev => ({ ...prev, email: 'Email is required' }));
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setValidationErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
    } else {
      setValidationErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const handlePhoneBlur = (e) => {
    const phone = e.target.value;
    if (!phone) {
      setValidationErrors(prev => ({ ...prev, phone: 'Phone number is required' }));
    } else if (!/^\d{10}$/.test(phone)) {
      setValidationErrors(prev => ({ ...prev, phone: 'Phone number must be exactly 10 digits' }));
    } else {
      setValidationErrors(prev => ({ ...prev, phone: '' }));
    }
  };

  const handlePasswordBlur = (e) => {
    const password = e.target.value;
    if (!password) {
      setValidationErrors(prev => ({ ...prev, password: 'Password is required' }));
    } else if (password.length < 6) {
      setValidationErrors(prev => ({ ...prev, password: 'Password must be at least 6 characters long' }));
    } else {
      setValidationErrors(prev => ({ ...prev, password: '' }));
    }
  };

  // Generate IDs with prefixes based on role
  const generateStaffId = (role) => {
    const prefixMap = {
      proctor: 'P',
      supervisor: 'V',
      dean: 'D'
    };
    const prefix = prefixMap[role] || 'X';

    // Get the last ID from existing staff accounts
    const lastId = staffAccounts.reduce((max, acc) => {
      const num = parseInt(acc.staffId.slice(1)) || 0;
      return num > max ? num : max;
    }, 0);

    // Increment the last ID and pad with zeros
    return `${prefix}${String(lastId + 1).padStart(4, '0')}`;
  };

  // Generate Admin ID
  const generateAdminId = () => {
    const lastId = adminAccounts.reduce((max, acc) => {
      const num = parseInt(acc.id.slice(1)) || 0;
      return num > max ? num : max;
    }, 0);
    return `A${String(lastId + 1).padStart(3, '0')}`;
  };

  // Create staff account
  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    // Validate form before submission
    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', newStaff.name);
      formData.append('email', newStaff.email);
      formData.append('phone', newStaff.phone);
      formData.append('role', newStaff.role);
      formData.append('password', newStaff.password);

      if (newStaff.role === 'proctor') {
        const selectedBlock = blocks.find(b => b._id === newStaff.block);
        if (!selectedBlock) {
          setErrorMessage('Please select a valid block');
          setLoading(false);
          return;
        }
        formData.append('block', selectedBlock.number);
      } else if (newStaff.role === 'supervisor') {
        formData.append('gender', newStaff.gender);
      }

      if (newStaff.profilePhoto) {
        formData.append('profilePhoto', newStaff.profilePhoto);
      }

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/adminStaff/create-staff', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create staff account');
      }

      const data = await response.json();
      setSuccessMessage(data.message);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);

      // Reset form while preserving the role
      setNewStaff({
        name: '',
        email: '',
        phone: '',
        role: newStaff.role, // Preserve the role
        password: '',
        block: '', // Clear the block selection
        profilePhoto: null
      });
      setProfilePreview(null);

      // Refresh blocks list
      const blocksResponse = await fetch('http://localhost:5000/api/blocks', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!blocksResponse.ok) {
        throw new Error('Failed to refresh blocks');
      }

      const blocksData = await blocksResponse.json();
      setBlocks(blocksData);

    } catch (error) {
      console.error('Error creating staff:', error);
      setErrorMessage(error.message || 'Failed to create staff account');
    } finally {
      setLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setProfileError('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setProfileError("New passwords don't match");
      return;
    }

    try {
      // Simulated API call
      console.log('Password changed successfully');
      setSuccessMessage('Password changed successfully!'); // addded success message
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      setProfileError('Failed to change password');
    }
  };

  const handleCloseMessage = () => {
    setSuccessMessage('');
    setErrorMessage('');
  };

  // Fetch admin data on component mount
  useEffect(() => {
    const fetchAdminData = async () => {
      setLoading(true);
      try {
        // Get user data from localStorage
        const userData = localStorage.getItem('user');
        if (!userData) {
          throw new Error('No user data found');
        }

        const parsedData = JSON.parse(userData);
        const userId = parsedData.userId;

        // Try to fetch complete admin data from the server
        try {
          // Use the new admin endpoint
          const response = await fetch(`http://localhost:5000/api/admin/admin/${userId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const serverData = await response.json();
            console.log('Admin data from server:', serverData);

            // Format profile photo path if it exists
            if (serverData.profilePhoto) {
              // Extract just the filename from the full path, handling both forward and backward slashes
              const photoPath = serverData.profilePhoto.split(/[\\/]/).pop();
              // Construct the correct URL path
              setCurrentProfilePhoto(`http://localhost:5000/uploads/staff-photos/${photoPath}`);
            }

            setAdminData({
              name: serverData.name || parsedData.name || 'Not available',
              adminId: serverData.id || userId || 'Not available',
              email: serverData.email || 'Not available',
              role: 'Admin',
              phone: serverData.phone || 'Not available',
              createdAt: serverData.createdAt || new Date().toISOString()
            });
            return; // Exit early if we got server data
          } else {
            console.error('Failed to fetch admin data:', await response.text());
          }
        } catch (serverError) {
          console.error('Error fetching admin data from server:', serverError);
          // Continue to localStorage fallback
        }

        // Fallback to localStorage data if server fetch fails
        const adminData = {
          name: parsedData.name || 'Not available',
          adminId: userId || 'Not available',
          email: parsedData.email || 'Not available',
          role: 'Admin',
          phone: parsedData.phone || 'Not available',
          createdAt: new Date().toISOString(), // Default to current date
        };

        setAdminData(adminData);
      } catch (error) {
        console.error('Error setting admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  // Add functions for college operations
  const handleEditCollege = (college) => {
    setEditingCollege(college);
    setNewCollege({ name: college.name });
  };

  const handleDeleteCollege = async (collegeId) => {
    if (!window.confirm('Are you sure you want to delete this college? This will also delete all associated departments.')) {
      return;
    }

    setLoading(true);
    setCollegeErrorMessage('');

    try {
      const response = await fetch(`http://localhost:5000/api/colleges/${collegeId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete college');
      }

      // Update colleges list with the new data from the server
      setColleges(data.colleges);
      setSuccessMessage(data.message || 'College deleted successfully');
    } catch (error) {
      console.error('Error deleting college:', error);
      setCollegeErrorMessage(error.message || 'Failed to delete college');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCollege = async (e) => {
    e.preventDefault();
    setLoading(true);
    setCollegeErrorMessage('');

    try {
      const response = await fetch(`http://localhost:5000/api/colleges/${editingCollege._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newCollege.name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update college');
      }

      // Update colleges list with the new data from the server
      setColleges(data.colleges);
      setEditingCollege(null);
      setNewCollege({ name: '' });
      setSuccessMessage(data.message || 'College updated successfully');
    } catch (error) {
      console.error('Error updating college:', error);
      setCollegeErrorMessage(error.message || 'Failed to update college');
    } finally {
      setLoading(false);
    }
  };

  // Add functions for department operations
  const handleEditDepartment = (department) => {
    setEditingDepartment(department);
    setNewDepartment({
      name: department.name,
      college: department.college._id
    });
  };

  const handleDeleteDepartment = async (departmentId) => {
    if (!window.confirm('Are you sure you want to delete this department?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/departments/${departmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete department');
      }

      // Update departments list
      setDepartments(departments.filter(dept => dept._id !== departmentId));
      setSuccessMessage('Department deleted successfully');
    } catch (error) {
      console.error('Error deleting department:', error);
      setDepartmentErrorMessage('Failed to delete department');
    }
  };

  const handleUpdateDepartment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setDepartmentErrorMessage('');

    try {
      const response = await fetch(`http://localhost:5000/api/departments/${editingDepartment._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newDepartment),
      });

      if (!response.ok) {
        throw new Error('Failed to update department');
      }

      // Update departments list
      setDepartments(departments.map(dept =>
        dept._id === editingDepartment._id
          ? { ...dept, name: newDepartment.name, college: newDepartment.college }
          : dept
      ));

      setEditingDepartment(null);
      setNewDepartment({ name: '', college: '' });
      setSuccessMessage('Department updated successfully');
    } catch (error) {
      console.error('Error updating department:', error);
      setDepartmentErrorMessage('Failed to update department');
    } finally {
      setLoading(false);
    }
  };

  // Add useEffect to fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:5000/api/departments');
        if (!response.ok) {
          throw new Error('Failed to fetch departments');
        }
        const data = await response.json();
        setDepartments(data);
      } catch (error) {
        console.error('Error fetching departments:', error);
        setDepartmentErrorMessage('Failed to load departments');
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  // Add function to delete feedback
  const handleDeleteFeedback = async (feedbackId) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) {
      return;
    }

    setFeedbackLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/feedback/${feedbackId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete feedback');
      }

      // Update feedback list
      setFeedback(prevFeedback => prevFeedback.filter(item => item._id !== feedbackId));
      setSuccessMessage('Feedback deleted successfully');
    } catch (error) {
      console.error('Error deleting feedback:', error);
      setFeedbackError('Failed to delete feedback: ' + error.message);
    } finally {
      setFeedbackLoading(false);
    }
  };

  // Add handleProfilePhotoChange function
  const handleProfilePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result);
        setNewStaff(prev => ({ ...prev, profilePhoto: file }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Add handleSaveProfile function
  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      setProfileError('');

      // Validate required fields
      if (!adminData.name.trim()) {
        setProfileError('Name is required');
        return;
      }

      if (!adminData.email.trim()) {
        setProfileError('Email is required');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(adminData.email)) {
        setProfileError('Please enter a valid email address');
        return;
      }

      // Send the updated profile data to the server
      const response = await fetch('http://localhost:5000/api/admin/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: adminData.name,
          email: adminData.email,
          phone: adminData.phone,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      setSuccessMessage('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      setProfileError(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate password if it's being changed
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          setError('New passwords do not match');
          setLoading(false);
          return;
        }
        if (newPassword.length < 6) {
          setError('Password must be at least 6 characters long');
          setLoading(false);
          return;
        }
      }

      const response = await fetch('http://localhost:5000/api/admin/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminId: adminData.id,
          name: adminData.name,
          email: adminData.email,
          phone: adminData.phone,
          currentPassword: currentPassword, // Add current password
          newPassword: newPassword // Add new password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      setSuccess('Profile updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // Clear all stored data
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Redirect to login page
    window.location.href = '/login';
  };

  const handleGenerateReport = async () => {
    setReportLoading(true);
    setReportError('');
    try {
      const response = await fetch('http://localhost:5000/api/admin/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportType,
          timePeriod,
          targetRole: reportType
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate report');
      }

      setReportData(data.reportData);
    } catch (error) {
      console.error('Error generating report:', error);
      setReportError(error.message);
    } finally {
      setReportLoading(false);
    }
  };

  const renderReport = () => {
    if (!reportData) return null;

    const renderProctorReport = (proctor) => (
      <div key={proctor.staffId} className="mb-8 p-6 bg-white rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">{proctor.name} - Block {proctor.block}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded">
            <h4 className="font-medium text-blue-800">Performance Summary</h4>
            <div className="mt-2 space-y-2">
              <p>Total Complaints: {proctor.summary.totalComplaints}</p>
              <p>Resolved: {proctor.summary.resolved}</p>
              <p>Pending: {proctor.summary.pending}</p>
              <p>In Progress: {proctor.summary.inProgress}</p>
              <p>Performance Score: {proctor.summary.performanceScore}%</p>
              <p>Avg. Resolution Time: {proctor.summary.averageResolutionTime} hours</p>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <h4 className="font-medium text-gray-800">Recent Complaints</h4>
            <div className="mt-2 space-y-2">
              {proctor.complaints.slice(0, 5).map(complaint => (
                <div key={complaint.id} className="text-sm">
                  <p className="font-medium">{complaint.title}</p>
                  <p className="text-gray-600">Status: {complaint.status}</p>
                  <p className="text-gray-500 text-xs">Created: {new Date(complaint.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );

    const renderSupervisorReport = (supervisor) => (
      <div key={supervisor.staffId} className="mb-8 p-6 bg-white rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">{supervisor.name}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-green-50 p-4 rounded">
            <h4 className="font-medium text-green-800">Performance Summary</h4>
            <div className="mt-2 space-y-2">
              <p>Total Complaints: {supervisor.summary.totalComplaints}</p>
              <p>Resolved: {supervisor.summary.resolved}</p>
              <p>Pending: {supervisor.summary.pending}</p>
              <p>In Progress: {supervisor.summary.inProgress}</p>
              <p>Performance Score: {supervisor.summary.performanceScore}%</p>
              <p>Avg. Resolution Time: {supervisor.summary.averageResolutionTime} hours</p>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <h4 className="font-medium text-gray-800">Recent Complaints</h4>
            <div className="mt-2 space-y-2">
              {supervisor.complaints.slice(0, 5).map(complaint => (
                <div key={complaint.id} className="text-sm">
                  <p className="font-medium">{complaint.title}</p>
                  <p className="text-gray-600">Status: {complaint.status}</p>
                  <p className="text-gray-500 text-xs">Created: {new Date(complaint.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );

    const renderDeanReport = (dean) => (
      <div key={dean.staffId} className="mb-8 p-6 bg-white rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">{dean.name}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-purple-50 p-4 rounded">
            <h4 className="font-medium text-purple-800">Feedback Summary</h4>
            <div className="mt-2 space-y-2">
              <p>Total Feedback: {dean.summary.totalFeedback}</p>
              <p>Positive: {dean.summary.positive}</p>
              <p>Neutral: {dean.summary.neutral}</p>
              <p>Negative: {dean.summary.negative}</p>
              <p>Satisfaction Rate: {dean.summary.satisfactionRate}%</p>
              <p>Average Rating: {dean.summary.averageRating}/5</p>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <h4 className="font-medium text-gray-800">Recent Feedback</h4>
            <div className="mt-2 space-y-2">
              {dean.feedback.slice(0, 5).map(f => (
                <div key={f.id} className="text-sm">
                  <div className="flex items-center">
                    <span className="font-medium mr-2">Rating:</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className={`w-4 h-4 ${i < f.rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600 mt-1">{f.comment}</p>
                  <p className="text-gray-500 text-xs">From: Student {f.studentId}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );

    return (
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-6">Performance Report - {timePeriod}</h2>
        {reportData.proctors && reportData.proctors.map(renderProctorReport)}
        {reportData.supervisors && reportData.supervisors.map(renderSupervisorReport)}
        {reportData.deans && reportData.deans.map(renderDeanReport)}
      </div>
    );
  };

  // Add useEffect to fetch blocks and dorms
  useEffect(() => {
    const fetchBlocksAndDorms = async () => {
      try {
        const token = localStorage.getItem('token');
        const [blocksResponse, dormsResponse] = await Promise.all([
          fetch('http://localhost:5000/api/blocks', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }),
          fetch('http://localhost:5000/api/dorms', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
        ]);

        if (!blocksResponse.ok) {
          const errorData = await blocksResponse.json();
          throw new Error(errorData.message || 'Failed to fetch blocks');
        }

        if (!dormsResponse.ok) {
          const errorData = await dormsResponse.json();
          throw new Error(errorData.message || 'Failed to fetch dorms');
        }

        const blocksData = await blocksResponse.json();
        const dormsData = await dormsResponse.json();

        setBlocks(blocksData);
        setDorms(dormsData);
      } catch (error) {
        console.error('Error fetching blocks and dorms:', error);
        setBlockErrorMessage(error.message);
      }
    };

    fetchBlocksAndDorms();
  }, []);

  // Add block management functions
  const handleCreateBlock = async (e) => {
    e.preventDefault();
    setLoading(true);
    setBlockErrorMessage('');

    // Validate block number
    const blockNumber = parseInt(newBlock.number);
    if (isNaN(blockNumber) || blockNumber < 201 || blockNumber > 237) {
      setBlockErrorMessage('Block number must be between 201 and 237');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/blocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newBlock),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message);
        setNewBlock({ number: '' });
        // Fetch blocks again to update the list
        const blocksResponse = await fetch('http://localhost:5000/api/blocks', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const blocksData = await blocksResponse.json();
        setBlocks(blocksData);
      } else {
        setBlockErrorMessage(data.message || 'Failed to create block');
      }
    } catch (error) {
      console.error('Error creating block:', error);
      setBlockErrorMessage('An error occurred while creating the block. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditBlock = (block) => {
    setEditingBlock(block);
    setNewBlock({
      number: block.number
    });
  };

  const handleUpdateBlock = async (e) => {
    e.preventDefault();
    setLoading(true);
    setBlockErrorMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/blocks/${editingBlock._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newBlock),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update block');
      }

      const data = await response.json();
      setBlocks(blocks.map(block =>
        block._id === editingBlock._id ? data : block
      ));
      setEditingBlock(null);
      setNewBlock({ number: '' });
      setSuccessMessage('Block updated successfully');
    } catch (error) {
      setBlockErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBlock = async (blockId) => {
    if (!window.confirm('Are you sure you want to delete this block? This will also delete all associated dorms.')) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/blocks/${blockId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete block');
      }

      setBlocks(blocks.filter(block => block._id !== blockId));
      setDorms(dorms.filter(dorm => dorm.block !== blockId));
      setSuccessMessage('Block deleted successfully');
    } catch (error) {
      setBlockErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Add dorm management functions
  const handleCreateDorm = async (e) => {
    e.preventDefault();
    setLoading(true);
    setDormErrorMessage('');

    // Validate dorm number format and range
    const dormNumber = newDorm.number;
    const floor = dormNumber.charAt(0);
    const roomNumber = parseInt(dormNumber.substring(1));

    let isValid = false;
    if (floor === '0' && roomNumber >= 1 && roomNumber <= 18) {
      isValid = true; // Ground floor (001-018)
    } else if (floor === '1' && roomNumber >= 1 && roomNumber <= 18) {
      isValid = true; // 2nd floor (101-118)
    } else if (floor === '2' && roomNumber >= 1 && roomNumber <= 18) {
      isValid = true; // 3rd floor (201-218)
    }

    if (!isValid) {
      setDormErrorMessage('Invalid dorm number. Must be in format: 001-018 (ground floor), 101-118 (2nd floor), or 201-218 (3rd floor)');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/dorms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newDorm),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message);
        setNewDorm({ number: '', block: '' });
        // Fetch dorms again to update the list
        const dormsResponse = await fetch('http://localhost:5000/api/dorms', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const dormsData = await dormsResponse.json();
        setDorms(dormsData);
      } else {
        setDormErrorMessage(data.message || 'Failed to create dorm');
      }
    } catch (error) {
      console.error('Error creating dorm:', error);
      setDormErrorMessage('An error occurred while creating the dorm. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditDorm = (dorm) => {
    setEditingDorm(dorm);
    setNewDorm({
      number: dorm.number,
      block: dorm.block
    });
  };

  const handleUpdateDorm = async (e) => {
    e.preventDefault();
    setLoading(true);
    setDormErrorMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/dorms/${editingDorm._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newDorm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update dorm');
      }

      const data = await response.json();
      setDorms(dorms.map(dorm =>
        dorm._id === editingDorm._id ? data : dorm
      ));
      setEditingDorm(null);
      setNewDorm({ number: '', block: '' });
      setSuccessMessage('Dorm updated successfully');
    } catch (error) {
      setDormErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDorm = async (dormId) => {
    if (!window.confirm('Are you sure you want to delete this dorm?')) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/dorms/${dormId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete dorm');
      }

      setDorms(dorms.filter(dorm => dorm._id !== dormId));
      setSuccessMessage('Dorm deleted successfully');
    } catch (error) {
      setDormErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Add useEffect to fetch blocks with authentication
  useEffect(() => {
    const fetchBlocks = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/blocks', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch blocks');
        }

        const data = await response.json();
        setBlocks(data);
      } catch (error) {
        console.error('Error fetching blocks:', error);
        setErrorMessage('Failed to load blocks');
      }
    };

    // Fetch blocks when component mounts and when activeTab changes to create-staff
    if (activeTab === 'create-staff') {
      fetchBlocks();
    }
  }, [activeTab]);

  const validateForm = () => {
    const errors = {};

    // Name validation
    if (!newStaff.name.trim()) {
      errors.name = 'Name is required';
    }

    // Email validation
    if (!newStaff.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newStaff.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Phone validation
    if (!newStaff.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(newStaff.phone)) {
      errors.phone = 'Phone number must be exactly 10 digits';
    }

    // Password validation
    if (!newStaff.password) {
      errors.password = 'Password is required';
    } else if (newStaff.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    // Role validation
    if (!newStaff.role) {
      errors.role = 'Role is required';
    }

    // Block validation for proctors
    if (newStaff.role === 'proctor' && !newStaff.block) {
      errors.block = 'Block is required for proctors';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Add this new function to reorder student IDs
  const reorderStudentIds = (students) => {
    // Sort students by their current ID to maintain order
    const sortedStudents = [...students].sort((a, b) => {
      const numA = parseInt(a.studentId.replace('s', ''));
      const numB = parseInt(b.studentId.replace('s', ''));
      return numA - numB;
    });

    // Reassign IDs sequentially
    return sortedStudents.map((student, index) => ({
      ...student,
      studentId: `s${String(index + 1).padStart(3, '0')}`
    }));
  };

  // Modify the fetchStudentApprovals function
  useEffect(() => {
    const fetchStudentApprovals = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/student-approvals', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch student approvals');
        }
        const data = await response.json();
        // Reorder the IDs when fetching
        const reorderedData = reorderStudentIds(data);
        setStudentApprovals(reorderedData);
      } catch (error) {
        console.error('Error fetching student approvals:', error);
      }
    };

    if (activeTab === 'account-approvals') {
      fetchStudentApprovals();
    }
  }, [activeTab]);

  // Modify the handleDeleteStudent function
  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete this student approval?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/student-approvals/${studentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete student approval');
      }

      // Remove the student and reorder the remaining ones
      const updatedStudents = studentApprovals.filter(student => student._id !== studentId);
      const reorderedStudents = reorderStudentIds(updatedStudents);

      // Update the database with new IDs
      await Promise.all(reorderedStudents.map(async (student) => {
        const updateResponse = await fetch(`http://localhost:5000/api/student-approvals/${student._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ studentId: student.studentId })
        });
        if (!updateResponse.ok) {
          throw new Error('Failed to update student ID');
        }
      }));

      setStudentApprovals(reorderedStudents);
    } catch (error) {
      console.error('Error deleting student approval:', error);
    }
  };

  // Modify the handleCreateStudent function
  const handleCreateStudent = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      // Check if email already exists
      const existingEmail = studentApprovals.find(s => s.email === newStudent.email);
      if (existingEmail) {
        setErrorMessage('Email already exists. Please use a different email.');
        setLoading(false);
        return;
      }

      // Format the date to be compatible with datetime-local input
      const formattedDate = new Date(newStudent.registrationDate).toISOString().slice(0, 16);

      // Generate the next sequential ID
      const nextId = `s${String(studentApprovals.length + 1).padStart(3, '0')}`;

      const response = await fetch('http://localhost:5000/api/student-approvals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          studentId: nextId,
          name: newStudent.name,
          email: newStudent.email,
          department: newStudent.department,
          college: newStudent.college,
          status: 'pending',
          registrationDate: formattedDate
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Student approval request created successfully');
        setNewStudent({
          studentId: '',
          name: '',
          email: '',
          department: '',
          college: '',
          status: 'pending',
          registrationDate: new Date().toISOString().slice(0, 16)
        });
        setShowAddStudentForm(false);

        // Refresh the student approvals list
        const approvalsResponse = await fetch('http://localhost:5000/api/student-approvals', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const approvalsData = await approvalsResponse.json();
        const reorderedData = reorderStudentIds(approvalsData);
        setStudentApprovals(reorderedData);
      } else {
        setErrorMessage(data.message || 'Failed to create student approval request');
      }
    } catch (error) {
      console.error('Error creating student approval:', error);
      setErrorMessage('An error occurred while creating the student approval request');
    } finally {
      setLoading(false);
    }
  };

  // Handle CSV file upload
  const handleCsvUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) {
      setUploadStatus('Please select a CSV file');
      return;
    }

    const formData = new FormData();
    formData.append('file', csvFile);

    try {
      setUploadStatus('Uploading...');
      const response = await fetch('http://localhost:5000/api/student-approvals/upload-csv', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload CSV file');
      }

      setUploadStatus(`Successfully processed ${data.count} students`);
      setCsvFile(null);

      // Refresh the student approvals list
      const approvalsResponse = await fetch('http://localhost:5000/api/student-approvals', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!approvalsResponse.ok) {
        throw new Error('Failed to refresh student list');
      }

      const approvalsData = await approvalsResponse.json();
      setStudentApprovals(approvalsData);
    } catch (error) {
      console.error('Error uploading CSV:', error);
      setUploadStatus(`Error: ${error.message}`);
    }
  };

  // Handle student approval/rejection
  const handleStudentAction = async (studentId, action) => {
    try {
      if (action === 'rejected' && !rejectionReason) {
        setSelectedStudent(studentApprovals.find(s => s._id === studentId));
        return;
      }

      const response = await fetch(`http://localhost:5000/api/student-approvals/${studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status: action,
          rejectionReason: action === 'rejected' ? rejectionReason : undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update student status');
      }

      // Update the student in the list
      setStudentApprovals(prev => prev.map(student =>
        student._id === studentId
          ? { ...student, status: action }
          : student
      ));

      setSelectedStudent(null);
      setRejectionReason('');
      setSuccessMessage(`Student ${action} successfully`);
    } catch (error) {
      console.error('Error updating student status:', error);
      setErrorMessage('Failed to update student status');
    }
  };

  // Add these new handler functions
  const handleStudentEdit = (studentId, field, value) => {
    setEditingStudents(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  const handleSaveStudent = async (studentId) => {
    try {
      const editedStudent = editingStudents[studentId];
      if (!editedStudent) return;

      const response = await fetch(`http://localhost:5000/api/student-approvals/${studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(editedStudent)
      });

      if (!response.ok) {
        throw new Error('Failed to update student');
      }

      // Update the student in the list
      setStudentApprovals(prev => prev.map(student =>
        student._id === studentId
          ? { ...student, ...editedStudent }
          : student
      ));

      // Clear the editing state for this student
      setEditingStudents(prev => {
        const newState = { ...prev };
        delete newState[studentId];
        return newState;
      });

      setSuccessMessage('Student updated successfully');
    } catch (error) {
      console.error('Error updating student:', error);
      setErrorMessage('Failed to update student');
    }
  };

  // Add useEffect to filter student approvals based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredApprovals(studentApprovals);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = studentApprovals.filter(approval =>
        approval.studentId.toLowerCase().includes(query) ||
        approval.name.toLowerCase().includes(query) ||
        approval.email.toLowerCase().includes(query) ||
        approval.department.toLowerCase().includes(query) ||
        approval.college.toLowerCase().includes(query)
      );
      setFilteredApprovals(filtered);
    }
  }, [searchQuery, studentApprovals]);

  const handleEditStudent = async (student) => {
    setEditingStudent(student);
    setNewStudent({
      studentId: student.studentId,
      name: student.name,
      email: student.email,
      department: student.department,
      college: student.college,
      status: student.status,
      registrationDate: new Date(student.registrationDate).toISOString().slice(0, 16)
    });

    // Fetch departments for the selected college
    try {
      const response = await fetch(`http://localhost:5000/api/colleges/${encodeURIComponent(student.college)}/departments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch departments');
      const data = await response.json();
      setDepartments(data);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setErrorMessage('Failed to load departments');
    }

    setShowAddStudentForm(true);
  };

  // Update handleUpdateStudent to check for uniqueness
  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      // Check if studentId already exists (excluding the current student)
      const existingId = studentApprovals.find(s =>
        s.studentId === newStudent.studentId && s._id !== editingStudent._id
      );
      if (existingId) {
        setErrorMessage('Student ID already exists. Please use a different ID.');
        setLoading(false);
        return;
      }

      // Check if email already exists (excluding the current student)
      const existingEmail = studentApprovals.find(s =>
        s.email === newStudent.email && s._id !== editingStudent._id
      );
      if (existingEmail) {
        setErrorMessage('Email already exists. Please use a different email.');
        setLoading(false);
        return;
      }

      const response = await fetch(`http://localhost:5000/api/student-approvals/${editingStudent._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          studentId: newStudent.studentId,
          name: newStudent.name,
          email: newStudent.email,
          department: newStudent.department,
          college: newStudent.college,
          status: newStudent.status,
          registrationDate: newStudent.registrationDate
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update student');
      }

      // Update the student in the list
      setStudentApprovals(prevApprovals =>
        prevApprovals.map(approval =>
          approval._id === editingStudent._id
            ? { ...approval, ...newStudent }
            : approval
        )
      );

      setSuccessMessage('Student updated successfully');
      setEditingStudent(null);
      setNewStudent({
        studentId: '',
        name: '',
        email: '',
        department: '',
        college: '',
        status: 'pending',
        registrationDate: new Date().toISOString().slice(0, 16)
      });
      setShowAddStudentForm(false);
    } catch (error) {
      console.error('Error updating student:', error);
      setErrorMessage(error.message || 'An error occurred while updating the student');
    } finally {
      setLoading(false);
    }
  };

  // Update the form submission handler in the Add Student Form Modal
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (editingStudent) {
      handleUpdateStudent(e);
    } else {
      handleCreateStudent(e);
    }
  };

  // Add this new function for handling inline edit
  const handleInlineEdit = (student) => {
    setEditingStudentId(student._id);
    setEditingStudentData({
      studentId: student.studentId,
      name: student.name,
      email: student.email,
      department: student.department,
      college: student.college,
      status: student.status,
      registrationDate: student.registrationDate
    });
  };

  const handleInlineSave = async (studentId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/student-approvals/${studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(editingStudentData)
      });

      if (!response.ok) {
        throw new Error('Failed to update student');
      }

      // Update the student in the list
      setStudentApprovals(prev => prev.map(student =>
        student._id === studentId
          ? { ...student, ...editingStudentData }
          : student
      ));

      setEditingStudentId(null);
      setEditingStudentData(null);
      setSuccessMessage('Student updated successfully');
    } catch (error) {
      console.error('Error updating student:', error);
      setErrorMessage('Failed to update student');
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-mode');
  };

  const fetchSummaryReports = async () => {
    setLoadingSummaryReports(true);
    setSummaryReportsError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/complaints/summary?role=${selectedRole}`, {
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

      // Extract unique blocks from the reports and sort them
      const blockNumbers = data.data.map(report => {
        const block = String(report.blockNumber).trim();
        return block;
      }).filter(block => block !== '' && block !== undefined && block !== null);

      const uniqueBlocks = ['all', ...new Set(blockNumbers)].sort((a, b) => {
        if (a === 'all') return -1;
        if (b === 'all') return 1;
        return parseInt(a) - parseInt(b);
      });

      setAvailableBlocks(uniqueBlocks);
      setSummaryReports(data.data);
    } catch (error) {
      console.error('Error fetching summary reports:', error);
      setSummaryReportsError(error.message);
    } finally {
      setLoadingSummaryReports(false);
    }
  };

  const handleRoleChange = (e) => {
    setSelectedRole(e.target.value);
    fetchSummaryReports();
  };

  const handleBlockChange = (e) => {
    setSelectedBlock(e.target.value);
  };

  // Filter reports based on selected role and block
  const filteredReports = selectedBlock === 'all'
    ? [{
      name: 'All Staff',
      role: selectedRole === 'all' ? 'All Roles' : selectedRole,
      blockNumber: 'All Blocks',
      totalComplaints: summaryReports.reduce((sum, report) => sum + report.totalComplaints, 0),
      resolvedComplaints: summaryReports.reduce((sum, report) => sum + report.resolvedComplaints, 0),
      pendingComplaints: summaryReports.reduce((sum, report) => sum + report.pendingComplaints, 0),
      summary: `Total: ${summaryReports.reduce((sum, report) => sum + report.totalComplaints, 0)}, 
               Resolved: ${summaryReports.reduce((sum, report) => sum + report.resolvedComplaints, 0)}, 
               Pending: ${summaryReports.reduce((sum, report) => sum + report.pendingComplaints, 0)}`
    }]
    : summaryReports.filter(report => String(report.blockNumber).trim() === selectedBlock);

  const handleViewSummaryReports = () => {
    setShowSummaryReports(true);
    fetchSummaryReports();
  };

  const toggleMobileNav = () => {
    setIsMobileNavOpen(!isMobileNavOpen);
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="nav-actions">
          <div className="nav-right">
            <AdminNotificationBell userId={userData?.userId} />
            <button className="dark-mode-toggle" onClick={toggleDarkMode}>
              <FontAwesomeIcon icon={darkMode ? faSun : faMoon} />
              {darkMode ? ' Light Mode' : ' Dark Mode'}
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              <FontAwesomeIcon icon={faSignOutAlt} /> Logout
            </button>
          </div>
        </div>
        <button className="admin-hamburger" onClick={toggleMobileNav}>
          ☰
        </button>
      </div>

      {/* Mobile Navigation */}
      <div className={`admin-mobile-nav ${isMobileNavOpen ? 'active' : ''}`}>
        <div className="admin-mobile-nav-header">
          <h2>Menu</h2>
          <button className="admin-mobile-close-btn" onClick={toggleMobileNav}>
            ✕
          </button>
        </div>
        <div className="admin-mobile-nav-buttons">
          <button
            className={activeTab === 'account-approvals' ? 'active' : ''}
            onClick={() => {
              setActiveTab('account-approvals');
              setIsMobileNavOpen(false);
            }}
          >
            Student Approvals ({accountRequests.length})
          </button>
          <button
            className={activeTab === 'create-staff' ? 'active' : ''}
            onClick={() => {
              setActiveTab('create-staff');
              setIsMobileNavOpen(false);
            }}
          >
            Create Staff
          </button>
          <button
            className={activeTab === 'feedback' ? 'active' : ''}
            onClick={() => {
              setActiveTab('feedback');
              setIsMobileNavOpen(false);
            }}
          >
            Student Feedback
          </button>
          <button
            className={activeTab === 'profile' ? 'active' : ''}
            onClick={() => {
              setActiveTab('profile');
              setIsMobileNavOpen(false);
            }}
          >
            Profile
          </button>
          <button
            className={activeTab === 'colleges-departments' ? 'active' : ''}
            onClick={() => {
              setActiveTab('colleges-departments');
              setIsMobileNavOpen(false);
            }}
          >
            Colleges & Departments
          </button>
          <button
            className={activeTab === 'blocks-dorms' ? 'active' : ''}
            onClick={() => {
              setActiveTab('blocks-dorms');
              setIsMobileNavOpen(false);
            }}
          >
            Blocks & Dorms
          </button>
          <button
            className={activeTab === 'summary-reports' ? 'active' : ''}
            onClick={() => {
              setActiveTab('summary-reports');
              setIsMobileNavOpen(false);
            }}
          >
            Summary Reports
          </button>
          <div className="mobile-action-buttons">
            <AdminNotificationBell userId={userData?.userId} />
            <button className="dark-mode-toggle" onClick={() => {
              toggleDarkMode();
              setIsMobileNavOpen(false);
            }}>
              <FontAwesomeIcon icon={darkMode ? faSun : faMoon} />
              {darkMode ? ' Light Mode' : ' Dark Mode'}
            </button>
            <button className="logout-btn" onClick={() => {
              handleLogout();
              setIsMobileNavOpen(false);
            }}>
              <FontAwesomeIcon icon={faSignOutAlt} /> Logout
            </button>
          </div>
        </div>
      </div>

      <nav className="admin-nav">
        <button onClick={() => setActiveTab('account-approvals')}>
          Student Approvals ({accountRequests.length})
        </button>
        <button onClick={() => setActiveTab('create-staff')}>
          Create Staff
        </button>
        <button onClick={() => setActiveTab('feedback')}>
          Student Feedback
        </button>

        <button onClick={() => setActiveTab('profile')}>
          Profile
        </button>
        <button onClick={() => setActiveTab('colleges-departments')}>
          Colleges & Departments
        </button>
        <button onClick={() => setActiveTab('blocks-dorms')}>
          Blocks & Dorms
        </button>
        <button onClick={() => setActiveTab('summary-reports')}>
          Summary Reports
        </button>
      </nav>

      {/* Profile Section */}
      {activeTab === 'profile' && (
        <div className="section">
          <h2 style={{ color: 'white' }}>Admin Profile</h2>

          {loading ? (
            <p style={{ color: 'white' }}>Loading profile data...</p>
          ) : adminData ? (
            <div className="profile-container">
              {/* Profile Card */}
              <div className="profile-card" style={{
                backgroundColor: '#2a2a2a',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '20px',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '20px'
                }}>
                  <div className="profile-photo-container" style={{ position: 'relative' }}>
                    {currentProfilePhoto ? (
                      <img
                        src={currentProfilePhoto}
                        alt="Profile"
                        style={{
                          width: '120px',
                          height: '120px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          marginRight: '20px',
                          border: '3px solid #4a4a4a'
                        }}
                        onError={(e) => {
                          console.error('Failed to load profile photo:', currentProfilePhoto);
                          e.target.style.display = 'none';
                          e.target.parentNode.innerHTML = `
                            <div style="
                              width: 120px; 
                              height: 120px; 
                              border-radius: 50%; 
                              background-color: #4a4a4a; 
                              display: flex; 
                              justify-content: center; 
                              align-items: center;
                              margin-right: 20px;
                              font-size: 48px;
                              color: white;
                              border: 3px solid #4a4a4a;
                            ">
                              ${adminData.name.charAt(0)}
                            </div>
                          `;
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        backgroundColor: '#4a4a4a',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: '20px',
                        fontSize: '48px',
                        color: 'white',
                        border: '3px solid #4a4a4a'
                      }}>
                        {adminData.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ color: 'white', margin: '0 0 10px 0' }}>{adminData.name}</h3>
                    <p style={{ color: '#aaa', margin: '0' }}>{adminData.role}</p>
                  </div>
                </div>

                <div style={{
                  backgroundColor: '#333',
                  borderRadius: '8px',
                  padding: '20px'
                }}>
                  <h5 style={{ color: '#aaa', margin: '0 0 10px 0' }}>Personal Information</h5>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '10px',
                    paddingBottom: '10px',
                    borderBottom: '1px solid #444'
                  }}>
                    <span style={{ color: '#aaa' }}>Name:</span>
                    <span style={{ color: 'white' }}>{adminData.name}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '10px',
                    paddingBottom: '10px',
                    borderBottom: '1px solid #444'
                  }}>
                    <span style={{ color: '#aaa' }}>Email:</span>
                    <span style={{ color: 'white' }}>{adminData.email}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '10px',
                    paddingBottom: '10px',
                    borderBottom: '1px solid #444'
                  }}>
                    <span style={{ color: '#aaa' }}>Phone:</span>
                    <span style={{ color: 'white' }}>{adminData.phone}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '10px',
                    paddingBottom: '10px',
                    borderBottom: '1px solid #444'
                  }}>
                    <span style={{ color: '#aaa' }}>Admin ID:</span>
                    <span style={{ color: 'white' }}>{adminData.adminId}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '10px',
                    paddingBottom: '10px',
                    borderBottom: '1px solid #444'
                  }}>
                    <span style={{ color: '#aaa' }}>Member Since:</span>
                    <span style={{ color: 'white' }}>
                      {new Date(adminData.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p style={{ color: 'white' }}>Failed to load profile data.</p>
          )}
        </div>
      )}

      {/* Create Staff Section */}
      {activeTab === 'create-staff' && (
        <div className="section">
          <h2 style={{ color: 'white' }}>Create Staff Account</h2>

          {successMessage && (
            <div className="success-message" style={{
              color: 'green',
              backgroundColor: '#2a2a2a',
              padding: '10px',
              marginBottom: '10px',
              borderRadius: '4px'
            }}>
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="error-message" style={{
              color: 'red',
              backgroundColor: '#2a2a2a',
              padding: '10px',
              marginBottom: '10px',
              borderRadius: '4px'
            }}>
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleCreateStaff} className="staff-form" style={{
            backgroundColor: '#2a2a2a',
            padding: '20px',
            borderRadius: '8px'
          }}>
            <div className="photo-upload" style={{ marginBottom: '20px' }}>
              <div
                className="profile-preview"
                onClick={() => document.getElementById('staffPhoto').click()}
                style={{
                  width: '150px',
                  height: '150px',
                  border: '2px dashed #444',
                  borderRadius: '50%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  overflow: 'hidden'
                }}
              >
                {profilePreview ? (
                  <img
                    src={profilePreview}
                    alt="Preview"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div className="upload-placeholder" style={{ color: 'white', textAlign: 'center' }}>
                    <span style={{ fontSize: '24px' }}>+</span>
                    <p style={{ margin: '5px 0 0 0' }}>Upload Photo</p>
                  </div>
                )}
              </div>
              <input
                type="file"
                id="staffPhoto"
                accept="image/*"
                onChange={handleProfilePhotoChange}
                hidden
              />
            </div>

            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label style={{ color: 'white', display: 'block', marginBottom: '5px' }}>Full Name</label>
              <input
                type="text"
                value={newStaff.name}
                onChange={e => setNewStaff({ ...newStaff, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #444',
                  backgroundColor: '#1a1a1a',
                  color: 'white'
                }}
                required
                placeholder="Enter Full Name"
              />
              {formErrors.name && (
                <span style={{ color: 'red', fontSize: '12px' }}>{formErrors.name}</span>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label style={{ color: 'white', display: 'block', marginBottom: '5px' }}>Email</label>
              <input
                type="email"
                value={newStaff.email}
                onChange={e => setNewStaff({ ...newStaff, email: e.target.value })}
                onBlur={handleEmailBlur}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: `1px solid ${formErrors.email ? 'red' : '#444'}`,
                  backgroundColor: '#1a1a1a',
                  color: 'white'
                }}
                placeholder="Enter email"
              />
              {formErrors.email && (
                <span style={{ color: 'red', fontSize: '12px' }}>{formErrors.email}</span>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label style={{ color: 'white', display: 'block', marginBottom: '5px' }}>Phone Number</label>
              <input
                type="tel"
                value={newStaff.phone}
                onChange={e => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setNewStaff({ ...newStaff, phone: value });
                }}
                onBlur={handlePhoneBlur}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: `1px solid ${formErrors.phone ? 'red' : '#444'}`,
                  backgroundColor: '#1a1a1a',
                  color: 'white'
                }}
                maxLength="10"
                pattern="[0-9]*"
                inputMode="numeric"
                placeholder="Enter phone number"
              />
              {formErrors.phone && (
                <span style={{ color: 'red', fontSize: '12px' }}>{formErrors.phone}</span>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label style={{ color: 'white', display: 'block', marginBottom: '5px' }}>Password</label>
              <input
                type="password"
                value={newStaff.password}
                onChange={e => setNewStaff({ ...newStaff, password: e.target.value })}
                onBlur={handlePasswordBlur}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: `1px solid ${formErrors.password ? 'red' : '#444'}`,
                  backgroundColor: '#1a1a1a',
                  color: 'white'
                }}
                placeholder="Enter password"
              />
              {formErrors.password && (
                <span style={{ color: 'red', fontSize: '12px' }}>{formErrors.password}</span>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label style={{ color: 'white', display: 'block', marginBottom: '5px' }}>Role</label>
              <select
                value={newStaff.role}
                onChange={e => setNewStaff({ ...newStaff, role: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #444',
                  backgroundColor: '#1a1a1a',
                  color: 'white'
                }}
              >
                <option value="proctor">Proctor</option>
                <option value="supervisor">Supervisor</option>
                <option value="dean">Student Dean</option>
              </select>
            </div>

            {newStaff.role === 'proctor' && (
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ color: 'white', display: 'block', marginBottom: '5px' }}>Block</label>
                <select
                  value={newStaff.block}
                  onChange={e => setNewStaff(prev => ({ ...prev, block: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: `1px solid ${formErrors.block ? 'red' : '#444'}`,
                    backgroundColor: '#1a1a1a',
                    color: 'white'
                  }}
                  required
                >
                  <option value="">Select Block</option>
                  {blocks.map((block) => (
                    <option key={block._id} value={block._id}>
                      Block {block.number}
                    </option>
                  ))}
                </select>
                {formErrors.block && (
                  <span style={{ color: 'red', fontSize: '12px' }}>{formErrors.block}</span>
                )}
              </div>
            )}

            {newStaff.role === 'supervisor' && (
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ color: 'white', display: 'block', marginBottom: '5px' }}>Gender</label>
                <select
                  value={newStaff.gender}
                  onChange={e => setNewStaff({ ...newStaff, gender: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #444',
                    backgroundColor: '#1a1a1a',
                    color: 'white'
                  }}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              style={{
                background: '#4a4a4a',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer',
                width: '100%',
                marginTop: '20px'
              }}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        </div>
      )}

      {/* Colleges and Departments Section */}
      {activeTab === 'colleges-departments' && (
        <div className="section">
          <h2 style={{ color: 'white' }}>Manage Colleges and Departments</h2>

          {/* College Creation Form */}
          <div className="subsection">
            <h3 style={{ color: 'white' }}>
              {editingCollege ? 'Edit College' : 'Create College'}
            </h3>
            <form onSubmit={editingCollege ? handleUpdateCollege : handleCreateCollege} className="college-form">
              <div className="form-group">
                <label style={{ color: 'white' }}>College Name</label>
                <input
                  type="text"
                  value={newCollege.name || ''}
                  onChange={(e) => setNewCollege({ ...newCollege, name: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  style={{ background: 'green', color: 'white' }}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : (editingCollege ? 'Update College' : 'Create College')}
                </button>
                {editingCollege && (
                  <button
                    type="button"
                    style={{ background: 'gray', color: 'white' }}
                    onClick={() => {
                      setEditingCollege(null);
                      setNewCollege({ name: '' });
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
              {collegeErrorMessage && (
                <div className="error-message" style={{ color: 'red', marginTop: '10px' }}>
                  {collegeErrorMessage}
                </div>
              )}
            </form>

            {/* Display Colleges */}
            <div className="colleges-list">
              <h4 style={{ color: 'white' }}>Existing Colleges</h4>
              <div style={{
                maxHeight: '300px',
                overflowY: 'auto',
                padding: '10px',
                backgroundColor: '#2a2a2a',
                borderRadius: '8px',
                marginTop: '10px'
              }}>
                {colleges.length > 0 ? (
                  <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0
                  }}>
                    {colleges.map((college) => (
                      <li key={college._id} style={{
                        color: 'white',
                        padding: '10px',
                        borderBottom: '1px solid #444',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span>{college.name}</span>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={() => handleEditCollege(college)}
                            style={{
                              background: 'blue',
                              color: 'white',
                              border: 'none',
                              padding: '5px 10px',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCollege(college._id)}
                            style={{
                              background: 'red',
                              color: 'white',
                              border: 'none',
                              padding: '5px 10px',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: 'white', textAlign: 'center', padding: '20px' }}>
                    No colleges found.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Department Creation Form */}
          <div className="subsection">
            <h3 style={{ color: 'white' }}>
              {editingDepartment ? 'Edit Department' : 'Create Department'}
            </h3>
            <form onSubmit={editingDepartment ? handleUpdateDepartment : handleCreateDepartment} className="department-form">
              <div className="form-group">
                <label style={{ color: 'white' }}>Department Name</label>
                <input
                  type="text"
                  value={newDepartment.name || ''}
                  onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label style={{ color: 'white' }}>College</label>
                <select
                  value={newDepartment.college || ''}
                  onChange={(e) => setNewDepartment({ ...newDepartment, college: e.target.value })}
                  required
                >
                  <option value="">Select College</option>
                  {colleges.map((college) => (
                    <option key={college._id} value={college._id}>
                      {college.name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  style={{ background: 'green', color: 'white' }}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : (editingDepartment ? 'Update Department' : 'Create Department')}
                </button>
                {editingDepartment && (
                  <button
                    type="button"
                    style={{ background: 'gray', color: 'white' }}
                    onClick={() => {
                      setEditingDepartment(null);
                      setNewDepartment({ name: '', college: '' });
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
              {departmentErrorMessage && (
                <div className="error-message" style={{ color: 'red', marginTop: '10px' }}>
                  {departmentErrorMessage}
                </div>
              )}
            </form>

            {/* Display Departments */}
            <div className="departments-list">
              <h4 style={{ color: 'white' }}>Existing Departments</h4>
              <div style={{
                maxHeight: '300px',
                overflowY: 'auto',
                padding: '10px',
                backgroundColor: '#2a2a2a',
                borderRadius: '8px',
                marginTop: '10px'
              }}>
                {departments.length > 0 ? (
                  <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0
                  }}>
                    {departments.map((department) => (
                      <li key={department._id} style={{
                        color: 'white',
                        padding: '10px',
                        borderBottom: '1px solid #444',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <span>{department.name}</span>
                          <span style={{ color: '#aaa', marginLeft: '10px' }}>
                            ({department.college?.name || 'Unknown College'})
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={() => handleEditDepartment(department)}
                            style={{
                              background: 'blue',
                              color: 'white',
                              border: 'none',
                              padding: '5px 10px',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteDepartment(department._id)}
                            style={{
                              background: 'red',
                              color: 'white',
                              border: 'none',
                              padding: '5px 10px',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: 'white', textAlign: 'center', padding: '20px' }}>
                    No departments found.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Section */}
      {activeTab === 'feedback' && (
        <div className="section">
          <h2 style={{ color: 'white' }}>Student Feedback</h2>

          {successMessage && (
            <div style={{
              color: 'green',
              backgroundColor: '#2a2a2a',
              padding: '10px',
              marginBottom: '10px',
              borderRadius: '4px'
            }}>
              {successMessage}
            </div>
          )}

          {feedbackError && (
            <div style={{
              color: 'red',
              backgroundColor: '#2a2a2a',
              padding: '10px',
              marginBottom: '10px',
              borderRadius: '4px'
            }}>
              {feedbackError}
            </div>
          )}

          {feedbackLoading ? (
            <p style={{ color: 'white' }}>Loading feedback data...</p>
          ) : feedback.length === 0 ? (
            <p style={{ color: 'white' }}>No feedback available.</p>
          ) : (
            <div className="feedback-container" style={{
              maxHeight: '600px',
              overflowY: 'auto',
              padding: '10px'
            }}>
              {feedback.map((item) => (
                <div key={item._id} className="feedback-card" style={{
                  backgroundColor: '#2a2a2a',
                  padding: '20px',
                  marginBottom: '20px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}>
                  <div className="feedback-header" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '15px'
                  }}>
                    <div className="rating" style={{ color: '#FFD700' }}>
                      {[...Array(5)].map((_, index) => (
                        <span
                          key={index}
                          style={{
                            fontSize: '20px',
                            marginRight: '2px',
                            color: index < item.rating ? '#FFD700' : '#ddd'
                          }}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="feedback-date" style={{ color: '#aaa' }}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                      {item.viewedByAdmin && (
                        <div style={{ color: '#4CAF50', fontSize: '14px' }}>
                          Viewed {new Date(item.viewedAt).toLocaleDateString()}
                        </div>
                      )}
                      <button
                        onClick={() => handleDeleteFeedback(item._id)}
                        style={{
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          transition: 'background-color 0.3s'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#c82333'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#dc3545'}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="feedback-content" style={{
                    color: 'white',
                    marginBottom: '15px',
                    backgroundColor: '#363636',
                    padding: '15px',
                    borderRadius: '4px'
                  }}>
                    <p style={{ margin: 0 }}>{item.comment}</p>
                  </div>
                  <div className="feedback-footer" style={{ color: '#aaa', fontSize: '14px' }}>
                    <span>Student ID: {item.userId}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}



      {/* Add Blocks & Dorms Section */}
      {activeTab === 'blocks-dorms' && (
        <div className="section">
          <h2 style={{ color: 'white' }}>Manage Blocks and Dorms</h2>

          {/* Block Management */}
          <div className="subsection">
            <h3 style={{ color: 'white' }}>
              {editingBlock ? 'Edit Block' : 'Create Block'}
            </h3>
            <form onSubmit={editingBlock ? handleUpdateBlock : handleCreateBlock} className="block-form" style={{
              backgroundColor: '#2a2a2a',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              {successMessage && (
                <div style={{
                  color: 'green',
                  backgroundColor: '#1a1a1a',
                  padding: '10px',
                  marginBottom: '10px',
                  borderRadius: '4px'
                }}>
                  {successMessage}
                </div>
              )}
              {blockErrorMessage && (
                <div style={{
                  color: 'red',
                  backgroundColor: '#1a1a1a',
                  padding: '10px',
                  marginBottom: '10px',
                  borderRadius: '4px'
                }}>
                  {blockErrorMessage}
                </div>
              )}
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ color: 'white', display: 'block', marginBottom: '5px' }}>Block Number</label>
                <input
                  type="text"
                  value={newBlock.number}
                  onChange={(e) => setNewBlock({ ...newBlock, number: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: '1px solid #444',
                    color: 'white',
                    padding: '8px',
                    borderRadius: '4px'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  style={{
                    background: '#4a4a4a',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    flex: 1
                  }}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : (editingBlock ? 'Update Block' : 'Create Block')}
                </button>
                {editingBlock && (
                  <button
                    type="button"
                    style={{
                      background: '#6c757d',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      setEditingBlock(null);
                      setNewBlock({ number: '' });
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {/* Display Blocks */}
            <div className="blocks-list">
              <h4 style={{ color: 'white' }}>Existing Blocks</h4>
              <div className="list-container" style={{
                maxHeight: '300px',
                overflowY: 'auto',
                backgroundColor: '#2a2a2a',
                borderRadius: '8px',
                padding: '10px'
              }}>
                {blocks.length > 0 ? (
                  blocks.map((block) => (
                    <div key={block._id} className="list-item" style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px',
                      borderBottom: '1px solid #444',
                      color: 'white'
                    }}>
                      <span>Block {block.number}</span>
                      <div className="action-buttons" style={{ display: 'flex', gap: '10px' }}>
                        <button
                          onClick={() => handleEditBlock(block)}
                          style={{
                            background: '#007bff',
                            color: 'white',
                            border: 'none',
                            padding: '5px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteBlock(block._id)}
                          style={{
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            padding: '5px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: 'white', textAlign: 'center', padding: '20px' }}>
                    No blocks found.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Dorm Management */}
          <div className="subsection">
            <h3 style={{ color: 'white' }}>
              {editingDorm ? 'Edit Dorm' : 'Create Dorm'}
            </h3>
            <form onSubmit={editingDorm ? handleUpdateDorm : handleCreateDorm} className="dorm-form" style={{
              backgroundColor: '#2a2a2a',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              {successMessage && (
                <div style={{
                  color: 'green',
                  backgroundColor: '#1a1a1a',
                  padding: '10px',
                  marginBottom: '10px',
                  borderRadius: '4px'
                }}>
                  {successMessage}
                </div>
              )}
              {dormErrorMessage && (
                <div style={{
                  color: 'red',
                  backgroundColor: '#1a1a1a',
                  padding: '10px',
                  marginBottom: '10px',
                  borderRadius: '4px'
                }}>
                  {dormErrorMessage}
                </div>
              )}
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ color: 'white', display: 'block', marginBottom: '5px' }}>Dorm Number</label>
                <input
                  type="text"
                  value={newDorm.number}
                  onChange={(e) => setNewDorm({ ...newDorm, number: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: '1px solid #444',
                    color: 'white',
                    padding: '8px',
                    borderRadius: '4px'
                  }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ color: 'white', display: 'block', marginBottom: '5px' }}>Block</label>
                <select
                  value={newDorm.block}
                  onChange={(e) => setNewDorm({ ...newDorm, block: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: '1px solid #444',
                    color: 'white',
                    padding: '8px',
                    borderRadius: '4px'
                  }}
                >
                  <option value="">Select Block</option>
                  {blocks.map((block) => (
                    <option key={block._id} value={block._id}>
                      Block {block.number}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  style={{
                    background: '#4a4a4a',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    flex: 1
                  }}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : (editingDorm ? 'Update Dorm' : 'Create Dorm')}
                </button>
                {editingDorm && (
                  <button
                    type="button"
                    style={{
                      background: '#6c757d',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      setEditingDorm(null);
                      setNewDorm({ number: '', block: '' });
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {/* Display Dorms */}
            <div className="dorms-list">
              <h4 style={{ color: 'white' }}>Existing Dorms</h4>
              <div className="list-container" style={{
                maxHeight: '300px',
                overflowY: 'auto',
                backgroundColor: '#2a2a2a',
                borderRadius: '8px',
                padding: '10px'
              }}>
                {dorms.length > 0 ? (
                  dorms.map((dorm) => {
                    return (
                      <div key={dorm._id} className="list-item" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px',
                        borderBottom: '1px solid #444',
                        color: 'white'
                      }}>
                        <span>
                          Dorm {dorm.number} in Block {dorm.block?.number || 'Unknown'}
                        </span>
                        <div className="action-buttons" style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={() => handleEditDorm(dorm)}
                            style={{
                              background: '#007bff',
                              color: 'white',
                              border: 'none',
                              padding: '5px 10px',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteDorm(dorm._id)}
                            style={{
                              background: '#dc3545',
                              color: 'white',
                              border: 'none',
                              padding: '5px 10px',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p style={{ color: 'white', textAlign: 'center', padding: '20px' }}>
                    No dorms found.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Approvals Section */}
      {activeTab === 'account-approvals' && (
        <div className="section">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Student Account Approvals</h2>
            <button
              onClick={() => setShowAddStudentForm(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Add New Student
            </button>
          </div>

          {/* Add Student Form Modal */}
          {showAddStudentForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-gray-800 p-6 rounded-lg w-[500px]">
                <h3 className="text-xl font-bold text-white mb-4">Add New Student</h3>
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div>
                    <label className="block text-white mb-1">Student ID</label>
                    <input
                      type="text"
                      value={newStudent.studentId}
                      onChange={(e) => setNewStudent(prev => ({ ...prev, studentId: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-1">Name</label>
                    <input
                      type="text"
                      value={newStudent.name}
                      onChange={(e) => setNewStudent(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-1">Email</label>
                    <input
                      type="email"
                      value={newStudent.email}
                      onChange={(e) => setNewStudent(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-1">College</label>
                    <select
                      value={newStudent.college}
                      onChange={async (e) => {
                        const selectedCollege = e.target.value;
                        setNewStudent(prev => ({ ...prev, college: selectedCollege, department: '' }));
                        if (selectedCollege) {
                          try {
                            // Get departments using the college name directly
                            const response = await fetch(`http://localhost:5000/api/colleges/${encodeURIComponent(selectedCollege)}/departments`, {
                              headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                              }
                            });
                            if (!response.ok) throw new Error('Failed to fetch departments');
                            const data = await response.json();
                            setDepartments(data);
                          } catch (error) {
                            console.error('Error fetching departments:', error);
                            setErrorMessage('Failed to load departments');
                          }
                        } else {
                          setDepartments([]);
                        }
                      }}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                      required
                    >
                      <option value="">Select College</option>
                      {colleges.map((college) => (
                        <option key={college._id} value={college.name}>
                          {college.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-white mb-1">Department</label>
                    <select
                      value={newStudent.department}
                      onChange={(e) => setNewStudent(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                      required
                      disabled={!newStudent.college}
                    >
                      <option value="">Select Department</option>
                      {departments.map((department) => (
                        <option key={department._id} value={department.name}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-white mb-1">Status</label>
                    <select
                      value={newStudent.status}
                      onChange={(e) => setNewStudent(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                      required
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-white mb-1">Registration Date</label>
                    <input
                      type="datetime-local"
                      value={newStudent.registrationDate}
                      onChange={(e) => setNewStudent(prev => ({ ...prev, registrationDate: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div className="admin-student-form-buttons">
                    <button
                      type="submit"
                      className="admin-add-student-btn px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Add Student
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddStudentForm(false);
                        setNewStudent({
                          studentId: '',
                          name: '',
                          email: '',
                          department: '',
                          college: '',
                          status: 'pending',
                          registrationDate: new Date().toISOString().slice(0, 16)
                        });
                        setDepartments([]);
                      }}
                      className="admin-cancel-student-btn px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* CSV Upload Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">Upload Students CSV</h2>
            <form onSubmit={handleCsvUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files[0])}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
              </div>
              {uploadStatus && (
                <p className={`text-sm ${uploadStatus.includes('Successfully') ? 'text-green-600' : 'text-red-600'}`}>
                  {uploadStatus}
                </p>
              )}
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Upload CSV
              </button>
            </form>
          </div>

          {/* Student Approvals Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Student Approvals</h2>

              {/* Search Bar */}
              <div className="mb-4">
                <div className="flex">
                  <input
                    type="text"
                    placeholder="Search by ID, name, email, department, or college..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-grow px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Search
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {filteredApprovals.length} of {studentApprovals.length} students found
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">College</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredApprovals.map((approval) => (
                      <tr key={approval._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {editingStudentId === approval._id ? (
                            <input
                              type="text"
                              value={editingStudentData.studentId}
                              onChange={(e) => setEditingStudentData(prev => ({ ...prev, studentId: e.target.value }))}
                              className="w-full px-2 py-1 border rounded"
                            />
                          ) : (
                            approval.studentId
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {editingStudentId === approval._id ? (
                            <input
                              type="text"
                              value={editingStudentData.name}
                              onChange={(e) => setEditingStudentData(prev => ({ ...prev, name: e.target.value }))}
                              className="w-full px-2 py-1 border rounded"
                            />
                          ) : (
                            approval.name
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {editingStudentId === approval._id ? (
                            <input
                              type="email"
                              value={editingStudentData.email}
                              onChange={(e) => setEditingStudentData(prev => ({ ...prev, email: e.target.value }))}
                              className="w-full px-2 py-1 border rounded"
                            />
                          ) : (
                            approval.email
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {editingStudentId === approval._id ? (
                            <input
                              type="text"
                              value={editingStudentData.department}
                              onChange={(e) => setEditingStudentData(prev => ({ ...prev, department: e.target.value }))}
                              className="w-full px-2 py-1 border rounded"
                            />
                          ) : (
                            approval.department
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {editingStudentId === approval._id ? (
                            <input
                              type="text"
                              value={editingStudentData.college}
                              onChange={(e) => setEditingStudentData(prev => ({ ...prev, college: e.target.value }))}
                              className="w-full px-2 py-1 border rounded"
                            />
                          ) : (
                            approval.college
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {editingStudentId === approval._id ? (
                            <input
                              type="datetime-local"
                              value={editingStudentData.registrationDate}
                              onChange={(e) => setEditingStudentData(prev => ({ ...prev, registrationDate: e.target.value }))}
                              className="w-full px-2 py-1 border rounded"
                            />
                          ) : (
                            new Date(approval.registrationDate).toLocaleString()
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingStudentId === approval._id ? (
                            <select
                              value={editingStudentData.status}
                              onChange={(e) => setEditingStudentData(prev => ({ ...prev, status: e.target.value }))}
                              className="w-full px-2 py-1 border rounded"
                            >
                              <option value="pending">Pending</option>
                              <option value="approved">Approved</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          ) : (
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${approval.status === 'approved' ? 'bg-green-100 text-green-800' :
                                approval.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'}`}>
                              {approval.status}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium w-32">
                          <div className="table-actions">
                            {editingStudentId === approval._id ? (
                              <>
                                <button
                                  onClick={() => handleInlineSave(approval._id)}
                                  className="student-edit-btn"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingStudentId(null);
                                    setEditingStudentData(null);
                                  }}
                                  className="student-delete-btn"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleInlineEdit(approval)}
                                  className="student-edit-btn"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteStudent(approval._id)}
                                  className="student-delete-btn"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Rejection Modal */}
          {selectedStudent && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-gray-800 p-6 rounded-lg w-96">
                <h3 className="text-lg font-bold text-white mb-4">Reject Student</h3>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter rejection reason"
                  className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded mb-4 focus:border-blue-500 focus:outline-none"
                  rows="4"
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setSelectedStudent(null);
                      setRejectionReason('');
                    }}
                    className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleStudentAction(selectedStudent._id, 'rejected')}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Summary Reports Section */}
      {activeTab === 'summary-reports' && (
        <div className="admin-summary-reports-section">
          <div className="admin-summary-reports-header">
            <h2>Summary Reports</h2>
            <div className="admin-filters">
              <div className="admin-role-filter">
                <label htmlFor="roleSelect">Filter by Role:</label>
                <select
                  id="roleSelect"
                  value={selectedRole}
                  onChange={handleRoleChange}
                  className="role-select"
                >
                  <option value="all">All Roles</option>
                  <option value="proctor">Proctors</option>
                  <option value="supervisor">Supervisors</option>
                  <option value="dean">Deans</option>
                </select>
              </div>
              <div className="admin-block-filter">
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
          </div>

          {loadingSummaryReports && <p className="loading">Loading summary reports...</p>}
          {summaryReportsError && <p className="error">Error: {summaryReportsError}</p>}

          <div className="admin-summary-reports-container">
            {filteredReports.length === 0 ? (
              <p>No summary reports found for the selected filters.</p>
            ) : (
              filteredReports.map(report => (
                <div key={report.blockNumber} className="admin-summary-report-card">
                  <div className="report-header">
                    <h3>{selectedBlock === 'all' ? 'Summary Report' : `Report from ${report.name}`}</h3>
                    <p className="role-label">{report.role}</p>
                  </div>
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

                  <div className="charts-container">
                    <div className="chart-wrapper">
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Resolved', value: report.resolvedComplaints },
                              { name: 'Pending', value: report.pendingComplaints }
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            <Cell fill="#4CAF50" />
                            <Cell fill="#FFC107" />
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="chart-wrapper">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={[
                            { name: 'Total', value: report.totalComplaints },
                            { name: 'Resolved', value: report.resolvedComplaints },
                            { name: 'Pending', value: report.pendingComplaints }
                          ]}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="value" fill="#2196F3" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;