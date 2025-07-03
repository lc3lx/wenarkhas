const asyncHandler = require('express-async-handler');
const DeliveryStaff = require('../models/deliveryStaffModel');
const User = require('../models/userModel');
const ApiError = require('../utils/apiError');
const { createNotification } = require('./notificationController');

// @desc    إنشاء موظف توصيل جديد
// @route   POST /api/v1/delivery-staff
// @access  Private/Admin
exports.createDeliveryStaff = asyncHandler(async (req, res, next) => {
  const { 
    userId, 
    nationalId, 
    phone, 
    vehicleType, 
    vehicleNumber, 
    bankAccount 
  } = req.body;

  // 1. التحقق من وجود المستخدم
  const user = await User.findById(userId);
  if (!user) {
    return next(new ApiError('المستخدم غير موجود', 404));
  }

  // 2. التحقق من أن المستخدم ليس لديه بالفعل حساب موظف توصيل
  const existingStaff = await DeliveryStaff.findOne({ user: userId });
  if (existingStaff) {
    return next(new ApiError('هذا المستخدم مسجل بالفعل كموظف توصيل', 400));
  }

  // 3. إنشاء موظف التوصيل
  const deliveryStaff = await DeliveryStaff.create({
    user: userId,
    nationalId,
    phone,
    vehicleType,
    vehicleNumber,
    bankAccount,
    isAvailable: true,
    isActive: true,
    isApproved: true // الموافقة المبدئية من قبل المسؤول
  });

  // 4. تحديث دور المستخدم
  user.role = 'delivery';
  await user.save({ validateBeforeSave: false });

  // 5. إرسال إشعار للمستخدم
  await createNotification(
    userId,
    'تمت الموافقة على طلبك كموظف توصيل',
    'مرحباً بك في فريق التوصيل الخاص بنا. يمكنك الآن البدء في استلام الطلبات.',
    {
      type: 'delivery_approved',
      actionUrl: '/delivery/dashboard'
    }
  );

  res.status(201).json({
    status: 'success',
    data: {
      deliveryStaff
    }
  });
});

// @desc    الحصول على قائمة موظفي التوصيل
// @route   GET /api/v1/delivery-staff
// @access  Private/Admin
exports.getAllDeliveryStaff = asyncHandler(async (req, res, next) => {
  const staff = await DeliveryStaff.find({})
    .populate('user', 'name email phone profileImg')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: staff.length,
    data: {
      staff
    }
  });
});

// @desc    الحصول على موظف توصيل محدد
// @route   GET /api/v1/delivery-staff/:id
// @access  Private/Admin
exports.getDeliveryStaff = asyncHandler(async (req, res, next) => {
  const staff = await DeliveryStaff.findById(req.params.id)
    .populate('user', 'name email phone profileImg')
    .populate({
      path: 'orders',
      select: '_id status total deliveryFee createdAt',
      options: { sort: { createdAt: -1 }, limit: 10 }
    });

  if (!staff) {
    return next(new ApiError('موظف التوصيل غير موجود', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      staff
    }
  });
});

// @desc    تحديث حالة توفر موظف التوصيل
// @route   PATCH /api/v1/delivery-staff/availability
// @access  Private/Delivery
exports.updateAvailability = asyncHandler(async (req, res, next) => {
  const { isAvailable, currentLocation } = req.body;
  
  // البحث عن موظف التوصيل المرتبط بالمستخدم الحالي
  const staff = await DeliveryStaff.findOne({ user: req.user._id });
  
  if (!staff) {
    return next(new ApiError('لم يتم العثور على بيانات الموظف', 404));
  }
  
  // تحديث حالة التوفر والموقع
  staff.isAvailable = isAvailable;
  if (currentLocation) {
    staff.currentLocation = {
      type: 'Point',
      coordinates: [currentLocation.longitude, currentLocation.latitude],
      address: currentLocation.address
    };
    staff.lastActive = Date.now();
  }
  
  await staff.save();
  
  res.status(200).json({
    status: 'success',
    data: {
      staff
    }
  });
});

