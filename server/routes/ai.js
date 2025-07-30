const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

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

module.exports = router;