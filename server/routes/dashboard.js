const express = require('express');
const Project = require('../models/Project');
const License = require('../models/License');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user dashboard data
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's published projects
    const publishedProjects = await Project.find({
      author: userId,
      status: 'published',
      isActive: true
    }).sort({ createdAt: -1 }).limit(10);

    // Get user's draft projects
    const draftProjects = await Project.find({
      author: userId,
      status: 'draft'
    }).sort({ updatedAt: -1 }).limit(5);

    // Get user's purchased licenses
    const purchasedLicenses = await License.find({
      licensee: userId,
      isActive: true
    }).populate({
      path: 'project',
      populate: {
        path: 'author',
        select: 'username profileImage'
      }
    }).sort({ purchaseDate: -1 }).limit(10);

    // Calculate seller statistics
    const sellerStats = {
      totalProjects: publishedProjects.length,
      totalViews: publishedProjects.reduce((sum, project) => sum + project.stats.views, 0),
      totalDownloads: publishedProjects.reduce((sum, project) => sum + project.stats.downloads, 0),
      totalStars: publishedProjects.reduce((sum, project) => sum + project.stats.stars, 0),
      totalRevenue: 0,
      monthlyRevenue: 0,
      paidDownloads: 0,
      freeDownloads: 0
    };

    // Calculate revenue from licenses
    const userLicenses = await License.find({
      project: { $in: publishedProjects.map(p => p._id) },
      isActive: true
    }).populate('project');

    sellerStats.totalRevenue = userLicenses.reduce((sum, license) => {
      return sum + (license.project.license.price * 0.8); // 80% after marketplace fee
    }, 0);

    // Calculate monthly revenue (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const monthlyLicenses = userLicenses.filter(license => 
      new Date(license.purchaseDate) >= thirtyDaysAgo
    );

    sellerStats.monthlyRevenue = monthlyLicenses.reduce((sum, license) => {
      return sum + (license.project.license.price * 0.8);
    }, 0);

    // Count paid vs free downloads
    sellerStats.paidDownloads = userLicenses.filter(license => 
      license.project.license.price > 0
    ).length;

    sellerStats.freeDownloads = sellerStats.totalDownloads - sellerStats.paidDownloads;

    // Get recent activity (views, downloads, purchases)
    const recentActivity = [];

    // Add recent purchases of user's projects
    const recentPurchases = await License.find({
      project: { $in: publishedProjects.map(p => p._id) },
      isActive: true
    }).populate([
      { path: 'project', select: 'title' },
      { path: 'licensee', select: 'username' }
    ]).sort({ purchaseDate: -1 }).limit(5);

    recentPurchases.forEach(purchase => {
      recentActivity.push({
        type: 'purchase',
        message: `${purchase.licensee.username} purchased ${purchase.project.title}`,
        date: purchase.purchaseDate,
        revenue: purchase.project.license ? purchase.project.license.price * 0.8 : 0
      });
    });

    // Sort recent activity by date
    recentActivity.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      publishedProjects,
      draftProjects,
      purchasedLicenses,
      sellerStats,
      recentActivity: recentActivity.slice(0, 10)
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

// Get detailed project analytics
router.get('/project/:id/analytics', authenticateToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Get licenses for this project
    const licenses = await License.find({
      project: req.params.id,
      isActive: true
    }).populate('licensee', 'username email').sort({ purchaseDate: -1 });

    // Calculate analytics
    const analytics = {
      totalViews: project.stats.views,
      totalDownloads: project.stats.downloads,
      totalStars: project.stats.stars,
      totalRevenue: licenses.reduce((sum, license) => sum + (project.license.price * 0.8), 0),
      totalLicenses: licenses.length,
      conversionRate: project.stats.views > 0 ? (licenses.length / project.stats.views * 100).toFixed(2) : 0,
      averageRating: 0, // TODO: Calculate from reviews
      recentLicenses: licenses.slice(0, 10),
      
      // Monthly breakdown (last 6 months)
      monthlyData: []
    };

    // Generate monthly data for the last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthlyLicenses = licenses.filter(license => {
        const purchaseDate = new Date(license.purchaseDate);
        return purchaseDate >= monthStart && purchaseDate <= monthEnd;
      });

      analytics.monthlyData.push({
        month: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
        revenue: monthlyLicenses.reduce((sum, license) => sum + (project.license.price * 0.8), 0),
        downloads: monthlyLicenses.length,
        // Note: We don't have monthly view data, so we'll estimate
        views: Math.floor(project.stats.views / 6)
      });
    }

    res.json(analytics);

  } catch (error) {
    console.error('Project analytics error:', error);
    res.status(500).json({ error: 'Failed to load project analytics' });
  }
});

// Get user's purchase history with details
router.get('/purchases', authenticateToken, async (req, res) => {
  try {
    const purchases = await License.find({
      licensee: req.user._id,
      isActive: true
    }).populate({
      path: 'project',
      populate: {
        path: 'author',
        select: 'username profileImage'
      }
    }).sort({ purchaseDate: -1 });

    const purchaseStats = {
      totalPurchases: purchases.length,
      totalSpent: purchases.reduce((sum, license) => sum + (license.project.license.price || 0), 0),
      categoriesCount: {}
    };

    // Count purchases by category
    purchases.forEach(license => {
      const category = license.project.category;
      purchaseStats.categoriesCount[category] = (purchaseStats.categoriesCount[category] || 0) + 1;
    });

    res.json({
      purchases,
      purchaseStats
    });

  } catch (error) {
    console.error('Purchase history error:', error);
    res.status(500).json({ error: 'Failed to load purchase history' });
  }
});

module.exports = router;