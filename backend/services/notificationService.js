const admin = require('firebase-admin');
const User = require('../models/userModel');

// تهيئة Firebase Admin SDK
// تأكد من إضافة ملف serviceAccountKey.json إلى مجلد config
const serviceAccount = require('../config/firebase-service-account.json');

// تهيئة Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

/**
 * إرسال إشعار دفعي
 * @param {String} userId - معرف المستخدم
 * @param {String} title - عنوان الإشعار
 * @param {String} body - نص الإشعار
 * @param {Object} data - بيانات إضافية
 * @returns {Promise<Object>} - نتيجة الإرسال
 */
exports.sendPushNotification = async (userId, title, body, data = {}) => {
  try {
    // البحث عن المستخدم وجلب رموز FCM الخاصة به
    const user = await User.findById(userId).select('fcmTokens notificationSettings');
    
    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
      console.log('لا توجد أجهزة مسجلة لهذا المستخدم');
      return { success: false, message: 'No devices registered for this user' };
    }

    // الحصول على الرموز النشطة فقط
    const registrationTokens = user.fcmTokens.map(tokenObj => tokenObj.token);

    // إعداد رسالة الإشعار
    const message = {
      notification: {
        title,
        body
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        sound: 'default',
        priority: 'high'
      },
      tokens: registrationTokens
    };

    // إرسال الإشعار
    const response = await admin.messaging().sendMulticast(message);
    
    // تحديث تاريخ آخر استخدام للرموز الناجحة
    if (response.responses && response.responses.length > 0) {
      const updatedTokens = [];
      response.responses.forEach((resp, index) => {
        if (resp.success) {
          updatedTokens.push({
            ...user.fcmTokens[index].toObject(),
            lastUsed: new Date()
          });
        }
      });
      
      if (updatedTokens.length > 0) {
        await User.findByIdAndUpdate(userId, { fcmTokens: updatedTokens });
      }
    }

    return {
      success: true,
      response
    };
  } catch (error) {
    console.error('خطأ في إرسال الإشعار الدفعي:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * إضافة أو تحديث رمز FCM للمستخدم
 * @param {String} userId - معرف المستخدم
 * @param {String} fcmToken - رمز FCM
 * @param {Object} deviceInfo - معلومات الجهاز
 * @returns {Promise<Object>} - نتيجة العملية
 */
exports.addOrUpdateFcmToken = async (userId, fcmToken, deviceInfo = {}) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // التحقق مما إذا كان الرمز موجوداً بالفعل
    const existingTokenIndex = user.fcmTokens.findIndex(
      tokenObj => tokenObj.token === fcmToken
    );

    if (existingTokenIndex >= 0) {
      // تحديث الرمز الموجود
      user.fcmTokens[existingTokenIndex] = {
        ...user.fcmTokens[existingTokenIndex].toObject(),
        ...deviceInfo,
        lastUsed: new Date()
      };
    } else {
      // إضافة رمز جديد
      user.fcmTokens.push({
        token: fcmToken,
        device: deviceInfo.device || 'Unknown',
        os: deviceInfo.os || 'Unknown',
        lastUsed: new Date()
      });
    }

    await user.save();
    return { success: true, message: 'FCM token updated successfully' };
  } catch (error) {
    console.error('Error updating FCM token:', error);
    return { success: false, error: error.message };
  }
};

/**
 * إزالة رمز FCM
 * @param {String} userId - معرف المستخدم
 * @param {String} fcmToken - رمز FCM
 * @returns {Promise<Object>} - نتيجة العملية
 */
exports.removeFcmToken = async (userId, fcmToken) => {
  try {
    const result = await User.updateOne(
      { _id: userId },
      { $pull: { fcmTokens: { token: fcmToken } } }
    );
    
    return {
      success: true,
      message: 'FCM token removed successfully',
      result
    };
  } catch (error) {
    console.error('Error removing FCM token:', error);
    return { success: false, error: error.message };
  }
};
