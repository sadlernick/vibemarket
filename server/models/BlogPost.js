const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  excerpt: {
    type: String,
    required: true,
    maxlength: 300
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  featured: {
    type: Boolean,
    default: false
  },
  featuredImage: {
    url: String,
    alt: String
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  category: {
    type: String,
    required: true,
    enum: [
      'development',
      'marketplace',
      'tutorials',
      'announcements',
      'community',
      'tools',
      'best-practices',
      'case-studies'
    ]
  },
  seo: {
    metaTitle: {
      type: String,
      maxlength: 60
    },
    metaDescription: {
      type: String,
      maxlength: 160
    },
    focusKeyword: String,
    canonicalUrl: String
  },
  readTime: {
    type: Number, // in minutes
    default: 5
  },
  publishedAt: {
    type: Date
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  comments: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
blogPostSchema.index({ slug: 1 });
blogPostSchema.index({ status: 1, publishedAt: -1 });
blogPostSchema.index({ category: 1, publishedAt: -1 });
blogPostSchema.index({ tags: 1 });
blogPostSchema.index({ featured: 1, publishedAt: -1 });

// Virtual for URL
blogPostSchema.virtual('url').get(function() {
  return `/blog/${this.slug}`;
});

// Pre-save middleware to set publishedAt when status changes to published
blogPostSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  // Auto-generate SEO fields if not provided
  if (!this.seo) {
    this.seo = {};
  }
  
  if (!this.seo.metaTitle) {
    this.seo.metaTitle = this.title.length > 60 ? this.title.substring(0, 57) + '...' : this.title;
  }
  
  if (!this.seo.metaDescription) {
    this.seo.metaDescription = this.excerpt.length > 160 ? this.excerpt.substring(0, 157) + '...' : this.excerpt;
  }
  
  next();
});

// Static method to find published posts
blogPostSchema.statics.findPublished = function(options = {}) {
  return this.find({ 
    status: 'published',
    publishedAt: { $lte: new Date() }
  }, null, options).populate('author', 'username profile.displayName profile.avatar');
};

// Static method to find featured posts
blogPostSchema.statics.findFeatured = function(limit = 3) {
  return this.findPublished({ 
    limit,
    sort: { publishedAt: -1 }
  }).where({ featured: true });
};

// Static method to find by category
blogPostSchema.statics.findByCategory = function(category, options = {}) {
  return this.findPublished(options).where({ category });
};

// Static method to search posts
blogPostSchema.statics.search = function(query, options = {}) {
  const searchRegex = new RegExp(query, 'i');
  return this.findPublished(options).or([
    { title: searchRegex },
    { excerpt: searchRegex },
    { content: searchRegex },
    { tags: { $in: [searchRegex] } }
  ]);
};

// Method to increment views
blogPostSchema.methods.incrementViews = function() {
  return this.constructor.updateOne(
    { _id: this._id },
    { $inc: { views: 1 } }
  );
};

module.exports = mongoose.model('BlogPost', blogPostSchema);