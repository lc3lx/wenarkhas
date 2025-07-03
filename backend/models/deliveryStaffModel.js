const mongoose = require('mongoose');

const deliveryStaffSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'يجب أن يكون موظف التوصيل مرتبطاً بمستخدم'],
      unique: true
    },
    nationalId: {
      type: String,
      required: [true, 'يجب إدخال رقم الهوية'],
      unique: true,
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'يجب إدخال رقم الهاتف'],
      trim: true
    },
    vehicleType: {
      type: String,
      enum: ['motorcycle', 'car', 'bicycle', 'truck'],
      required: [true, 'يجب تحديد نوع المركبة']
    },
    vehicleNumber: {
      type: String,
      required: [true, 'يجب إدخال رقم المركبة'],
      trim: true
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    currentLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number], // [longitude, latitude]
      address: String,
      description: String
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'التقييم لا يمكن أن يكون أقل من 0'],
      max: [5, 'التقييم لا يمكن أن يكون أكثر من 5']
    },
    totalDeliveries: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    documents: [{
      type: String, // روابط المستندات (رخصة القيادة، الهوية، إلخ)
    }],
    bankAccount: {
      bankName: String,
      accountNumber: String,
      accountHolderName: String,
      iban: String
    },
    isApproved: {
      type: Boolean,
      default: false
    },
    rejectionReason: String,
    lastActive: Date
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Middleware للتحقق من أن المستخدم له دور موظف توصيل
deliveryStaffSchema.pre('save', async function(next) {
  const user = await mongoose.model('User').findById(this.user);
  if (!user || user.role !== 'delivery') {
    return next(new Error('يجب أن يكون المستخدم لديه دور موظف توصيل'));
  }
  next();
});

// Middleware لتحديث حالة المستخدم عند الحذف
deliveryStaffSchema.pre('remove', async function(next) {
  await this.model('User').findByIdAndUpdate(this.user, { role: 'user' });
  next();
});

// Virtual populate for orders
deliveryStaffSchema.virtual('orders', {
  ref: 'Order',
  foreignField: 'deliveryStaff',
  localField: '_id'
});

// فهرسة الموقع الجغرافي للبحث عن أقرب موظف توصيل
deliveryStaffSchema.index({ 'currentLocation.coordinates': '2dsphere' });

module.exports = mongoose.model('DeliveryStaff', deliveryStaffSchema);
