const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GitHub OAuth configuration
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3001';

// GitHub OAuth login initiation
router.get('/oauth/login', (req, res) => {
  const state = Math.random().toString(36).substring(7);
  const scope = 'user:email,repo';
  
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${CLIENT_URL}/auth/github/callback&scope=${scope}&state=${state}`;
  
  res.json({ authUrl: githubAuthUrl });
});

// GitHub OAuth callback handler
router.post('/oauth/callback', async (req, res) => {
  try {
    const { code, state } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // Exchange code for access token
    const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code: code,
      redirect_uri: `${CLIENT_URL}/auth/github/callback`
    }, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    const { access_token } = tokenResponse.data;
    
    if (!access_token) {
      return res.status(400).json({ error: 'Failed to obtain access token from GitHub' });
    }

    // Get user information from GitHub
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${access_token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    const githubUser = userResponse.data;

    // Get user's email addresses
    const emailResponse = await axios.get('https://api.github.com/user/emails', {
      headers: {
        'Authorization': `token ${access_token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    const emails = emailResponse.data;
    const primaryEmail = emails.find(email => email.primary)?.email || githubUser.email;

    // Check if user exists
    let user = await User.findOne({
      $or: [
        { 'githubProfile.id': githubUser.id },
        { email: primaryEmail }
      ]
    });

    if (user) {
      // Update existing user with GitHub info
      user.githubProfile = {
        id: githubUser.id,
        username: githubUser.login,
        accessToken: access_token,
        profileUrl: githubUser.html_url,
        avatarUrl: githubUser.avatar_url
      };
      
      if (!user.profileImage && githubUser.avatar_url) {
        user.profileImage = githubUser.avatar_url;
      }
      
      await user.save();
    } else {
      // Create new user
      user = new User({
        username: githubUser.login,
        email: primaryEmail,
        profileImage: githubUser.avatar_url,
        bio: githubUser.bio || '',
        website: githubUser.blog || '',
        githubProfile: {
          id: githubUser.id,
          username: githubUser.login,
          accessToken: access_token,
          profileUrl: githubUser.html_url,
          avatarUrl: githubUser.avatar_url
        },
        isVerified: true, // GitHub users are considered verified
        // Set a placeholder password - they'll use GitHub OAuth
        password: Math.random().toString(36).substring(7) + Math.random().toString(36).substring(7)
      });
      
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'GitHub authentication successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        bio: user.bio,
        skills: user.skills,
        githubProfile: {
          username: user.githubProfile.username,
          profileUrl: user.githubProfile.profileUrl,
          avatarUrl: user.githubProfile.avatarUrl
        },
        reputation: user.reputation,
        role: user.role,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('GitHub OAuth error:', error.response?.data || error.message);
    res.status(500).json({ error: 'GitHub authentication failed' });
  }
});

// Verify GitHub repository ownership
router.post('/verify-repository', authenticateToken, async (req, res) => {
  try {
    const { repositoryUrl } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.githubProfile?.accessToken) {
      return res.status(400).json({ error: 'GitHub account not connected' });
    }

    // Parse repository URL
    const repoMatch = repositoryUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!repoMatch) {
      return res.status(400).json({ error: 'Invalid GitHub repository URL' });
    }

    const [, owner, repo] = repoMatch;
    const repoName = repo.replace(/\.git$/, ''); // Remove .git extension if present

    // Check if user has access to the repository
    try {
      const repoResponse = await axios.get(`https://api.github.com/repos/${owner}/${repoName}`, {
        headers: {
          'Authorization': `token ${user.githubProfile.accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      const repository = repoResponse.data;

      // Check if user is the owner or has admin/push access
      const hasAccess = repository.owner.login === user.githubProfile.username || 
                       repository.permissions?.admin || 
                       repository.permissions?.push;

      if (!hasAccess) {
        return res.status(403).json({ error: 'You do not have access to this repository' });
      }

      // Get repository details
      const repoInfo = {
        id: repository.id,
        fullName: repository.full_name,
        name: repository.name,
        description: repository.description,
        language: repository.language,
        stars: repository.stargazers_count,
        forks: repository.forks_count,
        isPrivate: repository.private,
        defaultBranch: repository.default_branch,
        topics: repository.topics || [],
        license: repository.license?.name || null,
        updatedAt: repository.updated_at,
        createdAt: repository.created_at
      };

      res.json({
        verified: true,
        repository: repoInfo,
        message: 'Repository access verified successfully'
      });

    } catch (apiError) {
      if (apiError.response?.status === 404) {
        return res.status(404).json({ error: 'Repository not found or not accessible' });
      } else if (apiError.response?.status === 403) {
        return res.status(403).json({ error: 'Access denied to repository' });
      }
      throw apiError;
    }

  } catch (error) {
    console.error('Repository verification error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to verify repository access' });
  }
});

// Get user's GitHub repositories
router.get('/repositories', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.githubProfile?.accessToken) {
      return res.status(400).json({ error: 'GitHub account not connected' });
    }

    const { page = 1, per_page = 30, type = 'all' } = req.query;

    const reposResponse = await axios.get('https://api.github.com/user/repos', {
      headers: {
        'Authorization': `token ${user.githubProfile.accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      },
      params: {
        page,
        per_page,
        type, // 'all', 'owner', 'member'
        sort: 'updated',
        direction: 'desc'
      }
    });

    const repositories = reposResponse.data.map(repo => ({
      id: repo.id,
      fullName: repo.full_name,
      name: repo.name,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      isPrivate: repo.private,
      htmlUrl: repo.html_url,
      cloneUrl: repo.clone_url,
      defaultBranch: repo.default_branch,
      topics: repo.topics || [],
      license: repo.license?.name || null,
      updatedAt: repo.updated_at,
      createdAt: repo.created_at,
      hasAccess: repo.permissions?.admin || repo.permissions?.push || repo.owner.login === user.githubProfile.username
    }));

    res.json({
      repositories,
      totalCount: repositories.length,
      page: parseInt(page),
      perPage: parseInt(per_page)
    });

  } catch (error) {
    console.error('Get repositories error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

// Disconnect GitHub account
router.delete('/disconnect', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user.githubProfile) {
      return res.status(400).json({ error: 'No GitHub account connected' });
    }

    // Remove GitHub profile but keep user account
    user.githubProfile = undefined;
    await user.save();

    res.json({ message: 'GitHub account disconnected successfully' });

  } catch (error) {
    console.error('Disconnect GitHub error:', error);
    res.status(500).json({ error: 'Failed to disconnect GitHub account' });
  }
});

// Check GitHub connection status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    const isConnected = !!(user.githubProfile?.accessToken);
    let profile = null;

    if (isConnected) {
      // Test the access token
      try {
        const userResponse = await axios.get('https://api.github.com/user', {
          headers: {
            'Authorization': `token ${user.githubProfile.accessToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });

        profile = {
          username: user.githubProfile.username,
          profileUrl: user.githubProfile.profileUrl,
          avatarUrl: user.githubProfile.avatarUrl
        };
      } catch (error) {
        // Token might be expired or revoked
        if (error.response?.status === 401) {
          user.githubProfile = undefined;
          await user.save();
          return res.json({ isConnected: false, profile: null });
        }
      }
    }

    res.json({
      isConnected,
      profile
    });

  } catch (error) {
    console.error('GitHub status error:', error);
    res.status(500).json({ error: 'Failed to check GitHub status' });
  }
});

module.exports = router;