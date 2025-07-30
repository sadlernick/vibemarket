const mongoose = require('mongoose');

const licenseSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  licensee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  licenseType: {
    type: String,
    enum: ['free', 'basic', 'premium', 'enterprise'],
    required: true
  },
  permissions: {
    viewCode: {
      type: Boolean,
      default: false
    },
    downloadCode: {
      type: Boolean,
      default: false
    },
    commercialUse: {
      type: Boolean,
      default: false
    },
    modify: {
      type: Boolean,
      default: false
    },
    redistribute: {
      type: Boolean,
      default: false
    },
    privateUse: {
      type: Boolean,
      default: true
    }
  },
  payment: {
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    stripePaymentIntentId: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

licenseSchema.index({ project: 1, licensee: 1 }, { unique: true });
licenseSchema.index({ licensee: 1, createdAt: -1 });
licenseSchema.index({ project: 1, createdAt: -1 });

module.exports = mongoose.model('License', licenseSchema);