const Notification = require('../models/Notification');

const createNotification = async ({
  recipientId,
  recipientType,
  senderId,
  senderType,
  type,
  message,
  relatedEntityId
}) => {
  try {
    const notification = new Notification({
      recipientId,
      recipientType,
      senderId,
      senderType,
      type,
      message,
      relatedEntityId,
      isRead: false
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

const getUnreadNotifications = async (userId) => {
  try {
    return await Notification.find({
      recipientId: userId,
      isRead: false
    }).sort({ createdAt: -1 }).limit(20);
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    throw error;
  }
};

const markAsRead = async (notificationId, userId) => {
  try {
    return await Notification.findOneAndUpdate(
      { _id: notificationId, recipientId: userId },
      { $set: { isRead: true } },
      { new: true }
    );
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

const markAllAsRead = async (userId) => {
  try {
    return await Notification.updateMany(
      { recipientId: userId, isRead: false },
      { $set: { isRead: true } }
    );
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

module.exports = {
  createNotification,
  getUnreadNotifications,
  markAsRead,
  markAllAsRead
};