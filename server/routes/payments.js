const express = require('express');
const stripe = require('../config/stripe');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const Project = require('../models/Project');
const License = require('../models/License');

const router = express.Router();

// Create Stripe Connect account for seller
router.post('/create-connect-account', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user.stripeAccountId) {
      return res.status(400).json({ error: 'Stripe account already exists' });
    }

    // Create Express account for seller
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      metadata: {
        userId: user._id.toString()
      }
    });

    // Save Stripe account ID to user
    user.stripeAccountId = account.id;
    await user.save();

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.CLIENT_URL}/seller/onboarding?refresh=true`,
      return_url: `${process.env.CLIENT_URL}/seller/onboarding?success=true`,
      type: 'account_onboarding',
    });

    res.json({
      account: account.id,
      onboardingUrl: accountLink.url
    });

  } catch (error) {
    console.error('Create connect account error:', error);
    res.status(500).json({ error: 'Failed to create Stripe account' });
  }
});

// Get seller onboarding status
router.get('/connect-account-status', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user.stripeAccountId) {
      return res.json({ hasAccount: false });
    }

    const account = await stripe.accounts.retrieve(user.stripeAccountId);
    
    res.json({
      hasAccount: true,
      accountId: account.id,
      detailsSubmitted: account.details_submitted,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled
    });

  } catch (error) {
    console.error('Get account status error:', error);
    res.status(500).json({ error: 'Failed to get account status' });
  }
});

// Create payment intent for project purchase
router.post('/create-payment-intent', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.body;
    
    const project = await Project.findById(projectId).populate('author');
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.license.type === 'free') {
      return res.status(400).json({ error: 'This project is free' });
    }

    const buyer = await User.findById(req.user._id);
    const seller = project.author;

    if (!seller.stripeAccountId) {
      return res.status(400).json({ error: 'Seller has not set up payments' });
    }

    const price = project.license.price * 100; // Convert to cents
    const marketplaceFee = Math.round(price * (project.license.marketplaceFeePct / 100));
    const sellerAmount = price - marketplaceFee;

    // Create payment intent with application fee
    const paymentIntent = await stripe.paymentIntents.create({
      amount: price,
      currency: 'usd',
      application_fee_amount: marketplaceFee,
      transfer_data: {
        destination: seller.stripeAccountId,
      },
      metadata: {
        projectId: project._id.toString(),
        buyerId: buyer._id.toString(),
        sellerId: seller._id.toString(),
        projectTitle: project.title,
        marketplaceFee: marketplaceFee.toString(),
        sellerAmount: sellerAmount.toString()
      },
      description: `Purchase of ${project.title}`,
      receipt_email: buyer.email
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      projectTitle: project.title,
      amount: price / 100,
      marketplaceFee: marketplaceFee / 100,
      sellerAmount: sellerAmount / 100
    });

  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Confirm payment and create license
router.post('/confirm-payment', authenticateToken, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    const { projectId, buyerId, sellerId } = paymentIntent.metadata;
    
    // Create license record
    const license = new License({
      project: projectId,
      licensee: buyerId,
      licensor: sellerId,
      type: 'paid',
      price: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      paymentIntentId: paymentIntentId,
      isActive: true,
      purchaseDate: new Date()
    });

    await license.save();

    // Update project stats
    await Project.findByIdAndUpdate(projectId, {
      $inc: { 'stats.downloads': 1 }
    });

    res.json({
      success: true,
      license: license._id,
      message: 'Payment successful! You now have access to this project.'
    });

  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

// Get seller earnings dashboard
router.get('/seller-earnings', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user.stripeAccountId) {
      return res.json({ hasAccount: false });
    }

    // Get licenses for seller's projects
    const licenses = await License.find({ licensor: req.user._id })
      .populate('project', 'title')
      .populate('licensee', 'username email')
      .sort({ purchaseDate: -1 });

    const totalEarnings = licenses.reduce((sum, license) => {
      const marketplaceFee = license.price * 0.2; // 20% fee
      return sum + (license.price - marketplaceFee);
    }, 0);

    res.json({
      hasAccount: true,
      totalEarnings,
      totalSales: licenses.length,
      recentSales: licenses.slice(0, 10)
    });

  } catch (error) {
    console.error('Get seller earnings error:', error);
    res.status(500).json({ error: 'Failed to get earnings data' });
  }
});

// Webhook handler for Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Payment succeeded:', paymentIntent.id);
      break;
    
    case 'account.updated':
      const account = event.data.object;
      // Update user account status in database
      await User.findOneAndUpdate(
        { stripeAccountId: account.id },
        { 
          stripeAccountStatus: {
            detailsSubmitted: account.details_submitted,
            chargesEnabled: account.charges_enabled,
            payoutsEnabled: account.payouts_enabled
          }
        }
      );
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

module.exports = router;