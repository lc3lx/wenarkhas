const asyncHandler = require('express-async-handler');
const { 
  addOrUpdateFcmToken, 
  removeFcmToken 
} = require('../services/notificationService');

// @desc    إضافة أو تحديث رمز FCM
// @route   POST /api/v1/fcm/token
// @access  Private
exports.addFcmToken = asyncHandler(async (req, res, next) => {
  const { token, device, os } = req.body;
  
  if (!token) {
    return next(new Error('الرجاء إدخال رمز FCM'));
  }

  const result = await addOrUpdateFcmToken(
    req.user._id,
    token,
    { device, os }
  );

  res.status(200).json({
    status: 'success',
    data: result
  });
});

// @desc    إزالة رمز FCM
// @route   DELETE /api/v1/fcm/token
// @access  Private
exports.removeFcmToken = asyncHandler(async (req, res, next) => {
  const { token } = req.body;
  
  if (!token) {
    return next(new Error('الرجاء إدخال رمز FCM'));
  }

  const result = await removeFcmToken(req.user._id, token);

  res.status(200).json({
    status: 'success',
    data: result
  });
});

// @desc    تحديث إعدادات الإشعارات
// @route   PATCH /api/v1/notifications/settings
// @access  Private
exports.updateNotificationSettings = asyncHandler(async (req, res, next) => {
  const { settings } = req.body;
  
  if (!settings || typeof settings !== 'object') {
    return next(new Error('إعدادات غير صالحة'));
  }

  const user = await req.user.updateOne(
    {},
    { 
      $set: { 
        'notificationSettings': {
          ...req.user.notificationSettings.toObject(),
          ...settings
        }
      } 
    },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    status: 'success',
    data: user.notificationSettings
  });
});
