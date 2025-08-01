const express = require('express');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
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

// Get idea generator status endpoint
router.get('/idea-generator', optionalAuth, async (req, res) => {
  try {
    const isOpenAIAvailable = isValidOpenAIKey;
    
    res.json({
      status: 'available',
      aiEnabled: isOpenAIAvailable,
      message: isOpenAIAvailable ? 'AI-powered idea generation available' : 'Mock idea generation available',
      endpoint: '/api/tools/generate-ideas'
    });
  } catch (error) {
    console.error('Idea generator status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Generate project ideas endpoint
router.post('/generate-ideas', optionalAuth, async (req, res) => {
  try {
    const { skillLevel, interests, timeCommitment, goals } = req.body;

    // Check if OpenAI API key is available and valid
    if (!isValidOpenAIKey) {
      // Return mock ideas
      const mockIdeas = generateMockIdeas(skillLevel, interests, timeCommitment, goals);
      return res.json({ ideas: mockIdeas });
    }

    const prompt = `Generate 3 unique project ideas for a developer marketplace based on:
- Skill Level: ${skillLevel}
- Interests: ${interests.join(', ')}
- Time Available: ${timeCommitment}
- Goals: ${goals.join(', ')}

For each project, provide:
{
  "id": "unique-id",
  "title": "Project Name",
  "description": "2-3 sentence description",
  "category": "web|mobile|api|library|tool|game|design",
  "difficulty": "${skillLevel}",
  "estimatedTime": "realistic time estimate",
  "marketDemand": "low|medium|high|very-high",
  "estimatedPrice": { "min": number, "max": number },
  "requiredSkills": ["skill1", "skill2", ...],
  "suggestedFeatures": ["feature1", "feature2", ...],
  "monetizationTips": ["tip1", "tip2", ...],
  "similarProjectsCount": number,
  "trendingScore": number (0-100)
}

Return an array of 3 project ideas as JSON.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that generates realistic, marketable project ideas for developers. Always respond with valid JSON array only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 2000
    });

    const aiResponse = completion.choices[0].message.content;
    
    try {
      const ideas = JSON.parse(aiResponse);
      res.json({ ideas });
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback to mock ideas
      const mockIdeas = generateMockIdeas(skillLevel, interests, timeCommitment, goals);
      res.json({ ideas: mockIdeas });
    }

  } catch (error) {
    console.error('Generate ideas error:', error);
    // Fallback to mock ideas
    const { skillLevel, interests, timeCommitment, goals } = req.body;
    const mockIdeas = generateMockIdeas(skillLevel, interests, timeCommitment, goals);
    res.json({ ideas: mockIdeas });
  }
});

function generateMockIdeas(skillLevel, interests, timeCommitment, goals) {
  const baseIdeas = {
    web: [
      {
        id: '1',
        title: 'Modern Dashboard Template',
        description: 'A responsive admin dashboard with real-time analytics, customizable widgets, and dark mode. Perfect for SaaS applications and data visualization projects.',
        category: 'web',
        difficulty: skillLevel,
        estimatedTime: timeCommitment === 'weekend' ? '2-3 days' : '1 week',
        marketDemand: 'high',
        estimatedPrice: { min: 39, max: 99 },
        requiredSkills: ['React', 'TypeScript', 'Tailwind CSS', 'Chart.js'],
        suggestedFeatures: [
          'Real-time data updates',
          'Customizable widgets',
          'Dark/light theme toggle',
          'Responsive design',
          'Export functionality',
          'User role management'
        ],
        monetizationTips: [
          'Offer basic version with 5 dashboard layouts',
          'Premium version with unlimited customization',
          'Add-on packages for specific industries'
        ],
        similarProjectsCount: 67,
        trendingScore: 85
      },
      {
        id: '2',
        title: 'E-commerce Component Kit',
        description: 'Reusable e-commerce components including product cards, shopping cart, checkout flow, and payment integration. Built with modern best practices.',
        category: 'web',
        difficulty: 'intermediate',
        estimatedTime: '2 weeks',
        marketDemand: 'very-high',
        estimatedPrice: { min: 49, max: 149 },
        requiredSkills: ['React', 'Redux', 'Stripe API', 'CSS-in-JS'],
        suggestedFeatures: [
          'Product gallery with zoom',
          'Advanced filtering system',
          'Shopping cart with persistence',
          'Multi-step checkout',
          'Payment provider integration',
          'Order tracking'
        ],
        monetizationTips: [
          'Free version with basic components',
          'Pro version with payment integration',
          'Custom theme creation service'
        ],
        similarProjectsCount: 124,
        trendingScore: 92
      }
    ],
    mobile: [
      {
        id: '3',
        title: 'Fitness Tracking App Template',
        description: 'Cross-platform mobile app for fitness tracking with workout plans, progress charts, and social features. Includes health API integrations.',
        category: 'mobile',
        difficulty: skillLevel,
        estimatedTime: timeCommitment === 'weekend' ? '3-4 days' : '1-2 weeks',
        marketDemand: 'high',
        estimatedPrice: { min: 59, max: 129 },
        requiredSkills: ['React Native', 'Redux', 'Firebase', 'Health APIs'],
        suggestedFeatures: [
          'Workout tracking and plans',
          'Progress visualization',
          'Social challenges',
          'Nutrition logging',
          'Wearable device sync',
          'Offline mode'
        ],
        monetizationTips: [
          'Freemium model with basic tracking',
          'Premium plans and coaching',
          'White-label for gyms'
        ],
        similarProjectsCount: 89,
        trendingScore: 78
      }
    ],
    api: [
      {
        id: '4',
        title: 'Authentication Service API',
        description: 'Complete authentication API with JWT, OAuth, 2FA, and session management. Production-ready with rate limiting and security best practices.',
        category: 'api',
        difficulty: 'intermediate',
        estimatedTime: '1 week',
        marketDemand: 'very-high',
        estimatedPrice: { min: 29, max: 79 },
        requiredSkills: ['Node.js', 'Express', 'JWT', 'MongoDB', 'Redis'],
        suggestedFeatures: [
          'JWT authentication',
          'OAuth providers integration',
          'Two-factor authentication',
          'Password reset flow',
          'Rate limiting',
          'Session management'
        ],
        monetizationTips: [
          'Free tier with limited requests',
          'Paid tiers based on usage',
          'Enterprise support packages'
        ],
        similarProjectsCount: 156,
        trendingScore: 94
      }
    ],
    tool: [
      {
        id: '5',
        title: 'Code Documentation Generator',
        description: 'CLI tool that automatically generates beautiful documentation from your codebase. Supports multiple languages and output formats.',
        category: 'tool',
        difficulty: skillLevel,
        estimatedTime: '4-5 days',
        marketDemand: 'medium',
        estimatedPrice: { min: 19, max: 49 },
        requiredSkills: ['Node.js', 'TypeScript', 'Markdown', 'AST parsing'],
        suggestedFeatures: [
          'Multi-language support',
          'Custom themes',
          'API documentation',
          'Markdown export',
          'Search functionality',
          'Version control integration'
        ],
        monetizationTips: [
          'Free for open source projects',
          'Paid licenses for commercial use',
          'Cloud hosting add-on'
        ],
        similarProjectsCount: 43,
        trendingScore: 71
      }
    ],
    library: [
      {
        id: '6',
        title: 'Form Validation Library',
        description: 'Lightweight, framework-agnostic form validation library with built-in rules, custom validators, and async validation support.',
        category: 'library',
        difficulty: skillLevel,
        estimatedTime: '1 week',
        marketDemand: 'high',
        estimatedPrice: { min: 24, max: 59 },
        requiredSkills: ['TypeScript', 'Testing', 'npm publishing'],
        suggestedFeatures: [
          'Built-in validation rules',
          'Custom validator support',
          'Async validation',
          'Field dependencies',
          'Error message templates',
          'Framework adapters'
        ],
        monetizationTips: [
          'MIT license for basic version',
          'Commercial license with support',
          'Custom rule packages'
        ],
        similarProjectsCount: 78,
        trendingScore: 82
      }
    ]
  };

  // Select ideas based on interests
  let selectedIdeas = [];
  
  if (interests.length === 0) {
    // No specific interests, return variety
    selectedIdeas = [
      baseIdeas.web[0],
      baseIdeas.api[0],
      baseIdeas.tool[0]
    ];
  } else {
    interests.forEach(interest => {
      if (baseIdeas[interest] && baseIdeas[interest].length > 0) {
        selectedIdeas.push(...baseIdeas[interest]);
      }
    });
  }

  // Adjust based on goals
  if (goals.includes('income')) {
    selectedIdeas.sort((a, b) => b.estimatedPrice.max - a.estimatedPrice.max);
  } else if (goals.includes('learn')) {
    selectedIdeas = selectedIdeas.filter(idea => idea.difficulty === skillLevel);
  }

  // Adjust time estimates based on commitment
  selectedIdeas = selectedIdeas.map(idea => ({
    ...idea,
    estimatedTime: adjustTimeEstimate(idea.estimatedTime, timeCommitment)
  }));

  return selectedIdeas.slice(0, 3);
}

function adjustTimeEstimate(baseTime, commitment) {
  const timeMap = {
    'weekend': '2-3 days',
    '1-week': '5-7 days',
    '2-weeks': '10-14 days',
    '1-month': '3-4 weeks'
  };
  
  return timeMap[commitment] || baseTime;
}

module.exports = router;