const Order = require('../models/orderModel');
const { createNotification } = require('../controllers/notificationController');
const ApiError = require('../utils/apiError');

/**
 * Middleware للتحقق من صلاحيات تحديث حالة الطلب
 */
const canUpdateOrderStatus = (user, order, newStatus) => {
  const userRole = user.role;
  const currentStatus = order.status;
  
  // حالات الطلب المسموح بها
  const allowedStatusTransitions = {
    // المسؤول يمكنه تغيير الحالة لأي شيء
    admin: {
      from: '*',
      to: '*'
    },
    // صاحب المتجر يمكنه تغيير الحالة لـ: confirmed, preparing, ready, cancelled
    store_owner: {
      from: ['pending', 'confirmed', 'preparing', 'ready'],
      to: ['confirmed', 'preparing', 'ready', 'cancelled']
    },
    // موظف التوصيل يمكنه تغيير الحالة لـ: on_way, delivered
    delivery: {
      from: ['assigned', 'on_way'],
      to: ['on_way', 'delivered']
    },
    // المستخدم يمكنه إلغاء الطلب إذا كان لم يتم تأكيده بعد
    user: {
      from: ['pending'],
      to: ['cancelled']
    }
  };

  // التحقق من أن المستخدم له دور صالح
  if (!allowedStatusTransitions[userRole]) {
    return false;
  }

  const { from, to } = allowedStatusTransitions[userRole];
  
  // التحقق من أن الحالة الحالية مسموح بها
  const isFromAllowed = from === '*' || from.includes(currentStatus);
  // التحقق من أن الحالة الجديدة مسموح بها
  const isToAllowed = to === '*' || to.includes(newStatus);
  
  // التحقق من أن المستخدم هو صاحب المتجر أو موظف التوصيل المخصص للطلب
  const isOwner = userRole === 'store_owner' && 
    order.store.owner && 
    order.store.owner.toString() === user._id.toString();
    
  const isAssignedDelivery = userRole === 'delivery' && 
    order.deliveryStaff && 
    order.deliveryStaff.toString() === user.deliveryStaff?._id?.toString();
  
  const isOrderOwner = userRole === 'user' && 
    order.user && 
    order.user._id.toString() === user._id.toString();
  
  const hasPermission = isOwner || isAssignedDelivery || isOrderOwner || userRole === 'admin';
  
  return isFromAllowed && isToAllowed && hasPermission;
};

/**
 * Middleware للتحقق من صلاحيات تحديث الطلب
 */
const checkOrderUpdatePermission = (req, res, next) => {
  const { status } = req.body;
  
  if (!status) {
    return next();
  }
  
  Order.findById(req.params.id)
    .populate('store', 'owner')
    .populate('deliveryStaff', 'user')
    .then(order => {
      if (!order) {
        return next(new ApiError('الطلب غير موجود', 404));
      }
      
      if (!canUpdateOrderStatus(req.user, order, status)) {
        return next(new ApiError('غير مصرح لك بتحديث حالة هذا الطلب', 403));
      }
      
      req.order = order;
      next();
    })
    .catch(next);
};

/**
 * Middleware لإرسال إشعارات تحديث حالة الطلب
 */
const sendOrderStatusNotification = async (order, status, req) => {
  try {
    let title = '';
    let message = '';
    let recipientId = null;
    
    // تحديد المستلم والرسالة بناءً على حالة الطلب
    switch (status) {
      case 'confirmed':
        recipientId = order.user;
        title = 'تم تأكيد طلبك';
        message = `تم تأكيد طلبك رقم #${order._id}`;
        break;
        
      case 'preparing':
        recipientId = order.user;
        title = 'جاري تحضير طلبك';
        message = `جاري تحضير طلبك رقم #${order._id}`;
        break;
        
      case 'ready':
        recipientId = order.user;
        title = 'طلبك جاهز للتسليم';
        message = `طلبك رقم #${order._id} جاهز للتسليم`;
        break;
        
      case 'assigned':
        if (order.deliveryStaff) {
          recipientId = order.deliveryStaff.user;
          title = 'تم تعيين طلب توصيل لك';
          message = `تم تعيين طلب رقم #${order._id} لك`;
        }
        break;
        
      case 'on_way':
        recipientId = order.user;
        title = 'موظف التوصيل في طريقه إليك';
        message = `موظف التوصيل في طريقه لتسليم طلبك رقم #${order._iod}`;
        break;
        
      case 'delivered':
        recipientId = order.store.owner;
        title = 'تم تسليم الطلب';
        message = `تم تسليم الطلب رقم #${order._id} بنجاح`;
        
        // إرسال إشعار إضافي للمستخدم
        if (order.user) {
          await createNotification(
            order.user,
            'تم تسليم طلبك',
            `تم تسليم طلبك رقم #${order._id} بنجاح`,
            {
              type: 'order_delivered',
              relatedEntity: order._id,
              actionUrl: `/orders/${order._id}`
            }
          );
        }
        break;
        
      case 'cancelled':
        recipientId = order.user;
        title = 'تم إلغاء الطلب';
        message = `تم إلغاء طلبك رقم #${order._id}`;
        
        if (req.body.cancellationReason) {
          message += `\nالسبب: ${req.body.cancellationReason}`;
        }
        
        // إرسال إشعار إضافي لصاحب المتجر
        if (order.store.owner) {
          await createNotification(
            order.store.owner,
            'تم إلغاء الطلب',
            `تم إلغاء الطلب رقم #${order._id} من قبل ${req.user.name}`,
            {
              type: 'order_cancelled',
              relatedEntity: order._id,
              actionUrl: `/dashboard/orders/${order._id}`
            }
          );
        }
        break;
        
      default:
        return;
    }
    
    // إرسال الإشعار إذا كان هناك مستلم
    if (recipientId) {
      await createNotification(
        recipientId,
        title,
        message,
        {
          type: `order_${status}`,
          relatedEntity: order._id,
          actionUrl: `/orders/${order._id}`
        },
        req.io
      );
    }
  } catch (error) {
    console.error('Error sending order status notification:', error);
  }
};

module.exports = {
  checkOrderUpdatePermission,
  sendOrderStatusNotification,
  canUpdateOrderStatus
};
