import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';
import '../styles/NotificationBell.css';
import { useNavigate } from 'react-router-dom';

const AdminNotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const notificationRef = useRef(null);

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchNotifications = async () => {
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
      
      // Filter feedback that hasn't been viewed by admin
      const unviewedFeedback = data.filter(feedback => !feedback.viewedByAdmin);

      // Format notifications
      const formattedNotifications = unviewedFeedback.map(feedback => ({
        id: feedback._id,
        title: 'New Feedback',
        message: `Rating: ${feedback.rating}/5 - ${feedback.comment.substring(0, 50)}${feedback.comment.length > 50 ? '...' : ''}`,
        date: new Date(feedback.createdAt).toLocaleString(),
        studentId: feedback.userId
      }));

      setNotifications(formattedNotifications);
      setUnreadCount(formattedNotifications.length);
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

  const handleNotificationClick = async (feedbackId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/feedback/${feedbackId}/view`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to mark feedback as viewed');
      }

      // Close the notification dropdown
      setShowNotifications(false);
      
      // Refresh notifications after marking as viewed
      await fetchNotifications();
      
      // Navigate to the Admin page with feedback tab active
      navigate('/Admin', { state: { activeTab: 'feedback' } });
    } catch (error) {
      console.error('Error marking feedback as viewed:', error);
    }
  };

  return (
    <div className="notification-bell-container" ref={notificationRef}>
      <div 
        className="notification-bell" 
        onClick={() => setShowNotifications(!showNotifications)}
      >
        <FontAwesomeIcon icon={faBell} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
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
                className="notification-item"
                onClick={() => handleNotificationClick(notification.id)}
              >
                <div className="notification-title">{notification.title}</div>
                <div className="notification-message">{notification.message}</div>
                <div className="notification-date">{notification.date}</div>
                <div className="notification-student">From: Student {notification.studentId}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AdminNotificationBell; 