// DeanPage.jsx
import React, { useState, useEffect } from 'react';
import '../styles/DeanStyles.css';

const DeanPage = () => { 
  const [activeTab, setActiveTab] = useState('complaints');
  const [deanData, setDeanData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentProfilePhoto, setCurrentProfilePhoto] = useState(null);
  const [complaints, setComplaints] = useState([
    { id: 1, title: "Broken AC", category: "Maintenance", 
      status: "Pending", description: "AC not working in Room 101" },
    { id: 2, title: "Leaking Roof", category: "Infrastructure", 
      status: "Verified", description: "Water leakage in the library" }
  ]);

  useEffect(() => {
    const fetchDeanData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const userData = JSON.parse(localStorage.getItem('user'));

        if (!token || !userData) {
          throw new Error('Authentication required');
        }

        const response = await fetch(`http://localhost:5000/api/admin/staff/${userData.userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch dean data');
        }

        const data = await response.json();
        
        // Set the profile photo URL if available
        if (data.profilePhoto) {
          setCurrentProfilePhoto(`http://localhost:5000/${data.profilePhoto}`);
        }
        
        const processedData = {
          name: data.name || 'Not available',
          staffId: data.staffId || 'Not available',
          email: data.email || 'Not available',
          role: data.role || 'Not available',
          phone: data.phone || 'Not available',
          createdAt: data.createdAt || new Date().toISOString()
        };

        setDeanData(processedData);
      } catch (err) {
        console.error('Error fetching dean data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDeanData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // Complaint Functions
  const verifyComplaint = (complaintId) => {
    setComplaints(complaints.map(comp =>
      comp.id === complaintId ? { ...comp, status: "Verified" } : comp
    ));
  };

  const resolveComplaint = (complaintId) => {
    setComplaints(complaints.map(comp =>
      comp.id === complaintId ? { ...comp, status: "Resolved" } : comp
    ));
  };

  const removeComplaint = (complaintId) => {
    setComplaints(complaints.filter(comp => comp.id !== complaintId));
  };

  const removeAllComplaints = () => {
    if (window.confirm('Are you sure you want to remove all complaints?')) {
      setComplaints([]);
    }
  };

  return (
    <div className="dean-container">
      <h1>Dean's Dashboard</h1>
      <nav className="dean-nav">
        <button 
          className={`nav-btn ${activeTab === 'complaints' ? 'active' : ''}`}
          onClick={() => setActiveTab('complaints')}
        >
          Manage Complaints
        </button>
        <button 
          className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </nav>

      {activeTab === 'complaints' && (
        <div className="section">
          <h2>Complaints Management</h2>
          <button 
            className="remove-all-btn"
            onClick={removeAllComplaints}
            disabled={complaints.length === 0}
          >
            Remove All Complaints ({complaints.length})
          </button>
          <div className="complaints-list">
            {complaints.map(complaint => (
              <div key={complaint.id} className="complaint-card">
                <div className="complaint-header">
                  <h3>{complaint.title}</h3>
                  <span className={`status ${complaint.status.toLowerCase()}`}>
                    {complaint.status}
                  </span>
                </div>
                <p>{complaint.description}</p>
                <div className="action-buttons">
                  <button 
                    className="remove-btn"
                    onClick={() => removeComplaint(complaint.id)}
                  >
                    Remove
                  </button>
                  {complaint.status === "Pending" && (
                    <button
                      className="verify-btn"
                      onClick={() => verifyComplaint(complaint.id)}
                    >
                      Verify
                    </button>
                  )}
                  {complaint.status === "Verified" && (
                    <button
                      className="resolve-btn"
                      onClick={() => resolveComplaint(complaint.id)}
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="section">
          <h2>View Profile</h2>
          {loading && <p className="student-loading">Loading profile...</p>}
          {error && <p className="student-error">Error: {error}</p>}
          
          <div className="student-profile-container">
            {deanData && (
              <>
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
                  <h3 className="full-name">{deanData.name}</h3>
                  <p className="user-id">{deanData.staffId}</p>
                </div>
                <div className="student-profile-details">
                  <div className="student-detail-item">
                    <span className="student-detail-label">Email:</span>
                    <span className="student-detail-value">{deanData.email}</span>
                  </div>
                  <div className="student-detail-item">
                    <span className="student-detail-label">Phone:</span>
                    <span className="student-detail-value">{deanData.phone}</span>
                  </div>
                  <div className="student-detail-item">
                    <span className="student-detail-label">Role:</span>
                    <span className="student-detail-value">{deanData.role}</span>
                  </div>
                  <div className="student-detail-item">
                    <span className="student-detail-label">Member Since:</span>
                    <span className="student-detail-value">
                      {new Date(deanData.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeanPage;