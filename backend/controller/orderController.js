const asyncHandler = require('express-async-handler');
const Order = require('../models/orderModel');
const Store = require('../models/storeModel');
const Product = require('../models/productModel');
const DeliveryStaff = require('../models/deliveryStaffModel');
const User = require('../models/userModel');
const ApiError = require('../utils/apiError');
const { createNotification } = require('./notificationController');
const { getNearestDeliveryStaff } = require('../utils/geoUtils');
const { checkOrderUpdatePermission, sendOrderStatusNotification } = require('../middlewares/orderMiddleware');

// @desc    إنشاء طلب جديد
// @route   POST /api/v1/orders
// @access  Private
const createOrder = asyncHandler(async (req, res, next) => {
  const { items, deliveryAddress, paymentMethod, notes } = req.body;
  
  // 1. التحقق من وجود عناصر في الطلب
  if (!items || !Array.isArray(items) || items.length === 0) {
    return next(new ApiError('يجب إضافة عناصر للطلب', 400));
  }
  
  // 2. التحقق من أن جميع العناصر من متجر واحد
  const storeIds = [...new Set(items.map(item => item.store))];
  if (storeIds.length > 1) {
    return next(new ApiError('لا يمكن طلب منتجات من أكثر من متجر في طلب واحد حالياً', 400));
  }
  
  const storeId = storeIds[0];
  const store = await Store.findById(storeId);
  
  if (!store) {
    return next(new ApiError('المتجر غير موجود', 404));
  }
  
  // 3. التحقق من توفر المنتجات وحساب المجموع
  let subtotal = 0;
  const orderItems = [];
  
  for (const item of items) {
    const product = await Product.findById(item.product);
    
    if (!product) {
      return next(new ApiError(`المنتج غير موجود: ${item.product}`, 404));
    }
    
    if (product.quantity < item.quantity) {
      return next(new ApiError(`الكمية المطلوبة غير متوفرة للمنتج: ${product.name}`, 400));
    }
    
    const itemTotal = product.price * item.quantity;
    subtotal += itemTotal;
    
    orderItems.push({
      product: product._id,
      store: store._id,
      quantity: item.quantity,
      price: product.price,
      totalPrice: itemTotal
    });
    
    // تحديث كمية المنتج
    product.quantity -= item.quantity;
    await product.save({ validateBeforeSave: false });
  }
  
  // 4. حساب رسوم التوصيل
  let deliveryFee = 0;
  let deliveryType = 'platform'; // القيمة الافتراضية
  
  // إذا كان المتجر يقدم خدمة التوصيل الخاصة به
  if (store.deliveryOptions && store.deliveryOptions.hasDelivery) {
    // إذا كان التوصيل مجاني أو تجاوز الطلب الحد الأدنى
    if (store.deliveryOptions.isFreeDelivery || 
        (store.deliveryOptions.minOrderForFreeDelivery && 
         subtotal >= store.deliveryOptions.minOrderForFreeDelivery)) {
      deliveryFee = 0;
      deliveryType = 'store';
    } else {
      deliveryFee = store.deliveryOptions.deliveryFee || 0;
      deliveryType = 'store';
    }
  } else {
    // حساب رسوم التوصيل من المنصة
    deliveryFee = 10; // رسوم افتراضية
  }
  
  // 5. إنشاء الطلب
  const order = await Order.create({
    user: req.user._id,
    store: store._id,
    items: orderItems,
    deliveryAddress: deliveryAddress || req.user.defaultAddress,
    deliveryFee,
    subtotal,
    total: subtotal + deliveryFee,
    paymentMethod,
    notes,
    deliveryType
  });
  
  // 6. إذا كان التوصيل من خلال المنصة، قم بتعيين موظف توصيل
  if (deliveryType === 'platform') {
    await assignDeliveryStaff(order._id, deliveryAddress || req.user.defaultAddress);
  } else {
    // إذا كان التوصيل من المتجر، قم بتحديث حالة الطلب مباشرة
    order.status = 'confirmed';
    await order.save();
  }
  
  // 7. إرسال إشعار للمتجر
  await createNotification(
    store.owner,
    'طلب جديد',
    `لديك طلب جديد برقم #${order._id}`,
    {
      type: 'new_order',
      relatedEntity: order._id,
      actionUrl: `/dashboard/orders/${order._id}`
    },
    req.io
  );
  
  res.status(201).json({
    status: 'success',
    data: {
      order
    }
  });
});

// @desc    تعيين موظف توصيل للطلب
// @route   PATCH /api/v1/orders/:id/assign-delivery
// @access  Private/Admin
const assignDeliveryStaff = async (orderId, deliveryAddress) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('الطلب غير موجود');
    }

    // البحث عن أقرب موظف توصيل متاح
    const deliveryStaff = await DeliveryStaff.aggregate([
      {
        $match: { 
          isAvailable: true,
          isActive: true,
          isApproved: true,
          'currentLocation.coordinates': { $exists: true }
        }
      },
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [
              deliveryAddress.coordinates[0],
              deliveryAddress.coordinates[1]
            ]
          },
          distanceField: 'distance',
          maxDistance: 10000, // 10 كم كحد أقصى
          spherical: true
        }
      },
      { $limit: 1 }
    ]);

    if (deliveryStaff.length > 0) {
      const staff = deliveryStaff[0];
      
      // تحديث حالة الموظف
      await DeliveryStaff.findByIdAndUpdate(staff._id, {
        isAvailable: false,
        $push: { assignedOrders: orderId }
      });

      // تحديث الطلب
      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        {
          deliveryStaff: staff._id,
          status: 'assigned',
          estimatedDeliveryTime: new Date(Date.now() + 30 * 60 * 1000) // 30 دقيقة كتقدير مبدئي
        },
        { new: true }
      );

      // إرسال إشعار لموظف التوصيل
      await createNotification(
        staff.user,
        'طلب توصيل جديد',
        `تم تعيين طلب جديد لك #${order._id}`,
        {
          type: 'delivery_assigned',
          relatedEntity: order._id,
          actionUrl: `/delivery/orders/${order._id}`
        },
        global.io
      );

      return updatedOrder;
    }
    return null;
  } catch (error) {
    console.error('Error assigning delivery staff:', error);
    return null;
  }
};

// @desc    الحصول على طلب محدد
// @route   GET /api/v1/orders/:id
// @access  Private
const getOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email phone')
    .populate('store', 'name logo owner')
    .populate('deliveryStaff', 'user')
    .populate('items.product', 'name image');

  if (!order) {
    return next(new ApiError('الطلب غير موجود', 404));
  }

  // التحقق من الصلاحيات
  const isAdmin = req.user.role === 'admin';
  const isStoreOwner = req.user.role === 'store_owner' && 
    order.store.owner.toString() === req.user._id.toString();
  const isDeliveryStaff = req.user.role === 'delivery' && 
    order.deliveryStaff && 
    order.deliveryStaff._id.toString() === req.user.deliveryStaff?._id?.toString();
  const isOrderOwner = order.user._id.toString() === req.user._id.toString();

  if (!isAdmin && !isStoreOwner && !isDeliveryStaff && !isOrderOwner) {
    return next(new ApiError('غير مصرح لك بالوصول إلى هذا الطلب', 403));
  }

  res.status(200).json({
    status: 'success',
    data: {
      order
    }
  });
});

// @desc    تحديث حالة الطلب
// @route   PATCH /api/v1/orders/:id/status
// @access  Private
const updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { status, cancellationReason } = req.body;
  
  // البحث عن الطلب
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email')
    .populate('store', 'name owner')
    .populate('deliveryStaff', 'user');
    
  if (!order) {
    return next(new ApiError('الطلب غير موجود', 404));
  }
  
  // التحقق من الصلاحيات لتحديث الحالة
  checkOrderUpdatePermission(req, res, async () => {
    try {
      // تحديث حالة الطلب
      order.status = status;
      
      if (status === 'cancelled' && cancellationReason) {
        order.cancellationReason = cancellationReason;
      }
      
      if (status === 'delivered') {
        order.deliveredAt = Date.now();
        
        // تحديث حالة موظف التوصيل ليكون متاحاً مرة أخرى
        if (order.deliveryStaff) {
          await DeliveryStaff.findByIdAndUpdate(order.deliveryStaff._id, {
            $inc: { totalDeliveries: 1 },
            isAvailable: true,
            $pull: { assignedOrders: order._id }
          });
        }
      }
      
      await order.save();
      
      // إرسال إشعارات تحديث الحالة
      await sendOrderStatusNotification(order, status, req);
      
      res.status(200).json({
        status: 'success',
        data: {
          order
        }
      });
    } catch (error) {
      next(error);
    }
  });
});

// @desc    الحصول على طلبات المستخدم
// @route   GET /api/v1/orders/my-orders
// @access  Private
const getMyOrders = asyncHandler(async (req, res, next) => {
  const { status, limit = 10, page = 1 } = req.query;
  const skip = (page - 1) * limit;
  
  const query = { user: req.user._id };
  if (status) {
    query.status = status;
  }
  
  const orders = await Order.find(query)
    .sort('-createdAt')
    .skip(skip)
    .limit(parseInt(limit))
    .populate('store', 'name logo')
    .populate('items.product', 'name image');
    
  const total = await Order.countDocuments(query);
  
  res.status(200).json({
    status: 'success',
    results: orders.length,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    },
    data: {
      orders
    }
  });
});

// @desc    الحصول على طلبات المتجر
// @route   GET /api/v1/orders/store-orders
// @access  Private/StoreOwner
const getStoreOrders = asyncHandler(async (req, res, next) => {
  const { status, from, to, limit = 10, page = 1 } = req.query;
  const skip = (page - 1) * limit;
  
  // البحث عن المتجر الخاص بصاحب المتجر
  const store = await Store.findOne({ owner: req.user._id });
  
  if (!store) {
    return next(new ApiError('المتجر غير موجود', 404));
  }
  
  const query = { store: store._id };
  
  if (status) {
    query.status = status;
  }
  
  if (from || to) {
    query.createdAt = {};
    if (from) query.createdAt.$gte = new Date(from);
    if (to) query.createdAt.$lte = new Date(to);
  }
  
  const orders = await Order.find(query)
    .sort('-createdAt')
    .skip(skip)
    .limit(parseInt(limit))
    .populate('user', 'name email phone')
    .populate('deliveryStaff', 'user')
    .populate('items.product', 'name');
    
  const total = await Order.countDocuments(query);
  
  res.status(200).json({
    status: 'success',
    results: orders.length,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    },
    data: {
      orders
    }
  });
});

// @desc    الحصول على طلبات موظف التوصيل
// @route   GET /api/v1/orders/delivery-orders
// @access  Private/Delivery
const getDeliveryOrders = asyncHandler(async (req, res, next) => {
  const { status, limit = 10, page = 1 } = req.query;
  const skip = (page - 1) * limit;
  
  // البحث عن موظف التوصيل المرتبط بالمستخدم
  const deliveryStaff = await DeliveryStaff.findOne({ user: req.user._id });
  
  if (!deliveryStaff) {
    return next(new ApiError('لم يتم العثور على بيانات الموظف', 404));
  }
  
  const query = { deliveryStaff: deliveryStaff._id };
  
  if (status) {
    query.status = status;
  }
  
  const orders = await Order.find(query)
    .sort('-createdAt')
    .skip(skip)
    .limit(parseInt(limit))
    .populate('user', 'name phone')
    .populate('store', 'name logo')
    .populate('items.product', 'name');
    
  const total = await Order.countDocuments(query);
  
  res.status(200).json({
    status: 'success',
    results: orders.length,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    },
    data: {
      orders
    }
  });
});

module.exports = {
  createOrder,
  getOrder,
  updateOrderStatus,
  getMyOrders,
  getStoreOrders,
  getDeliveryOrders,
  assignDeliveryStaff
};
