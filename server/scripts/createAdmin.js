const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vibemarket', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const existingAdmin = await User.findOne({ email: 'nick@sportwise.ai' });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      existingAdmin.role = 'admin';
      await existingAdmin.save();
      console.log('Updated existing user to admin role');
    } else {
      const adminUser = new User({
        username: 'nick_admin',
        email: 'nick@sportwise.ai',
        password: 'Sloan2018!',
        role: 'admin',
        isVerified: true,
        bio: 'VibeMarket Administrator',
        skills: ['JavaScript', 'React', 'Node.js', 'MongoDB']
      });

      await adminUser.save();
      console.log('Admin user created successfully');
      console.log('Email: nick@sportwise.ai');
      console.log('Password: Sloan2018!');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin();