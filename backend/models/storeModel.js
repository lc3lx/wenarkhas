const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      lowercase: true,
      unique: true,
    },
    logo: String,
    location: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    website: String,
    phone: String,
    email: String,
    description: String,
    openingHours: [{
      day: {
        type: String,
        enum: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      },
      open: String,
      close: String,
      closed: {
        type: Boolean,
        default: false
      }
    }],
    deliveryOptions: {
      hasDelivery: {
        type: Boolean,
        default: true
      },
      isFreeDelivery: {
        type: Boolean,
        default: false
      },
      deliveryFee: {
        type: Number,
        default: 10,
        min: 0
      },
      minOrderForFreeDelivery: {
        type: Number,
        default: 100
      },
      deliveryTime: {
        min: {
          type: Number,
          default: 30
        },
        max: {
          type: Number,
          default: 60
        },
        unit: {
          type: String,
          default: 'دقيقة',
          enum: ['دقيقة', 'ساعة', 'يوم']
        }
      },
      deliveryAreas: [{
        name: String,
        fee: {
          type: Number,
          default: 0
        }
      }]
    },
    isActive: {
      type: Boolean,
      default: true
    },
    owner: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// فهرسة الموقع الجغرافي للبحث عن المتاجر القريبة
storeSchema.index({ 'location.coordinates': '2dsphere' });

module.exports = mongoose.model("Store", storeSchema);
