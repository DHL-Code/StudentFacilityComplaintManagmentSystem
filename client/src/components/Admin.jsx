import React, { useState, useEffect } from 'react';
import '../styles/AdminStyles.css';
import { AlertCircle } from 'lucide-react';
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
    profilePhoto: null
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

    // Validate password length
    if (newStaff.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
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

    try {
      const response = await fetch('http://localhost:5000/api/admin/create-staff', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(`Staff account created successfully! Staff ID: ${data.staffId}`);
        setNewStaff({ name: '', email: '', phone: '', role: 'proctor', password: '', profilePhoto: null });
        setProfilePreview(null);
      } else {
        setErrorMessage(data.message || 'Failed to create staff account'); // Changed to data.message
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

  return (
    <div className="admin-container">
      <h1 style={{ color: 'white' }}>System Administration Dashboard</h1>

      <nav className="admin-nav">
        <button onClick={() => setActiveTab('account-approvals')}>
          Student Approvals ({accountRequests.length})
        </button>
        <button onClick={() => setActiveTab('create-staff')}>
          Create Staff
        </button>
        <button onClick={() => setActiveTab('create-admin')}>
          Create Admin
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
      </nav>


      {/* Error and Success Messages */}
      {errorMessage && (
        <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '10px', margin: '10px 0', border: '1px solid #f5c6cb', borderRadius: '4px' }}>
          <AlertCircle className="h-4 w-4" style={{ marginRight: '8px', display: 'inline-block', verticalAlign: 'middle' }} />
          <strong style={{ marginRight: '8px' }}>Error:</strong>
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '10px', margin: '10px 0', border: '1px solid #c3e6cb', borderRadius: '4px' }}>
          <AlertCircle className="h-4 w-4" style={{ marginRight: '8px', display: 'inline-block', verticalAlign: 'middle' }} />
          <strong style={{ marginRight: '8px' }}>Success:</strong>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Profile Section */}
      {activeTab === 'profile' && (
        <div className="section">
          <h2 style={{ color: 'white' }}>Admin Profile Settings</h2>
          <form onSubmit={handlePasswordChange} className="profile-form">
            <div className="form-group">
              <label style={{ color: 'white' }}>Current Password</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label style={{ color: 'white' }}>New Password</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label style={{ color: 'white' }}>Confirm New Password</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                required
              />
            </div>

            {profileError && <p style={{ color: 'red' }}>{profileError}</p>}

            <button type="submit" style={{ background: 'blue', color: 'white' }}>
              Change Password
            </button>
          </form>
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
                required
              />
            </div>

            <div className="form-group">
              <label style={{ color: 'white' }}>Phone Number</label>
              <input
                type="tel"
                value={newStaff.phone}
                onChange={e => setNewStaff({ ...newStaff, phone: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label style={{ color: 'white' }}>Password</label>
              <input
                type="password"
                value={newStaff.password}
                onChange={e => setNewStaff({ ...newStaff, password: e.target.value })}
                required
                minLength={6}
              />
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

      {/* Create Admin Section */}
      {activeTab === 'create-admin' && (
        <div className="section">
          <h2 style={{ color: 'white' }}>Create Admin Account</h2>
          <form onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            setSuccessMessage('');
            setErrorMessage('');

            // Validate password length
            if (newAdmin.password.length < 6) {
              setErrorMessage('Password must be at least 6 characters long');
              setLoading(false);
              return;
            }

            const formData = new FormData();
            formData.append('name', newAdmin.name);
            formData.append('email', newAdmin.email);
            formData.append('phone', newAdmin.phone);
            formData.append('password', newAdmin.password);
            if (newAdmin.profilePhoto) {
              formData.append('profilePhoto', newAdmin.profilePhoto);
            }

            try {
              const response = await fetch('http://localhost:5000/api/admin/create-admin', {
                method: 'POST',
                body: formData,
              });

              const data = await response.json();

              if (response.ok) {
                setSuccessMessage(`Admin account created successfully! Admin ID: ${data.adminId}`);
                setNewAdmin({ name: '', email: '', phone: '', password: '', profilePhoto: null });
                setProfilePreview(null);
                // Update admin accounts list
                setAdminAccounts([...adminAccounts, { id: data.adminId, ...newAdmin }]);
              } else {
                setErrorMessage(data.error || 'Failed to create admin account');
              }
            } catch (error) {
              console.error('Error creating admin:', error);
              setErrorMessage('An error occurred while creating the admin account. Please try again.');
            } finally {
              setLoading(false);
            }
          }} className="admin-form">
            <div className="photo-upload">
              <div className="profile-preview" onClick={() => document.getElementById('adminPhoto').click()}>
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
                id="adminPhoto"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setProfilePreview(reader.result);
                    reader.readAsDataURL(file);
                    setNewAdmin({ ...newAdmin, profilePhoto: file });
                  }
                }}
                hidden
              />
            </div>

            <div className="form-group">
              <label style={{ color: 'white' }}>Full Name</label>
              <input
                type="text"
                value={newAdmin.name}
                onChange={e => setNewAdmin({ ...newAdmin, name: e.target.value })}
                required
                placeholder="Enter full name"
              />
            </div>

            <div className="form-group">
              <label style={{ color: 'white' }}>Email</label>
              <input
                type="email"
                value={newAdmin.email}
                onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })}
                required
                placeholder="Enter email address"
              />
            </div>

            <div className="form-group">
              <label style={{ color: 'white' }}>Phone Number</label>
              <input
                type="tel"
                value={newAdmin.phone}
                onChange={e => setNewAdmin({ ...newAdmin, phone: e.target.value })}
                required
                placeholder="Enter phone number"
              />
            </div>

            <div className="form-group">
              <label style={{ color: 'white' }}>Password</label>
              <input
                type="password"
                value={newAdmin.password}
                onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })}
                required
                minLength={6}
                placeholder="Enter password (min 6 characters)"
              />
            </div>

            <button
              type="submit"
              style={{ background: 'blue', color: 'white' }}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Admin Account'}
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
    </div>
  );
};

export default AdminPage;