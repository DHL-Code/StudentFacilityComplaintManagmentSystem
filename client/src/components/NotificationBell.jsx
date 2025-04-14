import React, { useState, useEffect } from 'react';
import { Bell, BellRing } from 'lucide-react';
import '../styles/Notification.css';

const NotificationBell = ({ userId }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (userId) {
            fetchNotifications();
        }
    }, [userId]);

    const fetchNotifications = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`http://localhost:5000/api/notifications`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch notifications');
            }

            const data = await response.json();
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.isRead).length);
        } catch (err) {
            console.error('Error fetching notifications:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
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

            // Update local state
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
                        {notifications.length > 0 && (
                            <button
                                className="mark-all-read"
                                onClick={markAllAsRead}
                            >
                                Mark all as read
                            </button>
                        )}
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
                                    onClick={() => markAsRead(notification._id)}
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