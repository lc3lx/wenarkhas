const express = require('express');
const {
  createDeliveryStaff,
  getAllDeliveryStaff,
  getDeliveryStaff,
  updateAvailability,
  updateLocation,
  approveDeliveryStaff,
  deleteDeliveryStaff,
  getDeliveryStats,
  getMyProfile
} = require('../controllers/deliveryStaffController');
const { protect } = require('../controller/authController');
const { 
  restrictTo, 
  isStoreOwnerOrAdmin 
} = require('../middlewares/roleMiddleware');

const router = express.Router();

// حماية جميع المسارات
router.use(protect);

// مسارات الموظفين (للمشرفين فقط)
router.route('/')
  .get(restrictTo('admin'), getAllDeliveryStaff)
  .post(restrictTo('admin'), createDeliveryStaff);

// مسارات الموظفين (للمشرفين والموظفين أنفسهم)
router.route('/me')
  .get(restrictTo('delivery'), getMyProfile);

router.route('/me/availability')
  .patch(restrictTo('delivery'), updateAvailability);

router.route('/me/location')
  .patch(restrictTo('delivery'), updateLocation);

// مسارات إدارية (للمشرفين فقط)
router.route('/:id')
  .get(restrictTo('admin'), getDeliveryStaff)
  .delete(restrictTo('admin'), deleteDeliveryStaff);

router.route('/:id/approve')
  .patch(restrictTo('admin'), approveDeliveryStaff);

// إحصائيات التوصيل
router.route('/stats/:id?')
  .get(restrictTo('admin', 'delivery'), getDeliveryStats);

// Middleware لربط نموذج موظف التوصيل مع الطرق التي تحتاج إليه
router.param('id', (req, res, next, val) => {
  req.model = require('../models/deliveryStaffModel');
  next();
});

module.exports = router;
