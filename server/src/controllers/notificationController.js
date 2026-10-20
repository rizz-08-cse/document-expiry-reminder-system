const Notification = require('../models/Notification');

// List Customer Notifications
const getNotifications = async (req, res) => {
  try {
    const { unreadOnly } = req.query;
    const query = { userId: req.user._id };

    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .populate('documentId', 'title documentType expiryDate');

    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false
    });

    return res.json({
      success: true,
      unreadCount,
      notifications
    });
  } catch (error) {
    console.error('[Notification Controller] getNotifications error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve notifications.'
    });
  }
};

// Mark Single Notification as Read
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.'
      });
    }

    return res.json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('[Notification Controller] markAsRead error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to update notification.'
    });
  }
};

// Mark All Notifications as Read
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });

    return res.json({
      success: true,
      message: 'All notifications marked as read.'
    });
  } catch (error) {
    console.error('[Notification Controller] markAllAsRead error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read.'
    });
  }
};

// Delete Notification
const deleteNotification = async (req, res) => {
  try {
    const deleted = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.'
      });
    }

    return res.json({
      success: true,
      message: 'Notification deleted.'
    });
  } catch (error) {
    console.error('[Notification Controller] deleteNotification error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete notification.'
    });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
};
