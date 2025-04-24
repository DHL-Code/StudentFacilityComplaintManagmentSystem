import React, { useState, useEffect } from 'react';
import NotificationBell from '../components/NotificationBell';
import '../styles/AdminStyles.css';
import { AlertCircle } from 'lucide-react';
import MessagePopup from './MessagePopup';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('account-approvals');
  const [accountRequests, setAccountRequests] = useState([]);
  const [staffAccounts, setStaffAccounts] = useState([]);
  const [adminAccounts, setAdminAccounts] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [reports, setReports] = useState([]);
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
  const [colleges, setColleges] = useState([]);  // To store fetched colleges
  const [collegeErrorMessage, setCollegeErrorMessage] = useState('');
  const [departmentErrorMessage, setDepartmentErrorMessage] = useState('');

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
      const response = await fetch('http://localhost:5000/api/colleges/create-department', {
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
      } else {
        setDepartmentErrorMessage(data.message || 'Failed to create department'); // Changed to data.message
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
    const prefix = prefixMap[role] || 'S';
    const lastId = staffAccounts.reduce((max, acc) => {
      const num = parseInt(acc.id.slice(1)) || 0;
      return num > max ? num : max;
    }, 0);
    return `${prefix}${String(lastId + 1).padStart(3, '0')}`;
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
    setSuccessMessage('');
    setErrorMessage('');
    setValidationErrors({ email: '', phone: '', password: '' });

    // Validate all fields
    const emailError = validationErrors.email;
    const phoneError = validationErrors.phone;
    const passwordError = validationErrors.password;

    if (emailError || phoneError || passwordError) {
      setValidationErrors({
        email: emailError,
        phone: phoneError,
        password: passwordError
      });
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('name', newStaff.name);
    formData.append('email', newStaff.email);
    formData.append('phone', newStaff.phone);
    formData.append('role', newStaff.role);
    formData.append('password', newStaff.password);
    if (newStaff.profilePhoto) {
      formData.append('profilePhoto', newStaff.profilePhoto);
    }
    if (newStaff.role === 'proctor') {
      formData.append('block', newStaff.block || '');
    }

    try {
      const response = await fetch('http://localhost:5000/api/admin/create-staff', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(`Staff account created successfully! Staff ID: ${data.staffId}`);
        setNewStaff({ name: '', email: '', phone: '', role: 'proctor', password: '', profilePhoto: null, block: '' });
        setProfilePreview(null);
      } else {
        setErrorMessage(data.error || 'Failed to create staff account');
      }
    } catch (error) {
      console.error('Error creating staff:', error);
      setErrorMessage('An error occurred while creating the staff account. Please try again.');
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

  return (
    <div className="admin-container">
      <h1 style={{ color: 'white' }}>System Administration Dashboard</h1>

      {/* Message Popups */}
      {successMessage && (
        <MessagePopup
          type="success"
          message={successMessage}
          onClose={handleCloseMessage}
        />
      )}
      {errorMessage && (
        <MessagePopup
          type="error"
          message={errorMessage}
          onClose={handleCloseMessage}
        />
      )}

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
                {currentProfilePhoto ? (
                  <img
                    src={currentProfilePhoto}
                    alt="Profile"
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      marginRight: '20px'
                    }}
                    onError={(e) => {
                      console.error('Failed to load profile photo:', currentProfilePhoto);
                      e.target.style.display = 'none';
                      e.target.parentNode.innerHTML = `
                        <div style="
                          width: 80px; 
                          height: 80px; 
                          border-radius: 50%; 
                          background-color: #4a4a4a; 
                          display: flex; 
                          justify-content: center; 
                          align-items: center;
                          margin-right: 20px;
                          font-size: 32px;
                          color: white;
                        ">
                          ${adminData.name.charAt(0)}
                        </div>
                      `;
                    }}
                  />
                ) : (
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    backgroundColor: '#4a4a4a',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: '20px',
                    fontSize: '32px',
                    color: 'white'
                  }}>
                    {adminData.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 style={{ color: 'white', margin: '0 0 5px 0' }}>{adminData.name}</h3>
                  <p style={{ color: '#aaa', margin: '0 0 5px 0' }}>{adminData.role}</p>
                  <p style={{ color: '#aaa', margin: '0' }}>ID: {adminData.adminId}</p>
                </div>
              </div>

              <div style={{ marginTop: '20px' }}>
                <h4 style={{ color: 'white', marginBottom: '10px' }}>Account Information</h4>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                  paddingBottom: '10px',
                  borderBottom: '1px solid #444'
                }}>
                  <span style={{ color: '#aaa' }}>Email:</span>
                  <span style={{ color: 'white' }}>
                    {adminData.email && adminData.email !== 'Not available' ?
                      adminData.email :
                      <span style={{ color: '#aaa', fontStyle: 'italic' }}>Not available</span>
                    }
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                  paddingBottom: '10px',
                  borderBottom: '1px solid #444'
                }}>
                  <span style={{ color: '#aaa' }}>Phone:</span>
                  <span style={{ color: 'white' }}>
                    {adminData.phone && adminData.phone !== 'Not available' ?
                      adminData.phone :
                      <span style={{ color: '#aaa', fontStyle: 'italic' }}>Not available</span>
                    }
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                  paddingBottom: '10px',
                  borderBottom: '1px solid #444'
                }}>
                  <span style={{ color: '#aaa' }}>Account Created:</span>
                  <span style={{ color: 'white' }}>
                    {new Date(adminData.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {(adminData.email === 'Not available' || adminData.phone === 'Not available') && (
                <div style={{
                  marginTop: '20px',
                  padding: '15px',
                  backgroundColor: '#3a3a3a',
                  borderRadius: '5px',
                  fontSize: '14px',
                  color: '#aaa'
                }}>
                  <p style={{ margin: '0 0 10px 0' }}>
                    <strong>Note:</strong> Some profile information is not available.
                    This information will be updated when you log in again or when the system administrator updates your profile.
                  </p>
                </div>
              )}
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
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setProfilePreview(reader.result);
                    reader.readAsDataURL(file);
                    setNewStaff({ ...newStaff, profilePhoto: file });
                  }
                }}
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
                <input
                  type="text"
                  value={newStaff.block}
                  onChange={e => {
                    const value = e.target.value;
                    // Only allow numbers
                    if (value === '' || /^\d+$/.test(value)) {
                      setNewStaff({ ...newStaff, block: value });
                    }
                  }}
                  placeholder="Enter block number"
                  required
                  pattern="[0-9]*"
                  inputMode="numeric"
                />
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
            <h3 style={{ color: 'white' }}>Create College</h3>
            <form onSubmit={handleCreateCollege} className="college-form">
              <div className="form-group">
                <label style={{ color: 'white' }}>College Name</label>
                <input
                  type="text"
                  value={newCollege.name || ''}
                  onChange={(e) => setNewCollege({ ...newCollege, name: e.target.value })}
                  required
                />
              </div>
              <button
                type="submit"
                style={{ background: 'green', color: 'white' }}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create College'}
              </button>
              {collegeErrorMessage && (
                <div className="error-message" style={{ color: 'red', marginTop: '10px' }}>
                  {collegeErrorMessage}
                </div>
              )}
            </form>

            {/* Display Colleges */}
            <div className="colleges-list">
              <h4 style={{ color: 'white' }}>Existing Colleges</h4>
              {colleges.length > 0 ? (
                <ul>
                  {colleges.map((college) => (
                    <li key={college._id} style={{ color: 'white' }}>
                      {college.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: 'white' }}>No colleges found.</p>
              )}
            </div>
          </div>

          {/* Department Creation Form */}
          <div className="subsection">
            <h3 style={{ color: 'white' }}>Create Department</h3>
            <form onSubmit={handleCreateDepartment} className="department-form">
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
              <button
                type="submit"
                style={{ background: 'green', color: 'white' }}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Department'}
              </button>
              {departmentErrorMessage && (
                <div className="error-message" style={{ color: 'red', marginTop: '10px' }}>
                  {departmentErrorMessage}
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Feedback Section */}
      {activeTab === 'feedback' && (
        <div className="section">
          <h2 style={{ color: 'white' }}>Student Feedback</h2>

          {feedbackLoading ? (
            <p style={{ color: 'white' }}>Loading feedback data...</p>
          ) : feedbackError ? (
            <p style={{ color: 'red' }}>{feedbackError}</p>
          ) : feedback.length === 0 ? (
            <p style={{ color: 'white' }}>No feedback available.</p>
          ) : (
            <div className="feedback-container">
              {feedback.map((item) => (
                <div key={item._id} className="feedback-card">
                  <div className="feedback-header">
                    <div className="rating">
                      {[...Array(5)].map((_, index) => (
                        <span
                          key={index}
                          className={`star ${index < item.rating ? 'filled' : 'empty'}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <div className="feedback-date">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="feedback-content">
                    <p>{item.comment}</p>
                  </div>
                  <div className="feedback-footer">
                    <span>User ID: {item.userId}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPage;