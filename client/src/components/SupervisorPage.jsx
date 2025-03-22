// SupervisorPage.jsx
import React, { useState } from 'react';
import '../styles/SupervisorStyles.css';

const SupervisorPage = () => {
  const [complaints, setComplaints] = useState([
    { id: 1, title: "Broken AC", category: "Maintenance", 
      status: "Pending", description: "AC not working in Room 101", 
      proctor: "John Smith", escalated: false },
    { id: 2, title: "Leaking Roof", category: "Infrastructure", 
      status: "Under Review", description: "Water leakage in the library", 
      proctor: "Lisa Brown", escalated: false }
  ]);

  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [escalationReason, setEscalationReason] = useState("");
  const [reports] = useState([
    { id: 1, date: "2024-03-20", escalatedCount: 2, resolvedCount: 1 },
    { id: 2, date: "2024-03-21", escalatedCount: 1, resolvedCount: 0 }
  ]);

  const escalateToDean = (complaintId) => {
    if (escalationReason.trim()) {
      setComplaints(complaints.map(comp =>
        comp.id === complaintId ? { 
          ...comp, 
          escalated: true,
          status: "Escalated",
          escalationReason: escalationReason
        } : comp
      ));
      setEscalationReason("");
      setSelectedComplaint(null);
    }
  };

  const resolveComplaint = (complaintId) => {
    setComplaints(complaints.map(comp =>
      comp.id === complaintId ? { 
        ...comp, 
        status: "Resolved",
        escalated: false
      } : comp
    ));
    setSelectedComplaint(null);
  };

  return (
    <div className="supervisor-container">
      <h1>Supervisor Dashboard</h1>

      {/* Complaints Section */}
      <div className="section">
        <h2>Complaint Management</h2>
        <div className="complaints-grid">
          {complaints.map(complaint => (
            <div key={complaint.id} className="complaint-card">
              <div className="complaint-header">
                <h3>{complaint.title}</h3>
                <span className={`status ${complaint.status.toLowerCase().replace(' ', '-')}`}>
                  {complaint.status}
                </span>
              </div>
              <p>Category: {complaint.category}</p>
              <p>Proctor: {complaint.proctor}</p>
              <p>Description: {complaint.description}</p>
              <div className="action-buttons">
                <button onClick={() => setSelectedComplaint(complaint)}>
                  Manage
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reports Section */}
      <div className="section">
        <h2>Escalation Reports</h2>
        <div className="reports-list">
          {reports.map(report => (
            <div key={report.id} className="report-card">
              <h3>Report #{report.id}</h3>
              <p>Date: {report.date}</p>
              <p>Escalated Issues: {report.escalatedCount}</p>
              <p>Resolved Complaints: {report.resolvedCount}</p>
              <button onClick={() => console.log(report)}>
                View Full Details
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Action Modal */}
      {selectedComplaint && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{selectedComplaint.title} Management</h3>
            <p>Submitted by: {selectedComplaint.proctor}</p>
            
            {selectedComplaint.status === "Escalated" ? (
              <div className="modal-section">
                <p><strong>Escalation Reason:</strong> {selectedComplaint.escalationReason}</p>
                <button 
                  className="resolve-btn"
                  onClick={() => resolveComplaint(selectedComplaint.id)}
                >
                  Mark as Resolved
                </button>
              </div>
            ) : (
              <div className="modal-section">
                <textarea
                  placeholder="Reason for escalation..."
                  value={escalationReason}
                  onChange={(e) => setEscalationReason(e.target.value)}
                  rows="4"
                />
                <div className="modal-actions">
                  <button 
                    className="confirm-btn"
                    onClick={() => escalateToDean(selectedComplaint.id)}
                  >
                    Confirm Escalation
                  </button>
                  <button 
                    className="resolve-btn"
                    onClick={() => resolveComplaint(selectedComplaint.id)}
                  >
                    Mark as Resolved
                  </button>
                  <button 
                    className="cancel-btn"
                    onClick={() => setSelectedComplaint(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SupervisorPage;