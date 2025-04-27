import React, { useState, useEffect } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/Notification.css';

const AdminNotificationBell = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (userId) {
      fetchNotifications();
      // Set up polling for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Fetch both feedback and student approval notifications
      const [feedbackResponse, approvalsResponse] = await Promise.all([
        fetch('http://localhost:5000/api/feedback/unread', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }),
        fetch('http://localhost:5000/api/student-approvals/pending', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
      ]);

      if (!feedbackResponse.ok || !approvalsResponse.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const [feedbackData, approvalsData] = await Promise.all([
        feedbackResponse.json(),
        approvalsResponse.json()
      ]);

      // Format feedback notifications
      const feedbackNotifications = feedbackData.map(feedback => ({
        _id: feedback._id,
        message: `New Feedback: ${feedback.title || 'Untitled Feedback'}`,
        type: 'feedback_submitted',
        isRead: false,
        createdAt: feedback.createdAt,
        relatedEntityId: feedback._id
      }));

      // Format approval notifications
      const approvalNotifications = approvalsData.map(approval => ({
        _id: approval._id,
        message: `New Student Approval Request: ${approval.fullName} (${approval.studentId})`,
        type: 'student_approval',
        isRead: false,
        createdAt: approval.createdAt,
        relatedEntityId: approval.studentId
      }));

      // Combine all notifications
      const allNotifications = [...feedbackNotifications, ...approvalNotifications];
      
      // Sort by creation date (newest first)
      allNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setNotifications(allNotifications);
      setUnreadCount(allNotifications.length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification || !notification._id) {
      console.error('Invalid notification object');
      return;
    }

    // Close the notification dropdown
    setIsOpen(false);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Mark notification as read based on type
      if (notification.type === 'feedback_submitted') {
        await fetch(`http://localhost:5000/api/feedback/${notification.relatedEntityId}/read`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }

      // Update notifications list
      setNotifications(prev => prev.filter(n => n._id !== notification._id));
      setUnreadCount(prev => prev - 1);

      // Navigate based on notification type
      if (notification.type === 'feedback_submitted') {
        navigate('/Admin', {
          state: {
            section: 'feedback',
            selectedFeedbackId: notification.relatedEntityId
          }
        });
      } else if (notification.type === 'student_approval') {
        navigate('/Admin', {
          state: {
            section: 'studentApprovals',
            selectedStudentId: notification.relatedEntityId
          }
        });
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
      // Still navigate even if there's an error
      if (notification.type === 'feedback_submitted') {
        navigate('/Admin', { state: { section: 'feedback' } });
      } else if (notification.type === 'student_approval') {
        navigate('/Admin', { state: { section: 'studentApprovals' } });
      }
    }
  };

  const handleBellClick = () => {
    setIsOpen(!isOpen);
  };

  const getNotificationIcon = () => {
    if (unreadCount > 0) {
      return <BellRing className="notification-bell-icon" />;
    }
    return <Bell className="notification-bell-icon" />;
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  return (
    <div className="notification-container">
      <div className="notification-bell" onClick={handleBellClick}>
        {getNotificationIcon()}
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </div>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Admin Notifications</h3>
          </div>

          {isLoading ? (
            <div className="notification-loading">Loading...</div>
          ) : error ? (
            <div className="notification-error">{error}</div>
          ) : notifications.length === 0 ? (
            <div className="notification-empty">No new notifications</div>
          ) : (
            <div className="notification-list">
              {notifications.map(notification => (
                <div
                  key={notification._id}
                  className="notification-item"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-message">{notification.message}</div>
                  <div className="notification-time">{formatDate(notification.createdAt)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminNotificationBell; 