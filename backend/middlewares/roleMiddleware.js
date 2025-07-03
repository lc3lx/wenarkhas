const ApiError = require('../utils/apiError');

// Middleware للتحقق من أن المستخدم لديه دور معين
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError('غير مصرح لك بالوصول إلى هذا المسار', 403)
      );
    }
    next();
  };
};

// Middleware للتحقق من أن المستخدم هو صاحب المتجر أو مدير
const isStoreOwnerOrAdmin = (req, res, next) => {
  if (req.user.role === 'admin') {
    return next();
  }
  
  if (req.user.role === 'store_owner' && req.params.id === req.user._id.toString()) {
    return next();
  }
  
  return next(new ApiError('غير مصرح لك بالوصول إلى هذا المورد', 403));
};

// Middleware للتحقق من أن المستخدم هو موظف التوصيل المسؤول عن الطلب
const isAssignedDelivery = async (req, res, next) => {
  try {
    const order = await req.model.findById(req.params.id)
      .populate('deliveryStaff', 'user');
      
    if (!order) {
      return next(new ApiError('الطلب غير موجود', 404));
    }
    
    if (req.user.role === 'admin') {
      return next();
    }
    
    if (req.user.role === 'delivery' && 
        order.deliveryStaff && 
        order.deliveryStaff.user.toString() === req.user._id.toString()) {
      return next();
    }
    
    return next(new ApiError('غير مصرح لك بالوصول إلى هذا الطلب', 403));
  } catch (error) {
    next(error);
  }
};

// Middleware للتحقق من أن المستخدم هو صاحب الطلب
const isOrderOwner = async (req, res, next) => {
  try {
    const order = await req.model.findById(req.params.id);
    
    if (!order) {
      return next(new ApiError('الطلب غير موجود', 404));
    }
    
    if (req.user.role === 'admin') {
      return next();
    }
    
    if (order.user && order.user.toString() === req.user._id.toString()) {
      return next();
    }
    
    return next(new ApiError('غير مصرح لك بالوصول إلى هذا الطلب', 403));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  restrictTo,
  isStoreOwnerOrAdmin,
  isAssignedDelivery,
  isOrderOwner
};
