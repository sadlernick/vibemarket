const express = require('express');
const axios = require('axios');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Enhanced AI content generation with GitHub repo analysis
router.post('/analyze-repository', authenticateToken, async (req, res) => {
  try {
    console.log('=== AI ANALYZE-REPOSITORY REQUEST ===');
    console.log('Request body:', req.body);
    console.log('User ID:', req.user?._id);
    
    const { repositoryUrl, fullName } = req.body;
    const user = await User.findById(req.user._id);

    console.log('User found:', !!user);
    console.log('Has GitHub profile:', !!user?.githubProfile);
    console.log('Has GitHub token:', !!user?.githubProfile?.accessToken);

    // Parse repository info
    let owner, repo;
    if (fullName) {
      [owner, repo] = fullName.split('/');
    } else if (repositoryUrl) {
      const repoMatch = repositoryUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!repoMatch) {
        return res.status(400).json({ error: 'Invalid GitHub repository URL' });
      }
      [, owner, repo] = repoMatch;
      repo = repo.replace(/\.git$/, '');
    } else {
      return res.status(400).json({ error: 'Repository URL or fullName is required' });
    }
    
    console.log('Repository to analyze:', { owner, repo });

    let repoData;
    
    // Add overall timeout for serverless functions
    const fetchWithTimeout = async () => {
      // Try to fetch repository data with GitHub token if available
      if (user.githubProfile?.accessToken) {
        try {
          repoData = await fetchRepositoryData(user.githubProfile.accessToken, owner, repo);
        } catch (githubError) {
          console.warn('GitHub API failed, falling back to public analysis:', githubError.message);
          // Fall back to public repository analysis
          repoData = await fetchPublicRepositoryData(owner, repo);
        }
      } else {
        // User has no GitHub account connected, use public data only
        console.log('No GitHub token, using public repository analysis');
        repoData = await fetchPublicRepositoryData(owner, repo);
      }
      return repoData;
    };
    
    // Timeout after 10 seconds total for serverless
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Repository analysis timed out')), 10000);
    });
    
    repoData = await Promise.race([fetchWithTimeout(), timeoutPromise]);
    
    // Analyze and generate project details
    let analysis;
    try {
      analysis = await analyzeRepository(repoData);
    } catch (analysisError) {
      console.error('Analysis failed, using fallback:', analysisError.message);
      // Use fallback analysis
      analysis = {
        title: repoData.basic.name.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: repoData.basic.description || `A ${repoData.basic.language || 'code'} project that provides innovative solutions. This repository contains well-structured code with modern development practices.`,
        category: 'web',
        tags: [repoData.basic.language, 'open-source', 'development'].filter(Boolean).slice(0, 5),
        features: ['Core functionality', 'Well documented', 'Easy to integrate'],
        techStack: [repoData.basic.language].filter(Boolean),
        suggestedPrice: 0
      };
    }
    
    res.json({
      success: true,
      repository: repoData.basic,
      analysis: {
        title: analysis.title,
        description: analysis.description,
        category: analysis.category,
        tags: analysis.tags,
        features: analysis.features,
        techStack: analysis.techStack,
        suggestedPrice: analysis.suggestedPrice
      }
    });
  } catch (error) {
    console.error('Repository analysis error:', error.response?.data || error.message);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      response: error.response?.data,
      fullName: req.body.fullName,
      repositoryUrl: req.body.repositoryUrl
    });
    
    // Return a more specific error message
    if (error.message.includes('Not Found')) {
      res.status(404).json({ error: 'Repository not found or not accessible' });
    } else if (error.message.includes('rate limit')) {
      res.status(429).json({ error: 'GitHub API rate limit exceeded. Please try again later.' });
    } else {
      res.status(500).json({ 
        error: 'Failed to analyze repository', 
        details: error.message,
        errorType: error.name
      });
    }
  }
});

// Simple AI content generation using basic templates
// This can be enhanced with actual AI APIs later
router.post('/generate-description', authenticateToken, async (req, res) => {
  try {
    const { title, category, tags, repositoryUrl } = req.body;

    if (!title || !category) {
      return res.status(400).json({ error: 'Title and category are required' });
    }

    // For now, we'll create a template-based description
    // TODO: Integrate with OpenAI API using environment variable
    const description = generateTemplateDescription(title, category, tags, repositoryUrl);
    
    res.json({
      description,
      suggestedTags: generateSuggestedTags(category, tags),
      suggestedFeatures: generateSuggestedFeatures(category)
    });
  } catch (error) {
    console.error('AI generation error:', error);
    res.status(500).json({ error: 'Failed to generate content' });
  }
});

function generateTemplateDescription(title, category, tags = [], repositoryUrl) {
  const tagList = tags.length > 0 ? tags.join(', ') : '';
  
  const templates = {
    web: `**${title}** is a modern web application that showcases cutting-edge development practices. Built with ${tagList || 'modern web technologies'}, this project demonstrates professional-grade architecture and user experience design.

🚀 **Key Features:**
- Responsive and intuitive user interface
- Modern development stack and best practices
- Scalable architecture for future growth
- Cross-browser compatibility

🛠️ **Technical Highlights:**
- Clean, maintainable codebase
- Comprehensive documentation
- Production-ready deployment
- Industry-standard security practices

Perfect for developers looking to learn from real-world implementations or businesses seeking proven solutions.`,

    mobile: `**${title}** is a sophisticated mobile application delivering exceptional user experience across all devices. Leveraging ${tagList || 'modern mobile technologies'}, this project represents the pinnacle of mobile development excellence.

📱 **Core Features:**
- Native performance and smooth animations
- Offline functionality and data sync
- Push notifications and real-time updates
- Optimized for all screen sizes

⚡ **Technical Excellence:**
- Memory-efficient architecture
- Battery-optimized performance
- Secure data handling
- App store ready deployment

Ideal for developers seeking mobile development inspiration or organizations needing robust mobile solutions.`,

    desktop: `**${title}** is a powerful desktop application combining functionality with elegant design. Built using ${tagList || 'modern desktop technologies'}, this project delivers the performance and features users expect from professional software.

💻 **Key Capabilities:**
- High-performance native functionality
- Intuitive desktop user interface
- Multi-platform compatibility
- Advanced feature integration

🔧 **Technical Features:**
- Optimized system resource usage
- Robust error handling and logging
- Secure local data management
- Professional packaging and distribution

Perfect for developers building desktop solutions or businesses requiring reliable software tools.`,

    api: `**${title}** is a robust API service providing reliable backend functionality. Engineered with ${tagList || 'modern backend technologies'}, this project offers scalable, secure, and well-documented API endpoints.

🌐 **API Features:**
- RESTful design principles
- Comprehensive endpoint coverage
- Authentication and authorization
- Rate limiting and monitoring

🔒 **Enterprise-Grade:**
- Scalable microservice architecture
- Comprehensive error handling
- Extensive API documentation
- Production monitoring and logging

Essential for developers building API integrations or businesses requiring reliable backend services.`,

    library: `**${title}** is a well-crafted library providing essential functionality for developers. Built with ${tagList || 'modern development practices'}, this library offers clean APIs, comprehensive documentation, and reliable performance.

📚 **Library Benefits:**
- Clean and intuitive API design
- Extensive unit test coverage
- TypeScript support and type definitions
- Zero external dependencies (where possible)

✨ **Developer Experience:**
- Comprehensive documentation with examples
- Easy integration and setup
- Regular updates and maintenance
- Active community support

Perfect for developers seeking reliable components or teams looking to accelerate development.`,

    tool: `**${title}** is an innovative developer tool designed to enhance productivity and streamline workflows. Crafted with ${tagList || 'developer-focused technologies'}, this tool addresses real-world development challenges.

🛠️ **Tool Features:**
- Intuitive command-line interface
- Powerful automation capabilities
- Extensible plugin architecture
- Cross-platform compatibility

⚡ **Productivity Boost:**
- Reduces manual development tasks
- Integrates with popular development tools
- Customizable configuration options
- Detailed usage documentation

Ideal for development teams seeking efficiency improvements or individual developers optimizing their workflow.`,

    game: `**${title}** is an engaging game that showcases interactive entertainment development. Created with ${tagList || 'game development technologies'}, this project demonstrates creative programming and engaging user experience design.

🎮 **Game Features:**
- Immersive gameplay mechanics
- High-quality graphics and animations
- Responsive controls and interaction
- Engaging progression system

🎨 **Technical Artistry:**
- Optimized rendering performance
- Smooth animation systems
- Audio integration and effects
- Cross-platform deployment

Perfect for game developers seeking inspiration or studios looking for proven gaming solutions.`,

    other: `**${title}** is an innovative project that pushes the boundaries of ${category} development. Utilizing ${tagList || 'cutting-edge technologies'}, this project represents creative problem-solving and technical excellence.

✨ **Project Highlights:**
- Unique approach to common challenges
- Clean and maintainable architecture
- Comprehensive feature implementation
- Professional documentation

🚀 **Innovation Focus:**
- Creative technical solutions
- User-centered design principles
- Scalable and extensible codebase
- Industry best practices

Excellent for developers exploring new approaches or organizations seeking innovative technical solutions.`
  };

  return templates[category] || templates.other;
}

function generateSuggestedTags(category, existingTags = []) {
  const categoryTags = {
    web: ['react', 'vue', 'angular', 'javascript', 'typescript', 'css', 'html', 'nodejs', 'express', 'nextjs'],
    mobile: ['react-native', 'flutter', 'ios', 'android', 'swift', 'kotlin', 'xamarin', 'ionic'],
    desktop: ['electron', 'tauri', 'qt', 'wpf', 'javafx', 'tkinter', 'gtk', 'native'],
    api: ['rest', 'graphql', 'nodejs', 'python', 'java', 'go', 'rust', 'microservices', 'docker'],
    library: ['npm', 'pip', 'gem', 'package', 'component', 'utility', 'framework', 'sdk'],
    tool: ['cli', 'automation', 'productivity', 'development', 'build', 'deployment', 'testing'],
    game: ['unity', 'unreal', 'godot', 'pygame', 'phaser', '2d', '3d', 'multiplayer'],
    other: ['innovative', 'unique', 'creative', 'experimental', 'proof-of-concept']
  };

  const suggestions = categoryTags[category] || categoryTags.other;
  return suggestions.filter(tag => !existingTags.includes(tag)).slice(0, 5);
}

function generateSuggestedFeatures(category) {
  const features = {
    web: {
      free: ['View source code', 'Basic documentation', 'MIT license for personal use'],
      paid: ['Commercial license', 'Priority support', 'Custom integrations', 'White-label rights', 'Professional deployment guide']
    },
    mobile: {
      free: ['Source code access', 'Basic setup guide', 'Personal use license'],
      paid: ['App store publishing rights', 'Custom branding', 'Premium support', 'Backend integration guide']
    },
    desktop: {
      free: ['Application source', 'Build instructions', 'Personal license'],
      paid: ['Commercial distribution rights', 'Custom modifications', 'Enterprise support', 'Installer packages']
    },
    api: {
      free: ['API documentation', 'Basic endpoints', 'Development license'],
      paid: ['Production deployment', 'Custom endpoints', 'SLA support', 'Monitoring tools']
    },
    library: {
      free: ['Library source code', 'Basic examples', 'Open source license'],
      paid: ['Commercial license', 'Extended examples', 'Priority issue resolution', 'Custom modifications']
    },
    tool: {
      free: ['Tool source code', 'Usage documentation', 'Personal license'],
      paid: ['Commercial usage rights', 'Priority support', 'Custom features', 'Enterprise deployment']
    },
    game: {
      free: ['Game source', 'Asset files', 'Personal use license'],
      paid: ['Commercial rights', 'Custom modifications', 'Additional assets', 'Publishing support']
    },
    other: {
      free: ['Source code access', 'Documentation', 'Basic license'],
      paid: ['Commercial license', 'Professional support', 'Customization', 'Extended features']
    }
  };

  return features[category] || features.other;
}

// Fetch repository data using public GitHub API (no authentication required)
async function fetchPublicRepositoryData(owner, repo) {
  try {
    console.log(`Fetching public repository data for ${owner}/${repo}`);
    
    // Get basic repository info from public API with shorter timeout for serverless
    const repoResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
      timeout: 5000, // 5 second timeout for serverless
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    const repoInfo = repoResponse.data;

    // Get public README content
    let readmeContent = '';
    try {
      const readmeResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}/readme`, {
        timeout: 3000, // Shorter timeout for README
        headers: {
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      readmeContent = Buffer.from(readmeResponse.data.content, 'base64').toString('utf-8');
    } catch (err) {
      console.log('No README found or accessible:', err.message);
    }

    // Get package.json content if public (skip in serverless for speed)
    let packageJson = null;
    if (process.env.NODE_ENV !== 'production') {
      try {
        const packageResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents/package.json`, {
          timeout: 3000
        });
        const packageContent = Buffer.from(packageResponse.data.content, 'base64').toString('utf-8');
        packageJson = JSON.parse(packageContent);
      } catch (err) {
        console.log('No package.json found or accessible');
      }
    }

    // Get repository file structure (skip in serverless for speed)
    let fileStructure = [];
    if (process.env.NODE_ENV !== 'production') {
      try {
        const contentsResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents`, {
          timeout: 3000
        });
        fileStructure = contentsResponse.data.map(item => ({
          name: item.name,
          type: item.type,
          size: item.size
        }));
      } catch (err) {
        console.log('Could not fetch file structure');
      }
    }

    // Get languages used
    let languages = {};
    try {
      const languagesResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}/languages`, {
        timeout: 3000
      });
      languages = languagesResponse.data;
    } catch (err) {
      console.log('Could not fetch languages');
    }

    return {
      basic: {
        id: repoInfo.id,
        fullName: repoInfo.full_name,
        name: repoInfo.name,
        description: repoInfo.description,
        language: repoInfo.language,
        stars: repoInfo.stargazers_count,
        forks: repoInfo.forks_count,
        topics: repoInfo.topics || [],
        license: repoInfo.license?.name || null,
        defaultBranch: repoInfo.default_branch,
        updatedAt: repoInfo.updated_at,
        createdAt: repoInfo.created_at,
        htmlUrl: repoInfo.html_url
      },
      content: {
        readme: readmeContent,
        packageJson,
        fileStructure,
        languages
      }
    };
  } catch (error) {
    throw new Error(`Failed to fetch public repository data: ${error.message}`);
  }
}

// Fetch comprehensive repository data from GitHub API
async function fetchRepositoryData(accessToken, owner, repo) {
  const headers = {
    'Authorization': `token ${accessToken}`,
    'Accept': 'application/vnd.github.v3+json'
  };

  try {
    // Get basic repository info
    const repoResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    const repoInfo = repoResponse.data;

    // Get README content
    let readmeContent = '';
    try {
      const readmeResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}/readme`, { headers });
      readmeContent = Buffer.from(readmeResponse.data.content, 'base64').toString('utf-8');
    } catch (err) {
      console.log('No README found or accessible');
    }

    // Get package.json content (if exists)
    let packageJson = null;
    try {
      const packageResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents/package.json`, { headers });
      const packageContent = Buffer.from(packageResponse.data.content, 'base64').toString('utf-8');
      packageJson = JSON.parse(packageContent);
    } catch (err) {
      console.log('No package.json found');
    }

    // Get repository file structure (top level)
    let fileStructure = [];
    try {
      const contentsResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents`, { headers });
      fileStructure = contentsResponse.data.map(item => ({
        name: item.name,
        type: item.type,
        size: item.size
      }));
    } catch (err) {
      console.log('Could not fetch file structure');
    }

    // Get languages used
    let languages = {};
    try {
      const languagesResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}/languages`, { headers });
      languages = languagesResponse.data;
    } catch (err) {
      console.log('Could not fetch languages');
    }

    return {
      basic: {
        id: repoInfo.id,
        fullName: repoInfo.full_name,
        name: repoInfo.name,
        description: repoInfo.description,
        language: repoInfo.language,
        stars: repoInfo.stargazers_count,
        forks: repoInfo.forks_count,
        topics: repoInfo.topics || [],
        license: repoInfo.license?.name || null,
        defaultBranch: repoInfo.default_branch,
        updatedAt: repoInfo.updated_at,
        createdAt: repoInfo.created_at,
        htmlUrl: repoInfo.html_url
      },
      content: {
        readme: readmeContent,
        packageJson,
        fileStructure,
        languages
      }
    };
  } catch (error) {
    throw new Error(`Failed to fetch repository data: ${error.message}`);
  }
}

// Analyze repository data and generate project details
async function analyzeRepository(repoData) {
  if (!repoData || !repoData.basic) {
    throw new Error('Invalid repository data');
  }
  
  const { basic, content } = repoData;
  
  // Generate title (clean up repo name)
  const title = (basic.name || 'Unknown Project')
    .split(/[-_]/) // Split on hyphens and underscores
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  // Determine category based on languages, files, and dependencies
  const category = determineCategory(basic, content);
  
  // Extract tags from topics, languages, and dependencies
  const tags = extractTags(basic, content);
  
  // Generate tech stack summary
  const techStack = generateTechStack(content);
  
  // Generate description based on README and repository info
  const description = generateSmartDescription(basic, content, category, techStack);
  
  // Generate features based on README and code analysis
  const features = extractFeatures(content, category);
  
  // Suggest price based on complexity and features
  const suggestedPrice = suggestPrice(basic, content, features);

  return {
    title,
    description,
    category,
    tags,
    features,
    techStack,
    suggestedPrice
  };
}

// Determine project category based on repository analysis
function determineCategory(basic, content) {
  const languages = content?.languages || {};
  const packageJson = content?.packageJson || {};
  const fileStructure = content?.fileStructure || [];
  const topics = basic?.topics || [];
  
  // Check for mobile development
  if (topics.includes('react-native') || topics.includes('flutter') || topics.includes('ios') || topics.includes('android')) {
    return 'mobile';
  }
  
  // Check for game development
  if (topics.includes('game') || topics.includes('unity') || topics.includes('gamedev') || 
      fileStructure.some(f => f.name.toLowerCase().includes('game'))) {
    return 'game';
  }
  
  // Check for desktop apps
  if (topics.includes('electron') || topics.includes('desktop') || topics.includes('tauri') ||
      packageJson?.dependencies?.electron || packageJson?.devDependencies?.electron) {
    return 'desktop';
  }
  
  // Check for libraries/packages
  if (packageJson?.main || topics.includes('library') || topics.includes('package') || topics.includes('npm')) {
    return 'library';
  }
  
  // Check for CLI tools
  if (packageJson?.bin || topics.includes('cli') || topics.includes('tool') ||
      fileStructure.some(f => f.name === 'bin' && f.type === 'dir')) {
    return 'tool';
  }
  
  // Check for APIs/backends
  if (topics.includes('api') || topics.includes('backend') || topics.includes('server') ||
      packageJson?.dependencies?.express || packageJson?.dependencies?.fastify || 
      packageJson?.dependencies?.koa || languages?.Go || languages?.Python) {
    return 'api';
  }
  
  // Default to web if has web frameworks
  if (packageJson?.dependencies?.react || packageJson?.dependencies?.vue || 
      packageJson?.dependencies?.angular || languages?.JavaScript || languages?.TypeScript) {
    return 'web';
  }
  
  return 'other';
}

// Extract relevant tags from repository data
function extractTags(basic, content) {
  const tags = new Set();
  
  // Add topics
  if (basic?.topics) {
    basic.topics.forEach(topic => tags.add(topic));
  }
  
  // Add primary language
  if (basic.language) {
    tags.add(basic.language.toLowerCase());
  }
  
  // Add languages from languages API
  Object.keys(content.languages || {}).forEach(lang => {
    tags.add(lang.toLowerCase());
  });
  
  // Add framework/library tags from package.json
  if (content.packageJson) {
    const deps = { ...content.packageJson.dependencies, ...content.packageJson.devDependencies };
    Object.keys(deps || {}).forEach(dep => {
      // Add popular frameworks
      if (['react', 'vue', 'angular', 'express', 'next', 'nuxt', 'gatsby', 'svelte'].includes(dep)) {
        tags.add(dep);
      }
    });
  }
  
  return Array.from(tags).slice(0, 10); // Limit to 10 tags
}

// Generate tech stack summary
function generateTechStack(content) {
  const stack = [];
  
  // Primary languages
  const languages = Object.keys(content.languages || {});
  if (languages.length > 0) {
    stack.push(`Languages: ${languages.slice(0, 3).join(', ')}`);
  }
  
  // Frameworks from package.json
  if (content.packageJson) {
    const deps = { ...content.packageJson.dependencies, ...content.packageJson.devDependencies };
    const frameworks = Object.keys(deps || {}).filter(dep => 
      ['react', 'vue', 'angular', 'express', 'next', 'nuxt', 'gatsby', 'svelte', 'fastify', 'koa'].includes(dep)
    );
    if (frameworks.length > 0) {
      stack.push(`Frameworks: ${frameworks.slice(0, 3).join(', ')}`);
    }
  }
  
  return stack.join(' • ');
}

