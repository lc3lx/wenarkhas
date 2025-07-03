const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: [true, 'يجب أن يكون المنتج مرتبطاً بطلب']
  },
  store: {
    type: mongoose.Schema.ObjectId,
    ref: 'Store',
    required: [true, 'يجب أن يكون المنتج مرتبطاً بمتجر']
  },
  quantity: {
    type: Number,
    required: [true, 'يجب إدخال الكمية'],
    min: [1, 'الحد الأدنى للكمية هو 1']
  },
  price: {
    type: Number,
    required: [true, 'يجب إدخال سعر المنتج']
  },
  totalPrice: Number
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'يجب أن يكون الطلب مرتبطاً بمستخدم']
    },
    store: {
      type: mongoose.Schema.ObjectId,
      ref: 'Store',
      required: [true, 'يجب أن يكون الطلب مرتبطاً بمتجر']
    },
    items: [orderItemSchema],
    deliveryAddress: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number], // [longitude, latitude]
      address: String,
      details: String,
      phone: String,
      recipientName: String
    },
    status: {
      type: String,
      enum: [
        'pending',       // في انتظار التأكيد
        'confirmed',     // تم التأكيد
        'preparing',     // قيد التحضير
        'ready',         // جاهز للتسليم
        'assigned',      // تم تعيين موظف توصيل
        'on_way',        // في الطريق
        'delivered',     // تم التسليم
        'cancelled',     // تم الإلغاء
        'refunded'       // تم الاسترجاع
      ],
      default: 'pending'
    },
    deliveryStaff: {
      type: mongoose.Schema.ObjectId,
      ref: 'DeliveryStaff'
    },
    deliveryFee: {
      type: Number,
      default: 0
    },
    subtotal: {
      type: Number,
      required: [true, 'يجب إدخال المجموع الجزئي']
    },
    total: {
      type: Number,
      required: [true, 'يجب إدخال المجموع الكلي']
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'wallet'],
      required: [true, 'يجب تحديد طريقة الدفع']
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    notes: String,
    cancellationReason: String,
    deliveredAt: Date,
    estimatedDeliveryTime: Date,
    deliveryType: {
      type: String,
      enum: ['store', 'platform'],
      default: 'platform'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Middleware لحساب الأسعار
orderSchema.pre('save', function(next) {
  // حساب المجموع الفرعي
  this.subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // حساب المجموع الكلي (المجموع الفرعي + رسوم التوصيل)
  this.total = this.subtotal + (this.deliveryFee || 0);
  
  next();
});

// Middleware لإرسال إشعارات تغيير الحالة
orderSchema.post('save', async function(doc) {
  // سيتم إضافة منطق إرسال الإشعارات هنا
  console.log(`Order ${doc._id} status changed to ${doc.status}`);
});

// فهرسة لتحسين استعلامات الطلبات
orderSchema.index({ user: 1, status: 1 });
orderSchema.index({ store: 1, status: 1 });
orderSchema.index({ deliveryStaff: 1, status: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'deliveryAddress.coordinates': '2dsphere' });

// Virtual populate for reviews
orderSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'order',
  localField: '_id'
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
