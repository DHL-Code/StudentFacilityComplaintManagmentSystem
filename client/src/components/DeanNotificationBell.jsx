import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';
import '../styles/NotificationBell.css';
import { useNavigate } from 'react-router-dom';

const DeanNotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/complaints/escalated', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch escalated complaints');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch complaints');
      }

      // Filter complaints that haven't been viewed by dean
      const unviewedComplaints = data.data.filter(complaint => !complaint.viewedByDean);

      // Format notifications
      const formattedNotifications = unviewedComplaints.map(complaint => ({
        id: complaint._id,
        title: 'New Escalated Complaint',
        message: `${complaint.complaintType} - ${complaint.specificInfo}`,
        date: new Date(complaint.escalatedAt).toLocaleString(),
        isUrgent: complaint.isUrgent
      }));

      setNotifications(formattedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Set up polling every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = async (complaintId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/complaints/escalated/${complaintId}/view`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to mark complaint as viewed');
      }

      // Close the notification dropdown
      setShowNotifications(false);
      
      // Refresh notifications after marking as viewed
      await fetchNotifications();
      
      // Navigate to the complaints section
      navigate('/dean/complaints');
    } catch (error) {
      console.error('Error marking complaint as viewed:', error);
    }
  };

  return (
    <div className="notification-bell-container">
      <div 
        className="notification-bell" 
        onClick={() => setShowNotifications(!showNotifications)}
      >
        <FontAwesomeIcon icon={faBell} />
        {notifications.length > 0 && (
          <span className="notification-badge">{notifications.length}</span>
        )}
      </div>

      {showNotifications && (
        <div className="notification-dropdown">
          {loading ? (
            <div className="notification-item">Loading...</div>
          ) : error ? (
            <div className="notification-item error">{error}</div>
          ) : notifications.length === 0 ? (
            <div className="notification-item">No new notifications</div>
          ) : (
            notifications.map(notification => (
              <div 
                key={notification.id} 
                className={`notification-item ${notification.isUrgent ? 'urgent' : ''}`}
                onClick={() => handleNotificationClick(notification.id)}
              >
                <div className="notification-title">{notification.title}</div>
                <div className="notification-message">{notification.message}</div>
                <div className="notification-date">{notification.date}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default DeanNotificationBell; 