const express = require('express');
const Project = require('../models/Project');
const License = require('../models/License');
const Review = require('../models/Review');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const githubValidator = require('../services/githubValidator');

const router = express.Router();

router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('Project creation request body:', JSON.stringify(req.body, null, 2));
    
    const {
      title,
      description,
      repository,
      demo,
      tags,
      category,
      tech_stack,
      license,
      access
    } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ error: 'Required fields missing: title, description, and category are required' });
    }

    // Debug the received data
    console.log('Validation check:');
    console.log('- title:', title);
    console.log('- description:', description);
    console.log('- category:', category);
    console.log('- license type:', license?.type);
    console.log('- repository:', repository);

    // Validate repository URLs based on license type
    if (license?.type === 'free' && !repository?.freeUrl) {
      console.log('Error: Free repository URL missing');
      return res.status(400).json({ error: 'Free repository URL is required for free projects' });
    }
    if (license?.type === 'paid' && !repository?.paidUrl) {
      console.log('Error: Paid repository URL missing');
      return res.status(400).json({ error: 'Paid repository URL is required for paid projects' });
    }
    if (license?.type === 'freemium' && (!repository?.freeUrl || !repository?.paidUrl)) {
      console.log('Error: Freemium repository URLs missing');
      return res.status(400).json({ error: 'Both free and paid repository URLs are required for freemium projects' });
    }

    // Validate GitHub URLs
    const urlsToValidate = {};
    if (repository?.freeUrl) urlsToValidate.freeUrl = repository.freeUrl;
    if (repository?.paidUrl) urlsToValidate.paidUrl = repository.paidUrl;

    const validationResults = await githubValidator.validateMultipleRepositories(urlsToValidate);
    
    // Check for validation errors
    for (const [urlType, result] of Object.entries(validationResults)) {
      if (!result.valid && !result.empty) {
        console.log(`GitHub validation failed for ${urlType}:`, result.error);
        return res.status(400).json({ 
          error: `Invalid GitHub URL (${urlType}): ${result.error}`,
          details: result.details 
        });
      }
    }

    const project = new Project({
      title,
      description,
      author: req.user._id,
      repository,
      demo: demo || {},
      tags: tags || [],
      category,
      tech_stack: tech_stack || [],
      license: {
        type: license?.type || 'free',
        price: license?.price || 0,
        currency: license?.currency || 'USD',
        features: license?.features || {}
      },
      access: {
        viewCode: access?.viewCode || 'public',
        runApp: access?.runApp || 'public',
        downloadCode: access?.downloadCode || 'licensed'
      }
    });

    await project.save();
    await project.populate('author', 'username profileImage reputation');

    res.status(201).json({
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      author
    } = req.query;

    const query = { isActive: true };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.$text = { $search: search };
    }

    if (author) {
      query.author = author;
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const projects = await Project.find(query)
      .populate('author', 'username profileImage reputation')
      .sort(sort)
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
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('author', 'username profileImage reputation githubProfile website');

    if (!project || !project.isActive) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await Project.findByIdAndUpdate(req.params.id, {
      $inc: { 'stats.views': 1 }
    });

    const reviews = await Review.find({ project: req.params.id })
      .populate('reviewer', 'username profileImage')
      .sort({ createdAt: -1 })
      .limit(10);

    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

    let userLicense = null;
    if (req.user) {
      userLicense = await License.findOne({
        project: req.params.id,
        licensee: req.user._id,
        isActive: true
      });
    }

    res.json({
      project,
      reviews,
      avgRating: Math.round(avgRating * 10) / 10,
      userLicense,
      canAccess: {
        viewCode: canAccessFeature(project.access.viewCode, req.user, userLicense),
        runApp: canAccessFeature(project.access.runApp, req.user, userLicense),
        downloadCode: canAccessFeature(project.access.downloadCode, req.user, userLicense)
      }
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to edit this project' });
    }

    const allowedUpdates = [
      'title', 'description', 'repository', 'demo', 'tags', 
      'tech_stack', 'license', 'access'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('author', 'username profileImage reputation');

    res.json({
      message: 'Project updated successfully',
      project: updatedProject
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this project' });
    }

    await Project.findByIdAndUpdate(req.params.id, { isActive: false });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

function canAccessFeature(accessLevel, user, userLicense) {
  if (accessLevel === 'public') return true;
  if (accessLevel === 'private') return false;
  if (accessLevel === 'licensed') {
    return user && userLicense && userLicense.isActive;
  }
  return false;
}

module.exports = router;