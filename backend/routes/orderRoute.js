const express = require('express');
const {
  createOrder,
  getOrder,
  updateOrderStatus,
  getMyOrders,
  getStoreOrders,
  getDeliveryOrders,
  assignDeliveryStaff
} = require('../controllers/orderController');
const { protect } = require('../controller/authController');
const { 
  restrictTo, 
  isStoreOwnerOrAdmin, 
  isAssignedDelivery, 
  isOrderOwner 
} = require('../middlewares/roleMiddleware');

const router = express.Router();

// حماية جميع المسارات
router.use(protect);

// مسارات الطلبات للمستخدمين العاديين
router.route('/')
  .post(restrictTo('user'), createOrder);

router.route('/my-orders')
  .get(restrictTo('user'), getMyOrders);

router.route('/:id')
  .get(restrictTo('user', 'store_owner', 'delivery', 'admin'), getOrder);

// مسارات الطلبات لأصحاب المتاجر
router.route('/store-orders')
  .get(restrictTo('store_owner', 'admin'), getStoreOrders);

router.route('/:id/status')
  .patch(restrictTo('store_owner', 'delivery', 'admin'), updateOrderStatus);

// مسارات الطلبات لموظفي التوصيل
router.route('/delivery-orders')
  .get(restrictTo('delivery', 'admin'), getDeliveryOrders);

// مسار إدارة تعيين موظفي التوصيل (للمشرفين فقط)
router.route('/:id/assign-delivery')
  .patch(restrictTo('admin'), assignDeliveryStaff);

// Middleware لربط الطلب مع الطرق التي تحتاج إليه
router.param('id', (req, res, next, val) => {
  req.model = require('../models/orderModel');
  next();
});

module.exports = router;
