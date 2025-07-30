const express = require('express');
const User = require('../models/User');
const Project = require('../models/Project');
const License = require('../models/License');
const Review = require('../models/Review');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [userCount, projectCount, licenseCount, reviewCount] = await Promise.all([
      User.countDocuments(),
      Project.countDocuments(),
      License.countDocuments(),
      Review.countDocuments()
    ]);

    const recentUsers = await User.find()
      .select('username email createdAt isVerified role')
      .sort({ createdAt: -1 })
      .limit(10);

    const recentProjects = await Project.find()
      .populate('author', 'username email')
      .sort({ createdAt: -1 })
      .limit(10);

    const totalEarnings = await License.aggregate([
      { $match: { 'payment.status': 'completed' } },
      { $group: { _id: null, total: { $sum: '$payment.amount' } } }
    ]);

    res.json({
      stats: {
        totalUsers: userCount,
        totalProjects: projectCount,
        totalLicenses: licenseCount,
        totalReviews: reviewCount,
        totalEarnings: totalEarnings[0]?.total || 0
      },
      recentUsers,
      recentProjects
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    
    const query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/users/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isVerified, role } = req.body;

    const updates = {};
    if (typeof isVerified === 'boolean') updates.isVerified = isVerified;
    if (role && ['user', 'admin'].includes(role)) updates.role = role;

    const user = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Admin update user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/projects', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    
    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const projects = await Project.find(query)
      .populate('author', 'username email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Project.countDocuments(query);

    res.json({
      projects,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Admin projects error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/projects/:projectId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { isActive, isFeatured } = req.body;

    const updates = {};
    if (typeof isActive === 'boolean') updates.isActive = isActive;
    if (typeof isFeatured === 'boolean') updates.isFeatured = isFeatured;

    const project = await Project.findByIdAndUpdate(
      projectId,
      updates,
      { new: true }
    ).populate('author', 'username email');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({
      message: 'Project updated successfully',
      project
    });
  } catch (error) {
    console.error('Admin update project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/projects/:projectId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { projectId } = req.params;

    await Project.findByIdAndUpdate(projectId, { isActive: false });

    res.json({ message: 'Project deactivated successfully' });
  } catch (error) {
    console.error('Admin delete project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/licenses', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const licenses = await License.find()
      .populate('project', 'title')
      .populate('licensee', 'username email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await License.countDocuments();

    res.json({
      licenses,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Admin licenses error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;