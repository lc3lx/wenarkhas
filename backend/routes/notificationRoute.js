const express = require('express');
const {
  getUserNotifications,
  markAsRead,
  deleteNotification,
  markAllAsRead,
  getUnreadCount
} = require('../controllers/notificationController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// جميع المسارات محمية وتتطلب تسجيل الدخول
router.use(protect);

router
  .route('/')
  .get(getUserNotifications);

router
  .route('/unread-count')
  .get(getUnreadCount);

router
  .route('/mark-all-read')
  .patch(markAllAsRead);

router
  .route('/:id/read')
  .patch(markAsRead);

router
  .route('/:id')
  .delete(deleteNotification);

module.exports = router;
