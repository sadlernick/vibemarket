const mongoose = require('mongoose');
const User = require('../server/models/User');
require('dotenv').config();

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'nick@sportwise.ai' });
    
    if (existingAdmin) {
      // Update existing user to admin
      existingAdmin.role = 'admin';
      await existingAdmin.save();
      console.log('Updated existing user to admin role');
    } else {
      // Create new admin user
      const adminUser = new User({
        username: 'admin',
        email: 'nick@sportwise.ai',
        password: 'Sloan2018!',
        role: 'admin',
        isVerified: true,
        reputation: 1000
      });

      await adminUser.save();
      console.log('Admin user created successfully');
    }

    console.log('Admin credentials:');
    console.log('Email: nick@sportwise.ai');
    console.log('Password: Sloan2018!');
    console.log('Role: admin');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin();