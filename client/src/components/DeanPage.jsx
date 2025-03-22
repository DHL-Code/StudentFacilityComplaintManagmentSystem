// DeanPage.jsx
import React, { useState } from 'react';
import '../styles/DeanStyles.css';

const DeanPage = () => { 
	
  const [activeTab, setActiveTab] = useState('complaints');
  const [complaints, setComplaints] = useState([
    { id: 1, title: "Broken AC", category: "Maintenance", 
      status: "Pending", description: "AC not working in Room 101", 
      feedback: "Please fix ASAP!", feedbackStatus: "pending" },
    { id: 2, title: "Leaking Roof", category: "Infrastructure", 
      status: "Verified", description: "Water leakage in the library", 
      feedback: "This is urgent!", feedbackStatus: "pending" }
  ]);

  const [reports, setReports] = useState([]);
  const [responseText, setResponseText] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // Complaint Management Functions
  const verifyComplaint = (complaintId) => {
    setComplaints(complaints.map(comp =>
      comp.id === complaintId ? { ...comp, status: "Verified" } : comp
    ));
  };

  const approveComplaint = (complaintId) => {
    setComplaints(complaints.map(comp =>
      comp.id === complaintId ? { ...comp, status: "Approved" } : comp
    ));
  };

  const rejectComplaint = (complaintId) => {
    setComplaints(complaints.map(comp =>
      comp.id === complaintId ? { ...comp, status: "Rejected" } : comp
    ));
  };

  // Report Functions
  const generateReport = () => {
    const newReport = {
      id: reports.length + 1,
      date: new Date().toLocaleDateString(),
      summary: `Total Complaints: ${complaints.length}`,
      details: complaints
    };
    setReports([...reports, newReport]);
  };

  // Feedback Functions
  const respondToFeedback = (complaintId) => {
    if (responseText.trim()) {
      setComplaints(complaints.map(comp => 
        comp.id === complaintId ? { 
          ...comp, 
          feedbackResponse: responseText,
          feedbackStatus: "responded"
        } : comp
      ));
      setResponseText("");
      setSelectedComplaint(null);
    }
  };

  return (
	
    <div className="dean-container">
		<h1> Welcome Dear Student Dean </h1>
      <nav className="dean-nav">
        <button 
          className={`nav-btn ${activeTab === 'complaints' ? 'active' : ''}`}
          onClick={() => setActiveTab('complaints')}
        >
          Manage Complaints
        </button>
        <button 
          className={`nav-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          Reports
        </button>
        <button 
          className={`nav-btn ${activeTab === 'feedback' ? 'active' : ''}`}
          onClick={() => setActiveTab('feedback')}
        >
          Respond to Feedback
        </button>
      </nav>

      {/* Complaints Management Tab */}
      {activeTab === 'complaints' && (
        <div className="section">
          <h2>Complaints Management</h2>
          <div className="complaints-list">
            {complaints.map(complaint => (
              <div key={complaint.id} className="complaint-card">
                <div className="complaint-header">
                  <h3>{complaint.title}</h3>
                  <span className={`status ${complaint.status.toLowerCase()}`}>
                    {complaint.status}
                  </span>
                </div>
                <p>Category: {complaint.category}</p>
                <p>Description: {complaint.description}</p>
                <div className="action-buttons">
                  {complaint.status === "Pending" && (
                    <>
                      <button onClick={() => verifyComplaint(complaint.id)}>
                        Verify
                      </button>
                      <button onClick={() => approveComplaint(complaint.id)}>
                        Approve
                      </button>
                      <button onClick={() => rejectComplaint(complaint.id)}>
                        Reject
                      </button>
                    </>
                  )}
                  <button onClick={() => {
                    setSelectedComplaint(complaint);
                    setActiveTab('feedback');
                  }}>
                    View Feedback
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="section">
          <h2>Reports Management</h2>
          <button className="generate-btn" onClick={generateReport}>
            Generate New Report
          </button>
          <div className="reports-grid">
            {reports.map(report => (
              <div key={report.id} className="report-card">
                <h3>Report #{report.id}</h3>
                <p>Generated: {report.date}</p>
                <p>Summary: {report.summary}</p>
                <button onClick={() => console.log(report.details)}>
                  View Full Details
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feedback Tab */}
      {activeTab === 'feedback' && (
        <div className="section">
          <h2>Feedback Management</h2>
          <div className="feedback-list">
            {complaints.filter(c => c.feedback).map(complaint => (
              <div key={complaint.id} className="feedback-card">
                <div className="feedback-header">
                  <h3>{complaint.title}</h3>
                  <span className={`status ${complaint.feedbackStatus}`}>
                    {complaint.feedbackStatus.toUpperCase()}
                  </span>
                </div>
                <p><strong>Student Feedback:</strong> {complaint.feedback}</p>
                
                {complaint.feedbackStatus === 'pending' ? (
                  <>
                    <textarea
                      placeholder="Type your response here..."
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                    />
                    <div className="feedback-actions">
                      <button 
                        className="respond-btn"
                        onClick={() => respondToFeedback(complaint.id)}
                      >
                        Submit Response
                      </button>
                      <button
                        className="cancel-btn"
                        onClick={() => setActiveTab('complaints')}
                      >
                        Back to Complaints
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="response-section">
                    <p><strong>Dean's Response:</strong> {complaint.feedbackResponse}</p>
                    <button 
                      className="edit-response-btn"
                      onClick={() => {
                        setResponseText(complaint.feedbackResponse || "");
                        setSelectedComplaint(complaint);
                      }}
                    >
                      Edit Response
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeanPage;