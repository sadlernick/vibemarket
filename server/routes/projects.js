const express = require('express');
const Project = require('../models/Project');
const License = require('../models/License');
const Review = require('../models/Review');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const githubValidator = require('../services/githubValidator');
const OpenAI = require('openai');

const router = express.Router();

// Initialize OpenAI only if API key is available and valid
let openai = null;
const isValidOpenAIKey = process.env.OPENAI_API_KEY && 
                        process.env.OPENAI_API_KEY !== 'dummy' && 
                        !process.env.OPENAI_API_KEY.includes('dummy') &&
                        process.env.OPENAI_API_KEY.startsWith('sk-');

if (isValidOpenAIKey) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

// AI Generate endpoint
router.post('/ai-generate', authenticateToken, async (req, res) => {
  try {
    console.log('AI Generate request:', { projectName: req.body.projectName, description: req.body.description?.substring(0, 50) });
    const { projectName, description } = req.body;

    if (!projectName || !description) {
      return res.status(400).json({ error: 'Project name and description are required' });
    }

    // Check if OpenAI API key is available and valid
    const isValidKey = process.env.OPENAI_API_KEY && 
                      process.env.OPENAI_API_KEY !== 'dummy' && 
                      !process.env.OPENAI_API_KEY.includes('dummy') &&
                      process.env.OPENAI_API_KEY.startsWith('sk-');
    
    console.log('OpenAI API Key status:', {
      hasKey: !!process.env.OPENAI_API_KEY,
      keyPrefix: process.env.OPENAI_API_KEY?.substring(0, 10) + '...',
      isDummy: process.env.OPENAI_API_KEY?.includes('dummy'),
      isValid: isValidKey
    });
    
    if (!isValidKey) {
      // Return a mock AI-generated response
      console.log('Using mock AI response - invalid or missing API key');
      const mockResponse = generateMockAIResponse(projectName, description);
      return res.json(mockResponse);
    }

    const prompt = `Generate a comprehensive project listing for a marketplace. The project is called "${projectName}" and has this description: "${description}".

Please return a JSON object with the following structure:
{
  "title": "Enhanced project title",
  "description": "Detailed description (2-3 paragraphs)",
  "tags": ["array", "of", "relevant", "tags"],
  "category": "one of: web, mobile, desktop, api, library, tool, game, other",
  "tech_stack": ["array", "of", "technologies"],
  "freeRepositoryUrl": "https://github.com/example/project-free",
  "paidRepositoryUrl": "https://github.com/example/project-pro",
  "features": {
    "freeFeatures": ["array", "of", "free", "features"],
    "paidFeatures": ["array", "of", "premium", "features"]
  }
}

Make the content professional, engaging, and marketplace-ready. Generate realistic GitHub URLs with the pattern https://github.com/username/reponame.`;

    console.log('OpenAI client status:', { hasOpenaiClient: !!openai });
    
    if (!openai) {
      console.log('OpenAI client is null, returning service unavailable');
      return res.status(503).json({ 
        error: 'AI service unavailable', 
        message: 'OpenAI API key not configured' 
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system", 
          content: "You are a helpful assistant that generates professional project listings for a software marketplace. Always respond with valid JSON only."
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const aiResponse = completion.choices[0].message.content;
    
    try {
      const generatedData = JSON.parse(aiResponse);
      res.json(generatedData);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      res.status(500).json({ error: 'Failed to parse AI response' });
    }

  } catch (error) {
    console.error('AI Generate error:', error.message);
    console.error('AI Generate error stack:', error.stack);
    console.error('AI Generate error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      response: error.response?.data
    });
    res.status(500).json({ 
      error: 'Failed to generate content',
      details: error.message,
      errorType: error.name
    });
  }
});

// Helper function to generate mock AI responses
function generateMockAIResponse(projectName, description) {
  // Generate realistic mock data based on input
  const categories = ['web', 'mobile', 'api', 'library', 'tool'];
  const category = categories[Math.floor(Math.random() * categories.length)];
  
  const techStacks = {
    web: ['React', 'Node.js', 'TypeScript', 'Tailwind CSS', 'PostgreSQL'],
    mobile: ['React Native', 'Redux', 'Firebase', 'Expo', 'TypeScript'],
    api: ['Node.js', 'Express', 'MongoDB', 'JWT', 'Redis'],
    library: ['TypeScript', 'Jest', 'Rollup', 'npm', 'GitHub Actions'],
    tool: ['Node.js', 'Commander.js', 'Chalk', 'Inquirer', 'TypeScript']
  };

  const tags = techStacks[category] || ['javascript', 'typescript', 'opensource'];
  
  return {
    title: `${projectName} - Professional ${category === 'api' ? 'API' : category.charAt(0).toUpperCase() + category.slice(1)} Solution`,
    description: `${description}\n\nThis ${category} solution provides a comprehensive implementation with modern best practices, clean architecture, and extensive documentation. Built with performance and scalability in mind, it includes automated testing, CI/CD pipelines, and detailed setup instructions.\n\nPerfect for developers looking to accelerate their development process with a production-ready foundation that follows industry standards and includes all the essential features you need to get started quickly.`,
    tags: tags.slice(0, 5),
    category: category,
    tech_stack: tags,
    freeRepositoryUrl: `https://github.com/vibemarket/${projectName.toLowerCase().replace(/\s+/g, '-')}-free`,
    paidRepositoryUrl: `https://github.com/vibemarket/${projectName.toLowerCase().replace(/\s+/g, '-')}-pro`,
    features: {
      freeFeatures: [
        'Core functionality implementation',
        'Basic documentation',
        'MIT license for personal use',
        'Community support',
        'Basic examples and demos'
      ],
      paidFeatures: [
        'Full source code with advanced features',
        'Commercial license',
        'Priority support',
        'Advanced documentation and tutorials',
        'Regular updates and new features',
        'Custom branding options',
        'Integration examples',
        'Performance optimization guide'
      ]
    }
  };
}

// Save as draft endpoint
router.post('/draft', authenticateToken, async (req, res) => {
  try {
    const projectData = {
      ...req.body,
      author: req.user._id,
      status: 'draft',
      isActive: false
    };

    // For drafts, ensure we have at least minimal required fields
    if (!projectData.title) {
      projectData.title = 'Untitled Project';
    }
    if (!projectData.description) {
      projectData.description = 'No description provided';
    }
    if (!projectData.category) {
      projectData.category = 'other';
    }

    const project = new Project(projectData);
    await project.save();
    await project.populate('author', 'username profileImage reputation');

    res.status(201).json({
      message: 'Draft saved successfully',
      project
    });
  } catch (error) {
    console.error('Save draft error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ error: `Failed to save draft: ${error.message}` });
  }
});

// Get user's drafts
router.get('/drafts', authenticateToken, async (req, res) => {
  try {
    const drafts = await Project.find({
      author: req.user._id,
      status: 'draft'
    }).populate('author', 'username profileImage reputation')
      .sort({ updatedAt: -1 });

    res.json({ drafts });
  } catch (error) {
    console.error('Get drafts error:', error);
    res.status(500).json({ error: 'Failed to get drafts' });
  }
});

// Publish draft
router.post('/:id/publish', authenticateToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (project.status !== 'draft') {
      return res.status(400).json({ error: 'Project is not a draft' });
    }

    // Validate required fields for publishing
    const { title, description, category, repository, license } = project;
    
    if (!title || !description || !category) {
      return res.status(400).json({ error: 'Required fields missing: title, description, and category are required' });
    }

    // Validate repository URLs based on license type
    if (license?.type === 'free' && !repository?.freeUrl) {
      return res.status(400).json({ error: 'Free repository URL is required for free projects' });
    }
    if (license?.type === 'paid' && !repository?.paidUrl) {
      return res.status(400).json({ error: 'Paid repository URL is required for paid projects' });
    }
    if (license?.type === 'freemium' && (!repository?.freeUrl || !repository?.paidUrl)) {
      return res.status(400).json({ error: 'Both free and paid repository URLs are required for freemium projects' });
    }

    // Validate GitHub URLs
    const urlsToValidate = {};
    if (repository?.freeUrl) urlsToValidate.freeUrl = repository.freeUrl;
    if (repository?.paidUrl) urlsToValidate.paidUrl = repository.paidUrl;

    const validationResults = await githubValidator.validateMultipleRepositories(urlsToValidate);
    
    for (const [urlType, result] of Object.entries(validationResults)) {
      if (!result.valid && !result.empty) {
        return res.status(400).json({ 
          error: `Invalid GitHub URL (${urlType}): ${result.error}`,
          details: result.details 
        });
      }
    }

    project.status = 'published';
    project.isActive = true;
    await project.save();

    res.json({
      message: 'Project published successfully',
      project
    });
  } catch (error) {
    console.error('Publish project error:', error);
    res.status(500).json({ error: 'Failed to publish project' });
  }
});

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

// AI Search endpoint
router.post('/ai-search', optionalAuth, async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Get all published projects first
    const allProjects = await Project.find({ 
      isActive: true, 
      status: 'published' 
    }).populate('author', 'username profileImage reputation')
      .sort({ createdAt: -1 });

    if (allProjects.length === 0) {
      return res.json({ projects: [], searchSummary: 'No projects found in the marketplace.' });
    }

    // Check if OpenAI API key is available and valid  
    if (!isValidOpenAIKey) {
      // Use fallback semantic search
      const results = performSemanticSearch(query, allProjects);
      return res.json(results);
    }

    // Create a summary of available projects for the AI
    const projectSummaries = allProjects.map(project => ({
      id: project._id,
      title: project.title,
      description: project.description.substring(0, 200),
      category: project.category,
      tags: project.tags,
      tech_stack: project.tech_stack,
      license_type: project.license.type,
      price: project.license.price
    }));

    const aiPrompt = `You are a smart search assistant for a software marketplace. A user is looking for: "${query}"

Here are the available projects in JSON format:
${JSON.stringify(projectSummaries, null, 2)}

Please analyze the user's query and return a JSON response with:
{
  "relevantProjects": ["array of project IDs that best match the query, in order of relevance"],
  "searchSummary": "A brief explanation of what you found and why these projects match"
}

Consider:
- Semantic similarity (not just keyword matching)
- User intent (what they're trying to build/find)
- Technology stack matches
- Category relevance
- License type preferences
- Functionality overlap

Return only the JSON response.`;

    if (!openai) {
      return res.status(503).json({ 
        error: 'AI service unavailable', 
        message: 'OpenAI API key not configured' 
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful search assistant that analyzes user queries and matches them with relevant software projects. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: aiPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500
    });

    const aiResponse = completion.choices[0].message.content;
    
    try {
      const searchResults = JSON.parse(aiResponse);
      
      // Get the actual project objects for the relevant IDs
      const relevantProjects = searchResults.relevantProjects
        .map(id => allProjects.find(p => p._id.toString() === id))
        .filter(Boolean)
        .slice(0, 12); // Limit to 12 results

      res.json({
        projects: relevantProjects,
        searchSummary: searchResults.searchSummary,
        totalFound: relevantProjects.length
      });

    } catch (parseError) {
      console.error('Failed to parse AI search response:', parseError);
      // Fallback to simple text search
      const fallbackResults = allProjects.filter(project => 
        project.title.toLowerCase().includes(query.toLowerCase()) ||
        project.description.toLowerCase().includes(query.toLowerCase()) ||
        project.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      ).slice(0, 12);

      res.json({
        projects: fallbackResults,
        searchSummary: `Found ${fallbackResults.length} projects matching "${query}"`,
        totalFound: fallbackResults.length
      });
    }

  } catch (error) {
    console.error('AI Search error:', error);
    res.status(500).json({ error: 'Search failed' });
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

    const query = { isActive: true, status: 'published' };

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
    console.log('=== PROJECT GET REQUEST ===');
    console.log('Getting project:', req.params.id);
    console.log('Request URL:', req.url);
    console.log('User authenticated:', !!req.user);
    console.log('User ID:', req.user?._id);
    console.log('Auth header:', req.headers.authorization);
    
    // Validate MongoDB ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const project = await Project.findById(req.params.id)
      .populate('author', 'username profileImage reputation githubProfile website');

    console.log('Project found:', !!project);
    console.log('Project status:', project?.status);
    console.log('Project isActive:', project?.isActive);
    console.log('Project author:', project?.author._id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Allow access to drafts only for the author
    if (!project.isActive && project.status === 'draft') {
      console.log('This is an inactive draft');
      if (!req.user || project.author._id.toString() !== req.user._id.toString()) {
        console.log('Access denied - not author or not authenticated');
        return res.status(404).json({ error: 'Project not found' });
      }
      console.log('Access allowed - user is author');
    } else if (!project.isActive) {
      console.log('Project is inactive but not a draft');
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

// Semantic search fallback when AI is not available
function performSemanticSearch(query, projects) {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);
  
  // Score each project based on relevance
  const scoredProjects = projects.map(project => {
    let score = 0;
    
    // Title match (highest weight)
    const titleLower = project.title.toLowerCase();
    if (titleLower.includes(queryLower)) {
      score += 100;
    } else {
      queryWords.forEach(word => {
        if (titleLower.includes(word)) score += 30;
      });
    }
    
    // Description match
    const descLower = project.description.toLowerCase();
    if (descLower.includes(queryLower)) {
      score += 50;
    } else {
      queryWords.forEach(word => {
        if (descLower.includes(word)) score += 10;
      });
    }
    
    // Tags match
    project.tags.forEach(tag => {
      if (tag.toLowerCase().includes(queryLower)) {
        score += 40;
      } else {
        queryWords.forEach(word => {
          if (tag.toLowerCase().includes(word)) score += 15;
        });
      }
    });
    
    // Tech stack match
    if (project.tech_stack) {
      project.tech_stack.forEach(tech => {
        if (tech.toLowerCase().includes(queryLower)) {
          score += 35;
        } else {
          queryWords.forEach(word => {
            if (tech.toLowerCase().includes(word)) score += 12;
          });
        }
      });
    }
    
    // Category match
    if (project.category.toLowerCase().includes(queryLower)) {
      score += 25;
    }
    
    // Boost for popular projects
    score += Math.log(project.stats.views + 1) * 2;
    score += Math.log(project.stats.downloads + 1) * 3;
    score += project.stats.stars * 2;
    
    return { project, score };
  });
  
  // Sort by score and get top results
  const topResults = scoredProjects
    .sort((a, b) => b.score - a.score)
    .filter(item => item.score > 0)
    .slice(0, 12)
    .map(item => item.project);
  
  // Generate search summary
  let searchSummary = '';
  if (topResults.length === 0) {
    searchSummary = `No projects found matching "${query}". Try using different keywords or browse all projects.`;
  } else if (topResults.length === 1) {
    searchSummary = `Found 1 project matching "${query}".`;
  } else {
    searchSummary = `Found ${topResults.length} projects matching "${query}". Showing the most relevant results based on title, description, and technologies.`;
  }
  
  return {
    projects: topResults,
    searchSummary
  };
}

module.exports = router;