// Generate smart description based on repository analysis
function generateSmartDescription(basic, content, category, techStack) {
  let description = '';
  
  // Start with repository description if available
  if (basic.description) {
    description += `${basic.description}\n\n`;
  }
  
  // Extract key information from README
  if (content.readme) {
    const readme = content.readme;
    
    // Look for description sections
    const descMatch = readme.match(/##?\s*(Description|About|Overview)[\s\S]*?(?=##|$)/i);
    if (descMatch) {
      const desc = descMatch[0].replace(/##?\s*(Description|About|Overview)/i, '').trim();
      if (desc && desc.length < 500) {
        description += desc + '\n\n';
      }
    }
    
    // Look for features section
    const featuresMatch = readme.match(/##?\s*Features[\s\S]*?(?=##|$)/i);
    if (featuresMatch) {
      description += '🚀 **Key Features:**\n';
      const features = featuresMatch[0].replace(/##?\s*Features/i, '').trim();
      description += features + '\n\n';
    }
  }
  
  // Add tech stack information
  if (techStack) {
    description += `🛠️ **Tech Stack:** ${techStack}\n\n`;
  }
  
  // Add repository stats
  if (basic.stars > 0 || basic.forks > 0) {
    description += `⭐ ${basic.stars} stars • 🍴 ${basic.forks} forks\n\n`;
  }
  
  // Fallback to template if description is too short
  if (description.length < 200) {
    const templateDesc = generateTemplateDescription(
      basic.name, 
      category, 
      Object.keys(content.languages || {}), 
      basic.htmlUrl
    );
    description = templateDesc;
  }
  
  return description.trim();
}

// Extract features from README and code analysis
function extractFeatures(content, category) {
  const freeFeatures = [];
  const paidFeatures = [];
  
  // Basic features for all projects
  freeFeatures.push('View source code', 'Basic documentation', 'Personal use license');
  
  // Add category-specific features
  const categoryFeatures = generateSuggestedFeatures(category);
  freeFeatures.push(...categoryFeatures.free.slice(3)); // Skip duplicates
  paidFeatures.push(...categoryFeatures.paid);
  
  // Extract features from README
  if (content.readme) {
    const readme = content.readme;
    const featuresMatch = readme.match(/##?\s*Features[\s\S]*?(?=##|$)/i);
    if (featuresMatch) {
      const features = featuresMatch[0]
        .replace(/##?\s*Features/i, '')
        .split('\n')
        .filter(line => line.trim() && (line.includes('*') || line.includes('-')))
        .map(line => line.replace(/^[\s\-\*]+/, '').trim())
        .filter(line => line.length > 0 && line.length < 100);
      
      // Add unique features to free tier
      features.forEach(feature => {
        if (!freeFeatures.some(f => f.toLowerCase().includes(feature.toLowerCase().substring(0, 10)))) {
          freeFeatures.push(feature);
        }
      });
    }
  }
  
  return {
    freeFeatures: freeFeatures.slice(0, 8), // Limit to 8 features
    paidFeatures: paidFeatures.slice(0, 8)
  };
}

// Suggest price based on repository complexity
function suggestPrice(basic, content, features) {
  let basePrice = 10; // Base price
  
  // Increase price based on stars (popularity)
  if (basic.stars > 100) basePrice += 20;
  else if (basic.stars > 50) basePrice += 10;
  else if (basic.stars > 10) basePrice += 5;
  
  // Increase price based on code complexity (languages)
  const languageCount = Object.keys(content.languages || {}).length;
  basePrice += languageCount * 5;
  
  // Increase price based on feature count
  const totalFeatures = (features.freeFeatures?.length || 0) + (features.paidFeatures?.length || 0);
  basePrice += Math.min(totalFeatures * 2, 20);
  
  // Increase price if has comprehensive documentation
  if (content.readme && content.readme.length > 1000) {
    basePrice += 10;
  }
  
  // Round to nearest 5
  return Math.max(15, Math.round(basePrice / 5) * 5);
}

module.exports = router;