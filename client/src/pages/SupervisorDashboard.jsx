import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const SupervisorDashboard = () => {
	const [profile, setProfile] = useState(null);
	const [complaints, setComplaints] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [activeSection, setActiveSection] = useState('complaints');
	const [selectedComplaintId, setSelectedComplaintId] = useState(null);
	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		const fetchProfile = async () => {
			try {
				const token = localStorage.getItem('token');
				const response = await fetch('http://localhost:5000/api/supervisors/profile', {
					headers: {
						'Authorization': `Bearer ${token}`,
					},
				});

				if (!response.ok) {
					throw new Error('Failed to fetch profile');
				}

				const data = await response.json();
				setProfile(data);
			} catch (error) {
				console.error('Error fetching profile:', error);
				setError('Failed to load profile');
			}
		};

		fetchProfile();
	}, []);

	useEffect(() => {
		// Check for navigation state
		if (location.state) {
			if (location.state.section) {
				setActiveSection(location.state.section);
			}
			if (location.state.selectedComplaintId) {
				setSelectedComplaintId(location.state.selectedComplaintId);
			}
		}
	}, [location]);

	useEffect(() => {
		const fetchComplaints = async () => {
			try {
				setLoading(true);
				const token = localStorage.getItem('token');
				const response = await fetch('http://localhost:5000/api/complaints/verified', {
					headers: {
						'Authorization': `Bearer ${token}`,
					},
				});

				if (!response.ok) {
					throw new Error('Failed to fetch complaints');
				}

				const data = await response.json();
				setComplaints(data);
			} catch (error) {
				console.error('Error fetching complaints:', error);
				setError('Failed to load complaints');
			} finally {
				setLoading(false);
			}
		};

		if (activeSection === 'complaints') {
			fetchComplaints();
		}
	}, [activeSection]);

	return (
		<div>
			{/* Render your component content here */}
		</div>
	);
};

export default SupervisorDashboard; 