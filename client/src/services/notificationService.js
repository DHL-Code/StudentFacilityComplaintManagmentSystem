import axios from 'axios';

const API_URL = 'http://localhost:5000/api/notifications';

const getNotifications = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.get(API_URL, config);
  return response.data;
};

const markAsRead = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  await axios.patch(`${API_URL}/mark-read`, {}, config);
};

export default { getNotifications, markAsRead };