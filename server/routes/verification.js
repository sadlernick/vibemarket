const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const Project = require('../models/Project');

const router = express.Router();

// Generate verification token for domain
router.post('/domain/generate-token', authenticateToken, async (req, res) => {
  try {
    const { projectId, domain } = req.body;
    
    // Validate domain format
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    if (!domainRegex.test(domain)) {
      return res.status(400).json({ error: 'Invalid domain format' });
    }
    
    // Generate unique verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationPath = `packcode-verify-${verificationToken}.txt`;
    const verificationContent = `packcode-verification=${verificationToken}\nuser=${req.user._id}\nproject=${projectId}\ntimestamp=${Date.now()}`;
    
    // Store verification pending in database
    await Project.findByIdAndUpdate(projectId, {
      'verification.domain': {
        url: domain,
        token: verificationToken,
        status: 'pending',
        createdAt: new Date()
      }
    });
    
    res.json({
      success: true,
      instructions: {
        step1: `Create a file named: ${verificationPath}`,
        step2: `Place it at: https://${domain}/${verificationPath}`,
        step3: 'File content:',
        content: verificationContent,
        step4: 'Click verify once the file is uploaded'
      },
      verificationPath,
      verificationContent
    });
    
  } catch (error) {
    console.error('Generate domain token error:', error);
    res.status(500).json({ error: 'Failed to generate verification token' });
  }
});

// Verify domain ownership
router.post('/domain/verify', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.body;
    
    const project = await Project.findById(projectId);
    if (!project || !project.verification?.domain) {
      return res.status(404).json({ error: 'No pending domain verification found' });
    }
    
    const { url: domain, token } = project.verification.domain;
    const verificationUrl = `https://${domain}/packcode-verify-${token}.txt`;
    
    try {
      // Attempt to fetch the verification file
      const response = await axios.get(verificationUrl, {
        timeout: 10000,
        validateStatus: (status) => status === 200
      });
      
      const expectedContent = `packcode-verification=${token}`;
      
      if (response.data.includes(expectedContent)) {
        // Verification successful
        await Project.findByIdAndUpdate(projectId, {
          'verification.domain.status': 'verified',
          'verification.domain.verifiedAt': new Date(),
          'verifiedSource': 'domain'
        });
        
        res.json({
          success: true,
          message: 'Domain ownership verified successfully',
          domain
        });
      } else {
        res.status(400).json({ 
          error: 'Verification file content does not match',
          expected: expectedContent,
          tip: 'Make sure the file contains the exact verification string'
        });
      }
      
    } catch (fetchError) {
      res.status(400).json({ 
        error: 'Could not fetch verification file',
        url: verificationUrl,
        tip: 'Make sure the file is publicly accessible and the domain is correct'
      });
    }
    
  } catch (error) {
    console.error('Domain verification error:', error);
    res.status(500).json({ error: 'Failed to verify domain' });
  }
});

// NPM package verification
router.post('/npm/verify', authenticateToken, async (req, res) => {
  try {
    const { packageName, projectId } = req.body;
    
    // Fetch package info from NPM registry
    const npmResponse = await axios.get(`https://registry.npmjs.org/${packageName}`);
    const packageData = npmResponse.data;
    
    // Get user's NPM username (they need to provide this in their profile)
    const user = await User.findById(req.user._id);
    const npmUsername = user.npmUsername;
    
    if (!npmUsername) {
      return res.status(400).json({ 
        error: 'Please add your NPM username to your profile first' 
      });
    }
    
    // Check if user is a maintainer
    const maintainers = packageData.maintainers || [];
    const isMaintainer = maintainers.some(m => m.name === npmUsername);
    
    if (isMaintainer) {
      await Project.findByIdAndUpdate(projectId, {
        'verification.npm': {
          packageName,
          username: npmUsername,
          status: 'verified',
          verifiedAt: new Date()
        },
        'verifiedSource': 'npm'
      });
      
      res.json({
        success: true,
        message: 'NPM package ownership verified',
        package: {
          name: packageData.name,
          version: packageData['dist-tags']?.latest,
          description: packageData.description
        }
      });
    } else {
      res.status(403).json({ 
        error: 'You are not listed as a maintainer of this package',
        npmUsername,
        maintainers: maintainers.map(m => m.name)
      });
    }
    
  } catch (error) {
    if (error.response?.status === 404) {
      res.status(404).json({ error: 'NPM package not found' });
    } else {
      console.error('NPM verification error:', error);
      res.status(500).json({ error: 'Failed to verify NPM package' });
    }
  }
});

