import React, { useState, useEffect } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/Notification.css';

const SupervisorNotificationBell = ({ userId }) => {
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
			const response = await fetch('http://localhost:5000/api/complaints', {
				headers: {
					'Authorization': `Bearer ${localStorage.getItem('token')}`,
				},
			});

			if (!response.ok) {
				throw new Error('Failed to fetch complaints');
			}

			const complaintsData = await response.json();

			// Convert complaints to notification format, only showing verified complaints
			const verifiedComplaints = complaintsData
				.filter(complaint => complaint.status === 'verified' && !complaint.viewedBySupervisor)
				.map(complaint => ({
					_id: complaint._id,
					message: `Verified Complaint: ${complaint.complaintType} - ${complaint.specificInfo}`,
					type: 'verified_complaint',
					isRead: false,
					createdAt: complaint.createdAt,
					complaintId: complaint._id,
					studentName: complaint.studentName,
					roomNumber: complaint.roomNumber,
					priority: complaint.priority,
					blockNumber: complaint.blockNumber
				}));

			setNotifications(verifiedComplaints);
			setUnreadCount(verifiedComplaints.length);
		} catch (err) {
			console.error('Error fetching notifications:', err);
			setError(err.message);
		} finally {
			setIsLoading(false);
		}
	};

	const handleNotificationClick = async (notification) => {
		if (notification.type === 'verified_complaint') {
			// Close the notification dropdown
			setIsOpen(false);

			try {
				// Mark the complaint as viewed by supervisor
				const token = localStorage.getItem('token');
				await fetch(`http://localhost:5000/api/complaints/${notification.complaintId}/view-supervisor`, {
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${token}`,
					},
				});

				// Update the notification count
				setUnreadCount(prev => prev - 1);
				setNotifications(prev => prev.filter(n => n._id !== notification._id));

				// Navigate to the complaints section with the specific complaint ID
				navigate('/SupervisorDashboard', {
					state: {
						section: 'notifications',
						complaintId: notification.complaintId
					}
				});
			} catch (error) {
				console.error('Error handling notification click:', error);
				// Still navigate even if there's an error
				navigate('/SupervisorDashboard', {
					state: {
						section: 'notifications',
						complaintId: notification.complaintId
					}
				});
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
						<h3>Verified Complaints</h3>
					</div>

					{isLoading ? (
						<div className="notification-loading">Loading...</div>
					) : error ? (
						<div className="notification-error">{error}</div>
					) : notifications.length === 0 ? (
						<div className="notification-empty">No verified complaints</div>
					) : (
						<div className="notification-list">
							{notifications.map(notification => (
								<div
									key={notification._id}
									className="notification-item"
									onClick={() => handleNotificationClick(notification)}
								>
									<div className="notification-message">
										<strong>Block {notification.blockNumber}</strong> - {notification.message}
									</div>
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

export default SupervisorNotificationBell; 