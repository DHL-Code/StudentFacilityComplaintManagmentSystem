import React, { useState, useEffect } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/Notification.css';
import SupervisorNotificationBell from '../components/SupervisorNotificationBell';

const NotificationBell = ({ userId }) => {
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
            // Fetch both regular notifications and complaint status updates
            const [notificationsResponse, complaintsResponse] = await Promise.all([
                fetch(`http://localhost:5000/api/notifications`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                }),
                fetch(`http://localhost:5000/api/complaints?userId=${userId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                })
            ]);

            if (!notificationsResponse.ok || !complaintsResponse.ok) {
                throw new Error('Failed to fetch notifications');
            }

            const [notificationsData, complaintsData] = await Promise.all([
                notificationsResponse.json(),
                complaintsResponse.json()
            ]);

            // Convert complaints to notification format and filter out viewed ones and pending complaints
            const complaintNotifications = complaintsData
                .filter(complaint => !complaint.viewedByStudent && complaint.status !== 'pending')
                .map(complaint => ({
                    _id: complaint._id,
                    message: `Complaint: ${complaint.complaintType} - ${complaint.specificInfo} (Status: ${complaint.status || 'Pending'})`,
                    type: 'complaint_status',
                    isRead: false,
                    createdAt: complaint.updatedAt || complaint.createdAt,
                    complaintId: complaint._id
                }));

            // Filter out read notifications
            const unreadNotifications = notificationsData.filter(n => !n.isRead);

            // Combine both types of notifications
            const allNotifications = [...unreadNotifications, ...complaintNotifications];
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
        if (notification.type === 'complaint_status') {
            // Close the notification dropdown
            setIsOpen(false);

            try {
                // Mark the complaint as viewed by student
                const token = localStorage.getItem('token');
                await fetch(`http://localhost:5000/api/complaints/${notification.complaintId}/view-student`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                // Remove the clicked notification from the list
                setNotifications(prevNotifications =>
                    prevNotifications.filter(n => n._id !== notification._id)
                );
                // Update unread count
                setUnreadCount(prev => prev - 1);

                // After profile is loaded, navigate to complaint status
                window.location.href = '/StudentAccount?section=complaintStatus';
            } catch (error) {
                console.error('Error:', error);
                // If there's an error, still navigate but show an error message
                window.location.href = '/StudentAccount?section=complaintStatus';
            }
        } else if (notification.type === 'feedback_submitted') {
            // Close the notification dropdown
            setIsOpen(false);

            try {
                // Mark the notification as read
                await markAsRead(notification._id);

                // Remove the clicked notification from the list
                setNotifications(prevNotifications =>
                    prevNotifications.filter(n => n._id !== notification._id)
                );
                // Update unread count
                setUnreadCount(prev => prev - 1);

                // Navigate to the feedback section
                window.location.href = '/Admin?section=feedback';
            } catch (error) {
                console.error('Error:', error);
                window.location.href = '/Admin?section=feedback';
            }
        } else {
            // For regular notifications
            try {
                // Mark the notification as read in the database
                await markAsRead(notification._id);

                // Remove the clicked notification from the list
                setNotifications(prevNotifications =>
                    prevNotifications.filter(n => n._id !== notification._id)
                );
                // Update unread count
                setUnreadCount(prev => prev - 1);
            } catch (error) {
                console.error('Error marking notification as read:', error);
            }
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            const response = await fetch(
                `http://localhost:5000/api/notifications/${notificationId}/read`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Failed to mark notification as read');
            }

            setNotifications(prev =>
                prev.map(n =>
                    n._id === notificationId ? { ...n, isRead: true } : n
                )
            );
            setUnreadCount(prev => prev - 1);
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    const markAllAsRead = async () => {
        try {
            // Mark all regular notifications as read
            const response = await fetch(
                'http://localhost:5000/api/notifications/read-all',
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Failed to mark all notifications as read');
            }

            // Mark all complaint notifications as viewed by student
            const complaintsToMark = notifications
                .filter(n => n.type === 'complaint_status')
                .map(n => n.complaintId);

            if (complaintsToMark.length > 0) {
                await Promise.all(
                    complaintsToMark.map(complaintId =>
                        fetch(`http://localhost:5000/api/complaints/${complaintId}/view-student`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            },
                        })
                    )
                );
            }

            // Update local state
            setNotifications(prev =>
                prev.map(n => ({ ...n, isRead: true }))
            );
            setUnreadCount(0);
        } catch (err) {
            console.error('Error marking all notifications as read:', err);
        }
    };

    const handleBellClick = () => {
        setIsOpen(!isOpen);
        if (!isOpen && unreadCount > 0) {
            markAllAsRead();
        }
    };

    const getNotificationIcon = () => {
        if (unreadCount > 0) {
            return <BellRing className="notification-bell-icon" />;
        }
        return <Bell className="notification-bell-icon" />;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString();
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
                        <h3>Notifications</h3>
                    </div>
                    {isLoading ? (
                        <div className="notification-loading">Loading...</div>
                    ) : error ? (
                        <div className="notification-error">{error}</div>
                    ) : notifications.length === 0 ? (
                        <div className="notification-empty">No notifications</div>
                    ) : (
                        <div className="notification-list">
                            {notifications.map(notification => (
                                <div
                                    key={notification._id}
                                    className={`notification-item ${notification.isRead ? '' : 'unread'}`}
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

export default NotificationBell;