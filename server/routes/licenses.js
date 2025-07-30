const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Project = require('../models/Project');
const License = require('../models/License');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/purchase', authenticateToken, async (req, res) => {
  try {
    const { projectId, licenseType } = req.body;

    if (!projectId || !licenseType) {
      return res.status(400).json({ error: 'Project ID and license type required' });
    }

    const project = await Project.findById(projectId);
    if (!project || !project.isActive) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.author.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot purchase license for your own project' });
    }

    const existingLicense = await License.findOne({
      project: projectId,
      licensee: req.user._id,
      isActive: true
    });

    if (existingLicense) {
      return res.status(400).json({ error: 'You already have an active license for this project' });
    }

    const licenseConfig = getLicenseConfig(licenseType, project);
    if (!licenseConfig) {
      return res.status(400).json({ error: 'Invalid license type' });
    }

    let paymentIntentId = null;
    
    if (licenseConfig.amount > 0) {
      if (!req.user.stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: req.user.email,
          metadata: { userId: req.user._id.toString() }
        });
        await User.findByIdAndUpdate(req.user._id, { stripeCustomerId: customer.id });
        req.user.stripeCustomerId = customer.id;
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(licenseConfig.amount * 100),
        currency: licenseConfig.currency.toLowerCase(),
        customer: req.user.stripeCustomerId,
        metadata: {
          projectId: projectId,
          licenseeId: req.user._id.toString(),
          licenseType: licenseType
        }
      });

      paymentIntentId = paymentIntent.id;
    }

    const license = new License({
      project: projectId,
      licensee: req.user._id,
      licenseType,
      permissions: licenseConfig.permissions,
      payment: {
        amount: licenseConfig.amount,
        currency: licenseConfig.currency,
        stripePaymentIntentId: paymentIntentId,
        status: licenseConfig.amount > 0 ? 'pending' : 'completed'
      },
      expiresAt: licenseConfig.expiresAt
    });

    await license.save();

    if (licenseConfig.amount === 0) {
      await license.populate([
        { path: 'project', select: 'title author' },
        { path: 'licensee', select: 'username email' }
      ]);
    }

    res.status(201).json({
      message: licenseConfig.amount > 0 ? 'Payment required to complete license' : 'License granted successfully',
      license,
      clientSecret: paymentIntentId ? (await stripe.paymentIntents.retrieve(paymentIntentId)).client_secret : null
    });
  } catch (error) {
    console.error('Purchase license error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/confirm-payment', authenticateToken, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment intent ID required' });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    const license = await License.findOne({
      'payment.stripePaymentIntentId': paymentIntentId,
      licensee: req.user._id
    });

    if (!license) {
      return res.status(404).json({ error: 'License not found' });
    }

    license.payment.status = 'completed';
    license.isActive = true;
    await license.save();

    await Project.findByIdAndUpdate(license.project, {
      $inc: { 'stats.downloads': 1 }
    });

    await license.populate([
      { path: 'project', select: 'title author' },
      { path: 'licensee', select: 'username email' }
    ]);

    res.json({
      message: 'License activated successfully',
      license
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/my-licenses', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const licenses = await License.find({
      licensee: req.user._id,
      isActive: true
    })
    .populate('project', 'title description author category createdAt')
    .populate('project.author', 'username')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await License.countDocuments({
      licensee: req.user._id,
      isActive: true
    });

    res.json({
      licenses,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get my licenses error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/project/:projectId', authenticateToken, async (req, res) => {
  try {
    const licenses = await License.find({
      project: req.params.projectId,
      'payment.status': 'completed'
    })
    .populate('licensee', 'username profileImage')
    .sort({ createdAt: -1 });

    const project = await Project.findById(req.params.projectId);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to view licenses for this project' });
    }

    res.json({ licenses });
  } catch (error) {
    console.error('Get project licenses error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

function getLicenseConfig(licenseType, project) {
  const configs = {
    free: {
      amount: 0,
      currency: 'USD',
      permissions: {
        viewCode: true,
        downloadCode: false,
        commercialUse: false,
        modify: false,
        redistribute: false,
        privateUse: true
      },
      expiresAt: null
    },
    basic: {
      amount: project.license.price || 10,
      currency: project.license.currency || 'USD',
      permissions: {
        viewCode: true,
        downloadCode: true,
        commercialUse: false,
        modify: true,
        redistribute: false,
        privateUse: true
      },
      expiresAt: null
    },
    premium: {
      amount: (project.license.price || 10) * 3,
      currency: project.license.currency || 'USD',
      permissions: {
        viewCode: true,
        downloadCode: true,
        commercialUse: true,
        modify: true,
        redistribute: false,
        privateUse: true
      },
      expiresAt: null
    },
    enterprise: {
      amount: (project.license.price || 10) * 10,
      currency: project.license.currency || 'USD',
      permissions: {
        viewCode: true,
        downloadCode: true,
        commercialUse: true,
        modify: true,
        redistribute: true,
        privateUse: true
      },
      expiresAt: null
    }
  };

  return configs[licenseType];
}

module.exports = router;