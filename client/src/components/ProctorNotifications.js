import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Notification.css';

const ProctorNotifications = () => {
	const [notifications, setNotifications] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);
	const navigate = useNavigate();

	useEffect(() => {
		fetchNotifications();
		// Set up polling for new notifications every 30 seconds
		const interval = setInterval(fetchNotifications, 30000);
		return () => clearInterval(interval);
	}, []);

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

			// Convert complaints to notification format
			const complaintNotifications = complaintsData
				.filter(complaint => complaint.status === 'pending')
				.map(complaint => ({
					_id: complaint._id,
					message: `Pending Complaint: ${complaint.complaintType} - ${complaint.specificInfo}`,
					type: 'pending_complaint',
					isRead: false,
					createdAt: complaint.createdAt,
					complaintId: complaint._id,
					studentName: complaint.studentName,
					roomNumber: complaint.roomNumber,
					priority: complaint.priority
				}));

			setNotifications(complaintNotifications);
		} catch (err) {
			console.error('Error fetching notifications:', err);
			setError(err.message);
		} finally {
			setIsLoading(false);
		}
	};

	const handleNotificationClick = (notification) => {
		if (notification.type === 'pending_complaint') {
			navigate(`/ProctorDashboard?section=complaints&id=${notification.complaintId}`);
		}
	};

	const formatDate = (dateString) => {
		const date = new Date(dateString);
		return date.toLocaleString();
	};

	const getPriorityClass = (priority) => {
		switch (priority) {
			case 'high':
				return 'priority-high';
			case 'medium':
				return 'priority-medium';
			case 'low':
				return 'priority-low';
			default:
				return '';
		}
	};

	return (
		<div className="proctor-notifications-page">
			<div className="notifications-header">
				<h1>Pending Complaints</h1>
				<p>Manage and respond to student complaints</p>
			</div>

			{isLoading ? (
				<div className="notifications-loading">Loading notifications...</div>
			) : error ? (
				<div className="notifications-error">{error}</div>
			) : notifications.length === 0 ? (
				<div className="notifications-empty">
					<h2>No pending complaints</h2>
					<p>All complaints have been addressed</p>
				</div>
			) : (
				<div className="notifications-list">
					{notifications.map(notification => (
						<div
							key={notification._id}
							className={`notification-card ${getPriorityClass(notification.priority)}`}
							onClick={() => handleNotificationClick(notification)}
						>
							<div className="notification-content">
								<h3>{notification.message}</h3>
								<div className="notification-details">
									<p><strong>Student:</strong> {notification.studentName}</p>
									<p><strong>Room:</strong> {notification.roomNumber}</p>
									<p><strong>Priority:</strong> {notification.priority}</p>
								</div>
								<div className="notification-time">
									{formatDate(notification.createdAt)}
								</div>
							</div>
							<div className="notification-actions">
								<button className="view-details-btn">View Details</button>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default ProctorNotifications; 