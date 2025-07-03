const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'يجب أن يكون الإشعار مرتبطاً بمستخدم']
  },
  title: {
    type: String,
    required: [true, 'يجب إدخال عنوان للإشعار']
  },
  message: {
    type: String,
    required: [true, 'يجب إدخال محتوى الإشعار']
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error', 'promotion', 'price_drop'],
    default: 'info'
  },
  read: {
    type: Boolean,
    default: false
  },
  relatedEntity: {
    type: mongoose.Schema.Types.Mixed,
  },
  actionUrl: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// فهرسة لتحسين أداء الاستعلامات
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
