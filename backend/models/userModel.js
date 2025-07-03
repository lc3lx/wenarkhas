const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, "name required"],
    },
    slug: {
      type: String,
      lowercase: true,
    },
    email: {
      type: String,
      required: [true, "email required"],
      unique: true,
      lowercase: true,
    },
    phone: String,
    profileImg: String,

    password: {
      type: String,
      required: [true, "password required"],
      minlength: [6, "Too short password"],
    },
    passwordChangedAt: Date,
    passwordResetCode: String,
    passwordResetExpires: Date,
    passwordResetVerified: Boolean,
    role: {
      type: String,
      enum: ["user", "store_owner", "delivery", "admin"],
      default: "user",
    },
    // Reference to delivery staff profile (if user is a delivery staff)
    deliveryStaff: {
      type: mongoose.Schema.ObjectId,
      ref: 'DeliveryStaff',
      required: function() {
        return this.role === 'delivery';
      }
    },
    active: {
      type: Boolean,
      default: true,
    },
    // child reference (one to many)
    wishlist: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "ProductStore",
      },
    ],
    // عنوان التوصيل الافتراضي
  defaultAddress: {
    type: {
      type: String,
      default: 'Point',
      enum: ['Point']
    },
    coordinates: [Number], // [longitude, latitude]
    address: String,
    details: String,
    phone: String,
    isDefault: {
      type: Boolean,
      default: true
    }
  },
  // عناوين التوصيل الإضافية
  addresses: [{
    type: {
      type: String,
      default: 'Point',
      enum: ['Point']
    },
    coordinates: [Number], // [longitude, latitude]
    address: String,
    details: String,
    phone: String,
    isDefault: {
      type: Boolean,
      default: false
    },
    label: {
      type: String,
      enum: ['home', 'work', 'other']
    }
  }],
  // إعدادات الإشعارات
  notificationSettings: {
    orderUpdates: { type: Boolean, default: true },
    promotions: { type: Boolean, default: true },
    deliveryUpdates: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    emailNotifications: { type: Boolean, default: false },
    smsNotifications: { type: Boolean, default: false }
  },
  // رموز FCM للأجهزة المختلفة
  fcmTokens: [{
    token: String,
    device: String,
    os: String,
    lastUsed: Date
  }],
  
  // إعدادات الإشعارات
  notificationSettings: {
    priceDrop: { type: Boolean, default: true },
    promotions: { type: Boolean, default: true },
    orderUpdates: { type: Boolean, default: true },
    stockUpdates: { type: Boolean, default: true },
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
  },
  
  addresses: [
      {
        id: { type: mongoose.Schema.Types.ObjectId },
        alias: String,
        details: String,
        phone: String,
        city: String,
        postalCode: String,
      },
    ],
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  // Hashing user password
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