// @desc    تحديث حالة الموافقة على موظف التوصيل
// @route   PATCH /api/v1/delivery-staff/:id/approve
// @access  Private/Admin
exports.approveDeliveryStaff = asyncHandler(async (req, res, next) => {
  const { isApproved, rejectionReason } = req.body;
  
  const staff = await DeliveryStaff.findById(req.params.id).populate('user');
  
  if (!staff) {
    return next(new ApiError('موظف التوصيل غير موجود', 404));
  }
  
  // تحديث حالة الموافقة
  staff.isApproved = isApproved;
  staff.rejectionReason = rejectionReason;
  
  if (isApproved) {
    staff.isActive = true;
  }
  
  await staff.save();
  
  // إرسال إشعار للمستخدم
  const notificationTitle = isApproved 
    ? 'تمت الموافقة على طلبك كموظف توصيل' 
    : 'تم رفض طلبك كموظف توصيل';
    
  const notificationMessage = isApproved
    ? 'مرحباً بك في فريق التوصيل الخاص بنا. يمكنك الآن البدء في استلام الطلبات.'
    : `نعتذر، لا يمكن الموافقة على طلبك حالياً. السبب: ${rejectionReason || 'غير محدد'}`;
  
  await createNotification(
    staff.user._id,
    notificationTitle,
    notificationMessage,
    {
      type: isApproved ? 'delivery_approved' : 'delivery_rejected',
      actionUrl: isApproved ? '/delivery/dashboard' : '/profile'
    }
  );
  
  res.status(200).json({
    status: 'success',
    data: {
      staff
    }
  });
});

// @desc    حذف موظف توصيل
// @route   DELETE /api/v1/delivery-staff/:id
// @access  Private/Admin
exports.deleteDeliveryStaff = asyncHandler(async (req, res, next) => {
  const staff = await DeliveryStaff.findByIdAndDelete(req.params.id);
  
  if (!staff) {
    return next(new ApiError('موظف التوصيل غير موجود', 404));
  }
  
  // تحديث دور المستخدم
  await User.findByIdAndUpdate(staff.user, { role: 'user' });
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});

// @desc    الحصول على إحصائيات موظف التوصيل
// @route   GET /api/v1/delivery-staff/stats/:id
// @access  Private/Delivery/Admin
exports.getDeliveryStats = asyncHandler(async (req, res, next) => {
  const staffId = req.params.id || req.user.deliveryStaff?._id;
  
  if (!staffId) {
    return next(new ApiError('معرف موظف التوصيل مطلوب', 400));
  }
  
  // التحقق من الصلاحيات (يمكن للموظف فقط رؤية إحصائياته)
  if (req.user.role === 'delivery' && staffId !== req.user.deliveryStaff?._id.toString()) {
    return next(new ApiError('غير مصرح لك بالوصول إلى هذه البيانات', 403));
  }
  
  const stats = await DeliveryStaff.aggregate([
    {
      $match: { _id: mongoose.Types.ObjectId(staffId) }
    },
    {
      $lookup: {
        from: 'orders',
        localField: '_id',
        foreignField: 'deliveryStaff',
        as: 'deliveries'
      }
    },
    {
      $project: {
        totalDeliveries: { $size: '$deliveries' },
        completedDeliveries: {
          $size: {
            $filter: {
              input: '$deliveries',
              as: 'delivery',
              cond: { $eq: ['$$delivery.status', 'delivered'] }
            }
          }
        },
        pendingDeliveries: {
          $size: {
            $filter: {
              input: '$deliveries',
              as: 'delivery',
              cond: { $ne: ['$$delivery.status', 'delivered'] }
            }
          }
        },
        totalEarnings: {
          $sum: '$deliveries.deliveryFee'
        },
        averageRating: {
          $avg: '$deliveries.rating'
        }
      }
    }
  ]);
  
  res.status(200).json({
    status: 'success',
    data: {
      stats: stats[0] || {}
    }
  });
});
