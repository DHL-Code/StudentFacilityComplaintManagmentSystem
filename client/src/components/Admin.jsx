import React, { useState, useEffect } from 'react';
import NotificationBell from '../components/NotificationBell';
import '../styles/AdminStyles.css';
import { AlertCircle } from 'lucide-react';
import MessagePopup from './MessagePopup';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
    block: ''
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

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

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
    }
  }, [activeTab]);

  const fetchFeedback = async () => {
    setFeedbackLoading(true);
    setFeedbackError('');
    try {
      const response = await fetch('http://localhost:5000/api/feedback');
      if (!response.ok) {
        throw new Error('Failed to fetch feedback');
      }
      const data = await response.json();
      setFeedback(data);
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
      supervisor: 'S',
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
          return;
        }
        formData.append('block', selectedBlock.number);
      }

      if (newStaff.profilePhoto) {
        formData.append('profilePhoto', newStaff.profilePhoto);
      }

      const response = await fetch('http://localhost:5000/api/adminStaff/create-staff', {
        method: 'POST',
        body: formData
      });

      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create staff account');
      }

      const data = await response.json();
      setSuccessMessage(data.message);

      // Update staffAccounts with the new staff member
      setStaffAccounts(prev => [...prev, data.staff]);

      // Refresh blocks list
      const token = localStorage.getItem('token');
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

      // Reset form while preserving the role and blocks state
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

      // Force a re-render of the form
      setActiveTab(prev => prev);
    } catch (error) {
      setErrorMessage(error.message);
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create block');
      }

      const data = await response.json();
      setBlocks([...blocks, data]);
      setNewBlock({ number: '' });
      setSuccessMessage('Block created successfully');
    } catch (error) {
      setBlockErrorMessage(error.message);
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create dorm');
      }

      const data = await response.json();
      setDorms([...dorms, data]);
      setNewDorm({ number: '', block: '' });
      setSuccessMessage('Dorm created successfully');
    } catch (error) {
      setDormErrorMessage(error.message);
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

    if (!newStaff.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!newStaff.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(newStaff.email)) {
      errors.email = 'Email is invalid';
    }

    if (!newStaff.phone.trim()) {
      errors.phone = 'Phone is required';
    }

    if (!newStaff.role) {
      errors.role = 'Role is required';
    }

    if (!newStaff.password) {
      errors.password = 'Password is required';
    } else if (newStaff.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (newStaff.role === 'proctor' && !newStaff.block) {
      errors.block = 'Block is required for proctors';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Fetch student approvals
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
        setStudentApprovals(data);
      } catch (error) {
        console.error('Error fetching student approvals:', error);
      }
    };

    if (activeTab === 'account-approvals') {
      fetchStudentApprovals();
    }
  }, [activeTab]);

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

  // Handle student deletion
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

      // Refresh student approvals list
      const approvalsResponse = await fetch('http://localhost:5000/api/student-approvals', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const approvalsData = await approvalsResponse.json();
      setStudentApprovals(approvalsData);
    } catch (error) {
      console.error('Error deleting student approval:', error);
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

  // Add search functionality
  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchQuery.toLowerCase().trim();
    
    if (!query) {
      setSearchResults([]);
      return;
    }

    const results = studentApprovals.filter(student => 
      student.studentId.toLowerCase().includes(query) ||
      student.name.toLowerCase().includes(query) ||
      student.email.toLowerCase().includes(query) ||
      student.department.toLowerCase().includes(query) ||
      student.college.toLowerCase().includes(query)
    );
    
    setSearchResults(results);
  };

  // Update handleCreateStudent to check for uniqueness
  const handleCreateStudent = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      // Check if studentId or email already exists
      const existingStudent = studentApprovals.find(
        student => student.studentId === newStudent.studentId || student.email === newStudent.email
      );

      if (existingStudent) {
        throw new Error(
          existingStudent.studentId === newStudent.studentId
            ? 'Student ID already exists'
            : 'Email already exists'
        );
      }

      // Format the date to be compatible with datetime-local input
      const formattedDate = new Date(newStudent.registrationDate).toISOString().slice(0, 16);

      const response = await fetch('http://localhost:5000/api/student-approvals', {
        method: 'POST',
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
        setStudentApprovals(approvalsData);
      } else {
        setErrorMessage(data.message || 'Failed to create student approval request');
      }
    } catch (error) {
      console.error('Error creating student approval:', error);
      setErrorMessage(error.message || 'An error occurred while creating the student approval request');
    } finally {
      setLoading(false);
    }
  };

  // Update handleUpdateStudent to check for uniqueness
  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      // Check if studentId or email already exists in other students
      const existingStudent = studentApprovals.find(
        student => 
          (student.studentId === newStudent.studentId || student.email === newStudent.email) &&
          student._id !== editingStudent._id
      );

      if (existingStudent) {
        throw new Error(
          existingStudent.studentId === newStudent.studentId
            ? 'Student ID already exists'
            : 'Email already exists'
        );
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

  const handleEditStudent = (student) => {
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
    setShowAddStudentForm(true);
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

  return (
    <div className="admin-container">
      <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: 'white' }}>System Administration Dashboard</h1>
        <button
          onClick={handleLogout}
          style={{
            background: '#dc3545',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '20px'
          }}
        >
          Logout
        </button>
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
        <button onClick={() => setActiveTab('reports')}>
          Generate Reports
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
        {/* Add NotificationBell */}
        <NotificationBell userId={adminData?.adminId} />
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
                    <button
                      onClick={() => document.getElementById('profilePhotoInput').click()}
                      style={{
                        position: 'absolute',
                        bottom: '10px',
                        right: '10px',
                        background: '#4a4a4a',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '30px',
                        height: '30px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <span style={{ fontSize: '20px' }}>+</span>
                    </button>
                    <input
                      type="file"
                      id="profilePhotoInput"
                      accept="image/*"
                      onChange={handleProfilePhotoChange}
                      style={{ display: 'none' }}
                    />
                  </div>
                  <div>
                    <h3 style={{ color: 'white', margin: '0 0 5px 0' }}>{adminData.name}</h3>
                    <p style={{ color: '#aaa', margin: '0 0 5px 0' }}>{adminData.role}</p>
                    <p style={{ color: '#aaa', margin: '0' }}>ID: {adminData.adminId}</p>
                  </div>
                </div>

                <div style={{ marginTop: '20px' }}>
                  <h4 style={{ color: 'white', marginBottom: '10px' }}>Account Information</h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '20px'
                  }}>
                    <div style={{
                      backgroundColor: '#3a3a3a',
                      padding: '15px',
                      borderRadius: '8px'
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
                        <input
                          type="text"
                          value={adminData.name}
                          onChange={(e) => setAdminData({ ...adminData, name: e.target.value })}
                          style={{
                            background: 'transparent',
                            border: '1px solid #444',
                            color: 'white',
                            padding: '5px',
                            borderRadius: '4px'
                          }}
                        />
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '10px',
                        paddingBottom: '10px',
                        borderBottom: '1px solid #444'
                      }}>
                        <span style={{ color: '#aaa' }}>Email:</span>
                        <input
                          type="email"
                          value={adminData.email}
                          onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                          style={{
                            background: 'transparent',
                            border: '1px solid #444',
                            color: 'white',
                            padding: '5px',
                            borderRadius: '4px'
                          }}
                        />
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '10px',
                        paddingBottom: '10px',
                        borderBottom: '1px solid #444'
                      }}>
                        <span style={{ color: '#aaa' }}>Phone:</span>
                        <input
                          type="tel"
                          value={adminData.phone}
                          onChange={(e) => setAdminData({ ...adminData, phone: e.target.value })}
                          style={{
                            background: 'transparent',
                            border: '1px solid #444',
                            color: 'white',
                            padding: '5px',
                            borderRadius: '4px'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{
                      backgroundColor: '#3a3a3a',
                      padding: '15px',
                      borderRadius: '8px'
                    }}>
                      <h5 style={{ color: '#aaa', margin: '0 0 10px 0' }}>Account Security</h5>
                      <form onSubmit={handlePasswordChange}>
                        <div style={{
                          marginBottom: '10px',
                          paddingBottom: '10px',
                          borderBottom: '1px solid #444'
                        }}>
                          <label style={{ color: '#aaa', display: 'block', marginBottom: '5px' }}>Current Password</label>
                          <input
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                            style={{
                              width: '100%',
                              background: 'transparent',
                              border: '1px solid #444',
                              color: 'white',
                              padding: '5px',
                              borderRadius: '4px'
                            }}
                          />
                        </div>
                        <div style={{
                          marginBottom: '10px',
                          paddingBottom: '10px',
                          borderBottom: '1px solid #444'
                        }}>
                          <label style={{ color: '#aaa', display: 'block', marginBottom: '5px' }}>New Password</label>
                          <input
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            style={{
                              width: '100%',
                              background: 'transparent',
                              border: '1px solid #444',
                              color: 'white',
                              padding: '5px',
                              borderRadius: '4px'
                            }}
                          />
                        </div>
                        <div style={{
                          marginBottom: '10px'
                        }}>
                          <label style={{ color: '#aaa', display: 'block', marginBottom: '5px' }}>Confirm New Password</label>
                          <input
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            style={{
                              width: '100%',
                              background: 'transparent',
                              border: '1px solid #444',
                              color: 'white',
                              padding: '5px',
                              borderRadius: '4px'
                            }}
                          />
                        </div>
                        <button
                          type="submit"
                          style={{
                            width: '100%',
                            background: '#4a4a4a',
                            color: 'white',
                            border: 'none',
                            padding: '10px',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Change Password
                        </button>
                      </form>
                    </div>
                  </div>

                  <div style={{
                    marginTop: '20px',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '10px'
                  }}>
                    <button
                      onClick={handleSaveProfile}
                      style={{
                        background: '#4a4a4a',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Save Changes
                    </button>
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
          <form onSubmit={handleCreateStaff} className="staff-form">
            <div className="photo-upload">
              <div className="profile-preview" onClick={() => document.getElementById('staffPhoto').click()}>
                {profilePreview ? (
                  <img src={profilePreview} alt="Preview" />
                ) : (
                  <div className="upload-placeholder" style={{ color: 'white' }}>
                    <span>+</span>
                    <p>Upload Photo</p>
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

            <div className="form-group">
              <label style={{ color: 'white' }}>Full Name</label>
              <input
                type="text"
                value={newStaff.name}
                onChange={e => setNewStaff({ ...newStaff, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label style={{ color: 'white' }}>Email</label>
              <input
                type="email"
                value={newStaff.email}
                onChange={e => setNewStaff({ ...newStaff, email: e.target.value })}
                onBlur={handleEmailBlur}
                className={validationErrors.email ? 'error' : ''}
                placeholder="Enter email"
              />
              {validationErrors.email && (
                <span className="error-message">{validationErrors.email}</span>
              )}
            </div>

            <div className="form-group">
              <label style={{ color: 'white' }}>Phone Number</label>
              <input
                type="tel"
                value={newStaff.phone}
                onChange={e => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setNewStaff({ ...newStaff, phone: value });
                }}
                onBlur={handlePhoneBlur}
                className={validationErrors.phone ? 'error' : ''}
                maxLength="10"
                pattern="[0-9]*"
                inputMode="numeric"
                placeholder="Enter phone number"
              />
              {validationErrors.phone && (
                <span className="error-message">{validationErrors.phone}</span>
              )}
            </div>

            <div className="form-group">
              <label style={{ color: 'white' }}>Password</label>
              <input
                type="password"
                value={newStaff.password}
                onChange={e => setNewStaff({ ...newStaff, password: e.target.value })}
                onBlur={handlePasswordBlur}
                className={validationErrors.password ? 'error' : ''}
                placeholder="Enter password"
              />
              {validationErrors.password && (
                <span className="error-message">{validationErrors.password}</span>
              )}
            </div>

            <div className="form-group">
              <label style={{ color: 'white' }}>Role</label>
              <select
                value={newStaff.role}
                onChange={e => setNewStaff({ ...newStaff, role: e.target.value })}
              >
                <option value="proctor">Proctor</option>
                <option value="supervisor">Supervisor</option>
                <option value="dean">Student Dean</option>
              </select>
            </div>

            {newStaff.role === 'proctor' && (
              <div className="form-group">
                <label style={{ color: 'white' }}>Block</label>
                <select
                  value={newStaff.block}
                  onChange={e => setNewStaff(prev => ({ ...prev, block: e.target.value }))}
                  required
                >
                  <option value="">Select Block</option>
                  {blocks.map((block) => (
                    <option key={block._id} value={block._id}>
                      Block {block.number}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              style={{ background: 'blue', color: 'white' }}
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

      {/* Reports Section */}
      {activeTab === 'reports' && (
        <div className="section">
          <h2 style={{ color: 'white' }}>Generate Reports</h2>

          <div className="report-controls" style={{ marginBottom: '20px' }}>
            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label style={{ color: 'white', marginRight: '10px' }}>Report Type:</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                style={{ padding: '8px', borderRadius: '4px' }}
              >
                <option value="proctor">Proctor Performance</option>
                <option value="supervisor">Supervisor Performance</option>
                <option value="dean">Dean Performance</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label style={{ color: 'white', marginRight: '10px' }}>Time Period:</label>
              <select
                value={timePeriod}
                onChange={(e) => setTimePeriod(e.target.value)}
                style={{ padding: '8px', borderRadius: '4px' }}
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>

            <button
              onClick={handleGenerateReport}
              disabled={reportLoading}
              style={{
                background: '#4a4a4a',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {reportLoading ? 'Generating Report...' : 'Generate Report'}
            </button>
          </div>

          {reportError && (
            <div style={{ color: 'red', marginBottom: '15px' }}>
              {reportError}
            </div>
          )}

          {reportData && renderReport()}
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
                  dorms.map((dorm) => (
                    <div key={dorm._id} className="list-item" style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px',
                      borderBottom: '1px solid #444',
                      color: 'white'
                    }}>
                      <span>
                        Dorm {dorm.number} in Block {blocks.find(b => b._id === dorm.block)?.number}
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
                  ))
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

          {/* Search Form */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <form onSubmit={handleSearch} className="flex gap-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ID, name, email, department, or college..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Clear
                </button>
              )}
            </form>
          </div>

          {/* Student Approvals Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {searchResults.length > 0 ? 'Search Results' : 'Student Approvals'}
              </h2>
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
                    {(searchResults.length > 0 ? searchResults : studentApprovals).map((approval) => (
                      <tr key={approval._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{approval.studentId}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{approval.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{approval.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{approval.department}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{approval.college}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(approval.registrationDate).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${approval.status === 'approved' ? 'bg-green-100 text-green-800' : 
                              approval.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                              'bg-yellow-100 text-yellow-800'}`}>
                            {approval.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium w-32">
                          <div className="flex flex-row items-center gap-1.5">
                            <button
                              onClick={() => handleEditStudent(approval)}
                              className="inline-flex items-center text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-1.5 py-0.5 rounded text-xs hover:bg-indigo-100 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(approval._id)}
                              className="inline-flex items-center text-red-600 hover:text-red-900 bg-red-50 px-1.5 py-0.5 rounded text-xs hover:bg-red-100 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
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
    </div>
  );
};

export default AdminPage;