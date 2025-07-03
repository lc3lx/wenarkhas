const express = require('express');
const {
  addFcmToken,
  removeFcmToken,
  updateNotificationSettings
} = require('../controller/fcmController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// جميع المسارات محمية وتتطلب تسجيل الدخول
router.use(protect);

router
  .route('/token')
  .post(addFcmToken)
  .delete(removeFcmToken);

router
  .route('/settings')
  .patch(updateNotificationSettings);

module.exports = router;
