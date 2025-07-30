const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  repository: {
    freeUrl: {
      type: String,
      default: ''
    },
    paidUrl: {
      type: String,
      default: ''
    },
    branch: {
      type: String,
      default: 'main'
    },
    isPrivate: {
      type: Boolean,
      default: false
    }
  },
  demo: {
    url: {
      type: String,
      default: ''
    },
    screenshots: [{
      type: String
    }]
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  category: {
    type: String,
    required: true,
    enum: ['web', 'mobile', 'desktop', 'api', 'library', 'tool', 'game', 'other']
  },
  tech_stack: [{
    type: String,
    trim: true
  }],
  license: {
    type: {
      type: String,
      required: true,
      enum: ['free', 'paid', 'freemium']
    },
    price: {
      type: Number,
      default: 0,
      min: 0
    },
    sellerPrice: {
      type: Number,
      default: 0,
      min: 0
    },
    marketplaceFeePct: {
      type: Number,
      default: 20,
      min: 0,
      max: 100
    },
    sellerEarnings: {
      type: Number,
      default: 0,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    features: {
      freeFeatures: [String],
      paidFeatures: [String]
    }
  },
  access: {
    viewCode: {
      type: String,
      enum: ['public', 'licensed', 'private'],
      default: 'public'
    },
    runApp: {
      type: String,
      enum: ['public', 'licensed', 'private'],
      default: 'public'
    },
    downloadCode: {
      type: String,
      enum: ['public', 'licensed', 'private'],
      default: 'licensed'
    }
  },
  stats: {
    views: {
      type: Number,
      default: 0
    },
    downloads: {
      type: Number,
      default: 0
    },
    stars: {
      type: Number,
      default: 0
    },
    forks: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'published'
  }
}, {
  timestamps: true
});

projectSchema.index({ title: 'text', description: 'text', tags: 'text' });
projectSchema.index({ author: 1, createdAt: -1 });
projectSchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model('Project', projectSchema);