// Code signature verification (for compiled apps)
router.post('/signature/verify', authenticateToken, async (req, res) => {
  try {
    const { projectId, platform, signature } = req.body;
    
    // This would integrate with platform-specific verification:
    // - Apple: Verify Developer ID
    // - Google: Verify Play Store signature
    // - Microsoft: Verify Authenticode
    
    // For now, we'll create a placeholder
    res.json({
      success: false,
      message: 'Code signature verification coming soon',
      supportedPlatforms: ['apple', 'google', 'microsoft']
    });
    
  } catch (error) {
    console.error('Signature verification error:', error);
    res.status(500).json({ error: 'Failed to verify code signature' });
  }
});

// Meta tag verification (for web apps)
router.post('/metatag/generate', authenticateToken, async (req, res) => {
  try {
    const { projectId, websiteUrl } = req.body;
    
    // Validate URL
    try {
      new URL(websiteUrl);
    } catch {
      return res.status(400).json({ error: 'Invalid website URL' });
    }
    
    const verificationToken = crypto.randomBytes(16).toString('hex');
    const metaTag = `<meta name="packcode-verification" content="${verificationToken}" />`;
    
    await Project.findByIdAndUpdate(projectId, {
      'verification.metatag': {
        url: websiteUrl,
        token: verificationToken,
        status: 'pending',
        createdAt: new Date()
      }
    });
    
    res.json({
      success: true,
      instructions: {
        step1: 'Add this meta tag to your website\'s <head> section:',
        metaTag,
        step2: 'Deploy the change to your live website',
        step3: 'Click verify once the tag is live'
      },
      metaTag,
      verificationToken
    });
    
  } catch (error) {
    console.error('Generate meta tag error:', error);
    res.status(500).json({ error: 'Failed to generate verification tag' });
  }
});

// Verify meta tag
router.post('/metatag/verify', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.body;
    
    const project = await Project.findById(projectId);
    if (!project || !project.verification?.metatag) {
      return res.status(404).json({ error: 'No pending meta tag verification found' });
    }
    
    const { url, token } = project.verification.metatag;
    
    try {
      // Fetch the website
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'PackCode-Verification-Bot/1.0'
        }
      });
      
      // Look for the meta tag in the HTML
      const metaTagRegex = new RegExp(`<meta[^>]*name=["']packcode-verification["'][^>]*content=["']${token}["'][^>]*>`, 'i');
      
      if (metaTagRegex.test(response.data)) {
        await Project.findByIdAndUpdate(projectId, {
          'verification.metatag.status': 'verified',
          'verification.metatag.verifiedAt': new Date(),
          'verifiedSource': 'website'
        });
        
        res.json({
          success: true,
          message: 'Website ownership verified successfully',
          website: url
        });
      } else {
        res.status(400).json({ 
          error: 'Verification meta tag not found',
          tip: 'Make sure the meta tag is in the <head> section and the page is publicly accessible'
        });
      }
      
    } catch (fetchError) {
      res.status(400).json({ 
        error: 'Could not fetch website',
        url,
        tip: 'Make sure the website is publicly accessible'
      });
    }
    
  } catch (error) {
    console.error('Meta tag verification error:', error);
    res.status(500).json({ error: 'Failed to verify website' });
  }
});

module.exports = router;