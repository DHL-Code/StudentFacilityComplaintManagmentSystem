import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFlag } from '@fortawesome/free-solid-svg-icons';
import '../styles/ProctorDashboard.css';

function ProctorDashboard() {
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="logo">DashboardX</div>
        <div className="header-right">
          <button className="notifications-btn">Notifications</button>
          <span className="proctor-name">Proctor Name</span>
        </div>
      </header>

      <div className="complaints-section">
        <h2>Pending Complaints</h2>
        <div className="complaints-grid">
          <div className="complaint-card">
            <h3>Complaint #1</h3>
            <p>Description of the pending complaint...</p>
            <div className="card-actions">
              <button className="verify-btn">Verify</button>
              <button className="dismiss-btn">Dismiss</button>
            </div>
          </div>
          <div className="complaint-card">
            <h3>Complaint #2</h3>
            <p>Description of the pending complaint...</p>
            <div className="card-actions">
              <button className="verify-btn">Verify</button>
              <button className="dismiss-btn">Dismiss</button>
            </div>
          </div>
          <div className="complaint-card">
            <h3>Complaint #3</h3>
            <p>Description of the pending complaint...</p>
            <div className="card-actions">
              <button className="verify-btn">Verify</button>
              <button className="dismiss-btn">Dismiss</button>
            </div>
          </div>
        </div>
      </div>

      <div className="complaints-section">
        <h2>Verified Complaints</h2>
        <div className="complaints-grid">
          <div className="complaint-card">
            <h3>Complaint #4</h3>
            <p>Description of the verified complaint...</p>
          </div>
          <div className="complaint-card">
            <h3>Complaint #5</h3>
            <p>Description of the verified complaint...</p>
          </div>
          <div className="complaint-card">
            <h3>Complaint #6</h3>
            <p>Description of the verified complaint...</p>
          </div>
        </div>
      </div>

      <div className="complaints-section">
        <h2>Urgent Complaints</h2>
        <div className="complaints-grid">
          <div className="complaint-card">
            <h3>Complaint #7</h3>
            <p>Description of the urgent complaint...</p>
            <button className="flag-btn"><FontAwesomeIcon icon={faFlag} /> Flag</button>
          </div>
          <div className="complaint-card">
            <h3>Complaint #8</h3>
            <p>Description of the urgent complaint...</p>
            <button className="flag-btn"><FontAwesomeIcon icon={faFlag} /> Flag</button>
          </div>
        </div>
      </div>

      <footer className="dashboard-footer">
        <div className="footer-links">
          <span>Help Center</span>
          <span>Contact Support</span>
          <span>Terms & Conditions</span>
        </div>
        <div className="copyright">© 2025 DashboardX</div>
      </footer>
    </div>
  );
}

export default ProctorDashboard;