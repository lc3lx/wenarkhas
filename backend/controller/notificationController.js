const asyncHandler = require('express-async-handler');
const Notification = require('../models/notificationModel');
const User = require('../models/userModel');
const factory = require('./handlersFactory');

// @desc    احصل على جميع إشعارات المستخدم
// @route   GET /api/v1/notifications
// @access  Private
exports.getUserNotifications = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    Notification.find({ user: req.user._id })
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    Notification.countDocuments({ user: req.user._id })
  ]);

  res.status(200).json({
    status: 'success',
    results: notifications.length,
    total,
    totalPages: Math.ceil(total / limit),
    data: notifications
  });
});

// @desc    تحديث حالة الإشعار كمقروء
// @route   PATCH /api/v1/notifications/:id/read
// @access  Private
exports.markAsRead = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { read: true },
    { new: true, runValidators: true }
  );

  if (!notification) {
    return next(new Error('لم يتم العثور على الإشعار'), 404);
  }

  res.status(200).json({
    status: 'success',
    data: notification
  });
});

// @desc    حذف إشعار
// @route   DELETE /api/v1/notifications/:id
// @access  Private
exports.deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id
  });

  if (!notification) {
    return next(new Error('لم يتم العثور على الإشعار'), 404);
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// @desc    تحديد جميع الإشعارات كمقروءة
// @route   PATCH /api/v1/notifications/mark-all-read
// @access  Private
exports.markAllAsRead = asyncHandler(async (req, res, next) => {
  await Notification.updateMany(
    { user: req.user._id, read: false },
    { $set: { read: true } }
  );

  res.status(200).json({
    status: 'success',
    message: 'تم تحديد جميع الإشعارات كمقروءة'
  });
});

// @desc    الحصول على عدد الإشعارات غير المقروءة
// @route   GET /api/v1/notifications/unread-count
// @access  Private
exports.getUnreadCount = asyncHandler(async (req, res, next) => {
  const count = await Notification.countDocuments({
    user: req.user._id,
    read: false
  });

  res.status(200).json({
    status: 'success',
    data: { count }
  });
});

// دالة مساعدة لإنشاء إشعار
// يمكن استدعاؤها من أي مكان في التطبيق
// مثال: await createNotification(userId, 'عنوان', 'رسالة', { type: 'info' });
exports.createNotification = async (userId, title, message, options = {}) => {
  try {
    const notification = await Notification.create({
      user: userId,
      title,
      message,
      type: options.type || 'info',
      relatedEntity: options.relatedEntity,
      actionUrl: options.actionUrl
    });

    // إرسال الإشعار في الوقت الفعلي إذا كان المستخدم متصلاً
    if (global.io && global.connectedUsers && global.connectedUsers[userId]) {
      global.io.to(global.connectedUsers[userId]).emit('newNotification', {
        title,
        message,
        type: options.type || 'info',
        notification
      });
    }

    return notification;
  } catch (error) {
    console.error('خطأ في إنشاء الإشعار:', error);
    return null;
  }
};
