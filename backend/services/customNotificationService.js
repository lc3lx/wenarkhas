const Notification = require('../models/notificationModel');
const { sendPushNotification } = require('./notificationService');

/**
 * إنشاء إشعار مخصص
 * @param {String} userId - معرف المستخدم
 * @param {String} title - عنوان الإشعار
 * @param {String} message - محتوى الإشعار
 * @param {Object} options - خيارات إضافية
 * @returns {Promise<Object>} - الإشعار المنشأ
 */
const createCustomNotification = async (userId, title, message, options = {}) => {
  try {
    // إنشاء الإشعار في قاعدة البيانات
    const notification = await Notification.create({
      user: userId,
      title,
      message,
      type: options.type || 'info',
      relatedEntity: options.relatedEntity,
      actionUrl: options.actionUrl
    });

    // إرسال إشعار دفعي إذا كان مسموحاً
    if (options.sendPush !== false) {
      await sendPushNotification(userId, title, message, {
        ...options.data,
        notificationId: notification._id.toString(),
        type: options.type || 'info',
        actionUrl: options.actionUrl
      });
    }

    // إرسال إشعار في الوقت الفعلي إذا كان المستخدم متصلاً
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
    console.error('خطأ في إنشاء إشعار مخصص:', error);
    throw error;
  }
};

/**
 * إشعار بانخفاض السعر
 * @param {String} userId - معرف المستخدم
 * @param {Object} product - معلومات المنتج
 * @param {Number} oldPrice - السعر القديم
 * @param {Number} newPrice - السعر الجديد
 * @returns {Promise<Object>} - الإشعار المنشأ
 */
const notifyPriceDrop = async (userId, product, oldPrice, newPrice) => {
  const title = 'انخفاض في السعر!';
  const message = `انخفض سعر ${product.title} من ${oldPrice} إلى ${newPrice}`;
  
  return createCustomNotification(userId, title, message, {
    type: 'price_drop',
    relatedEntity: product._id,
    actionUrl: `/products/${product.slug}`,
    data: {
      productId: product._id.toString(),
      oldPrice,
      newPrice
    }
  });
};

/**
 * إشعار بوجود عرض خاص
 * @param {String} userId - معرف المستخدم
 * @param {Object} offer - معلومات العرض
 * @returns {Promise<Object>} - الإشعار المنشأ
 */
const notifySpecialOffer = async (userId, offer) => {
  const title = 'عرض خاص!';
  const message = `خصم ${offer.discount}% على ${offer.title}`;
  
  return createCustomNotification(userId, title, message, {
    type: 'promotion',
    relatedEntity: offer._id,
    actionUrl: `/offers/${offer.slug}`,
    data: {
      offerId: offer._id.toString(),
      discount: offer.discount
    }
  });
};

/**
 * إشعار بتغيير حالة الطلب
 * @param {String} userId - معرف المستخدم
 * @param {Object} order - معلومات الطلب
 * @param {String} status - الحالة الجديدة
 * @returns {Promise<Object>} - الإشعار المنشأ
 */
const notifyOrderStatusUpdate = async (userId, order, status) => {
  const statusMessages = {
    processing: 'جاري معالجة طلبك',
    shipped: 'تم شحن طلبك',
    delivered: 'تم تسليم طلبك',
    cancelled: 'تم إلغاء طلبك'
  };

  const title = 'تحديث حالة الطلب';
  const message = statusMessages[status] || 'تم تحديث حالة طلبك';
  
  return createCustomNotification(userId, title, message, {
    type: 'order_update',
    relatedEntity: order._id,
    actionUrl: `/orders/${order._id}`,
    data: {
      orderId: order._id.toString(),
      status
    }
  });
};

module.exports = {
  createCustomNotification,
  notifyPriceDrop,
  notifySpecialOffer,
  notifyOrderStatusUpdate
};
