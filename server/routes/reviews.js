const express = require('express');
const Review = require('../models/Review');
const Project = require('../models/Project');
const License = require('../models/License');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Default GET route for reviews (returns user's reviews)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({
      reviewer: req.user._id
    })
    .populate('project', 'title description category')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Review.countDocuments({
      reviewer: req.user._id
    });

    res.json({
      reviews,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { projectId, rating, comment } = req.body;

    if (!projectId || !rating) {
      return res.status(400).json({ error: 'Project ID and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const project = await Project.findById(projectId);
    if (!project || !project.isActive) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.author.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot review your own project' });
    }

    const existingReview = await Review.findOne({
      project: projectId,
      reviewer: req.user._id
    });

    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this project' });
    }

    const userLicense = await License.findOne({
      project: projectId,
      licensee: req.user._id,
      'payment.status': 'completed'
    });

    const review = new Review({
      project: projectId,
      reviewer: req.user._id,
      rating,
      comment: comment || '',
      isVerifiedPurchase: !!userLicense
    });

    await review.save();
    await review.populate('reviewer', 'username profileImage');

    res.status(201).json({
      message: 'Review created successfully',
      review
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/project/:projectId', async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt' } = req.query;

    const sort = {};
    if (sortBy === 'rating') {
      sort.rating = -1;
      sort.createdAt = -1;
    } else {
      sort.createdAt = -1;
    }

    const reviews = await Review.find({ project: req.params.projectId })
      .populate('reviewer', 'username profileImage reputation')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments({ project: req.params.projectId });

    const stats = await Review.aggregate([
      { $match: { project: req.params.projectId } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    let ratingStats = {
      avgRating: 0,
      totalReviews: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };

    if (stats.length > 0) {
      ratingStats.avgRating = Math.round(stats[0].avgRating * 10) / 10;
      ratingStats.totalReviews = stats[0].totalReviews;
      
      stats[0].ratingDistribution.forEach(rating => {
        ratingStats.distribution[rating]++;
      });
    }

    res.json({
      reviews,
      stats: ratingStats,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:reviewId', authenticateToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review.reviewer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to edit this review' });
    }

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const updates = {};
    if (rating) updates.rating = rating;
    if (comment !== undefined) updates.comment = comment;

    const updatedReview = await Review.findByIdAndUpdate(
      req.params.reviewId,
      updates,
      { new: true }
    ).populate('reviewer', 'username profileImage');

    res.json({
      message: 'Review updated successfully',
      review: updatedReview
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:reviewId', authenticateToken, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review.reviewer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this review' });
    }

    await Review.findByIdAndDelete(req.params.reviewId);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;