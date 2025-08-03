const express = require('express');
const BlogPost = require('../models/BlogPost');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get all published blog posts with pagination
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category;
    const search = req.query.search;
    const skip = (page - 1) * limit;

    let query = BlogPost.findPublished({
      skip,
      limit,
      sort: { publishedAt: -1 }
    });

    // Filter by category if provided
    if (category) {
      query = query.where({ category });
    }

    // Search if query provided
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query = query.or([
        { title: searchRegex },
        { excerpt: searchRegex },
        { tags: { $in: [searchRegex] } }
      ]);
    }

    const posts = await query;
    
    // Get total count for pagination
    const totalQuery = BlogPost.find({ 
      status: 'published',
      publishedAt: { $lte: new Date() }
    });
    
    if (category) totalQuery.where({ category });
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      totalQuery.or([
        { title: searchRegex },
        { excerpt: searchRegex },
        { tags: { $in: [searchRegex] } }
      ]);
    }
    
    const total = await totalQuery.countDocuments();
    const totalPages = Math.ceil(total / limit);

    res.json({
      posts,
      pagination: {
        currentPage: page,
        totalPages,
        totalPosts: total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
});

// Get featured blog posts
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 3;
    const posts = await BlogPost.findFeatured(limit);
    res.json(posts);
  } catch (error) {
    console.error('Error fetching featured posts:', error);
    res.status(500).json({ error: 'Failed to fetch featured posts' });
  }
});

// Get blog categories with post counts
router.get('/categories', async (req, res) => {
  try {
    const categories = await BlogPost.aggregate([
      {
        $match: {
          status: 'published',
          publishedAt: { $lte: new Date() }
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json(categories.map(cat => ({
      name: cat._id,
      count: cat.count,
      displayName: cat._id.charAt(0).toUpperCase() + cat._id.slice(1).replace('-', ' ')
    })));
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get popular tags
router.get('/tags', async (req, res) => {
  try {
    const tags = await BlogPost.aggregate([
      {
        $match: {
          status: 'published',
          publishedAt: { $lte: new Date() }
        }
      },
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      { $limit: 20 }
    ]);

    res.json(tags.map(tag => ({
      name: tag._id,
      count: tag.count
    })));
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// Get single blog post by slug
router.get('/:slug', optionalAuth, async (req, res) => {
  try {
    const post = await BlogPost.findOne({ 
      slug: req.params.slug,
      status: 'published',
      publishedAt: { $lte: new Date() }
    }).populate('author', 'username profile.displayName profile.avatar profile.bio');

    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    // Increment view count
    await post.incrementViews();

    // Get related posts (same category, excluding current post)
    const relatedPosts = await BlogPost.findPublished({
      limit: 3,
      sort: { publishedAt: -1 }
    }).where({
      category: post.category,
      _id: { $ne: post._id }
    });

    res.json({
      post,
      relatedPosts
    });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({ error: 'Failed to fetch blog post' });
  }
});

// Admin routes - Get all blog posts including drafts (for admin)
router.get('/admin/posts', authenticateToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const posts = await BlogPost.find()
      .populate('author', 'username profile.displayName profile.avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await BlogPost.countDocuments();
    const totalPages = Math.ceil(total / limit);

    res.json({
      posts,
      pagination: {
        currentPage: page,
        totalPages,
        totalPosts: total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching admin blog posts:', error);
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
});

// Admin routes - Get single blog post by ID (for editing)
router.get('/admin/posts/:id', authenticateToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const post = await BlogPost.findById(req.params.id)
      .populate('author', 'username profile.displayName profile.avatar');

    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    res.json(post);
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({ error: 'Failed to fetch blog post' });
  }
});

// Admin routes - Create new blog post
router.post('/admin/posts', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin (you might want to create an isAdmin middleware)
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const {
      title,
      slug,
      excerpt,
      content,
      category,
      tags,
      status,
      featured,
      featuredImage,
      seo,
      readTime
    } = req.body;

    const blogPost = new BlogPost({
      title,
      slug,
      excerpt,
      content,
      author: req.user._id,
      category,
      tags: tags || [],
      status: status || 'draft',
      featured: featured || false,
      featuredImage,
      seo: seo || {},
      readTime: readTime || 5
    });

    await blogPost.save();
    
    await blogPost.populate('author', 'username profile.displayName profile.avatar');

    res.status(201).json(blogPost);
  } catch (error) {
    console.error('Error creating blog post:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ error: 'A blog post with this slug already exists' });
    }
    
    res.status(500).json({ 
      error: 'Failed to create blog post',
      details: error.message,
      validationErrors: error.errors
    });
  }
});

// Admin routes - Update blog post
router.put('/admin/posts/:id', authenticateToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        post[key] = req.body[key];
      }
    });

    await post.save();
    await post.populate('author', 'username profile.displayName profile.avatar');

    res.json(post);
  } catch (error) {
    console.error('Error updating blog post:', error);
    res.status(500).json({ error: 'Failed to update blog post' });
  }
});

// Admin routes - Delete blog post
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const post = await BlogPost.findByIdAndDelete(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    res.json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({ error: 'Failed to delete blog post' });
  }
});

module.exports = router;