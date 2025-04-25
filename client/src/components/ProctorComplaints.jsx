const fetchComplaints = async () => {
	setIsLoading(true);
	setError(null);
	try {
		// Get proctor data first to get the block number
		const userData = JSON.parse(localStorage.getItem('user'));
		if (!userData?.userId) {
			throw new Error('User data not found');
		}

		const proctorResponse = await fetch(`http://localhost:5000/api/admin/staff/${userData.userId}`, {
			headers: {
				'Authorization': `Bearer ${localStorage.getItem('token')}`,
			},
		});

		if (!proctorResponse.ok) {
			throw new Error('Failed to fetch proctor data');
		}

		const proctorData = await proctorResponse.json();

		// Only fetch complaints if block is assigned
		if (!proctorData.block) {
			setComplaints([]);
			return;
		}

		const response = await fetch(`http://localhost:5000/api/complaints?blockNumber=${proctorData.block}`, {
			headers: {
				'Authorization': `Bearer ${localStorage.getItem('token')}`,
			},
		});

		if (!response.ok) {
			throw new Error('Failed to fetch complaints');
		}

		const data = await response.json();
		setComplaints(data);
	} catch (err) {
		console.error('Error fetching complaints:', err);
		setError(err.message);
	} finally {
		setIsLoading(false);
	}
}; 