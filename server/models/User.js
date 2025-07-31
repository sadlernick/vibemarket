const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: function() { return !this.oauth.google.id && !this.oauth.apple.id && !this.githubProfile.id; },
    minlength: 6
  },
  oauth: {
    google: {
      id: String,
      email: String
    },
    apple: {
      id: String,
      email: String
    }
  },
  profileImage: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  skills: [{
    type: String,
    trim: true
  }],
  githubProfile: {
    id: Number,
    username: String,
    accessToken: String,
    profileUrl: String,
    avatarUrl: String
  },
  website: {
    type: String,
    default: ''
  },
  reputation: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  stripeCustomerId: {
    type: String,
    default: null
  },
  stripeAccountId: {
    type: String,
    default: null
  },
  stripeAccountStatus: {
    detailsSubmitted: {
      type: Boolean,
      default: false
    },
    chargesEnabled: {
      type: Boolean,
      default: false
    },
    payoutsEnabled: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);