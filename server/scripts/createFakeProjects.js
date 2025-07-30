const mongoose = require('mongoose');
const Project = require('../models/Project');
const User = require('../models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

const fakeProjects = [
  {
    title: "React E-commerce Dashboard",
    description: "A comprehensive e-commerce admin dashboard built with React, TypeScript, and Material-UI. Features include product management, order tracking, customer analytics, and real-time sales charts. Perfect for online store management with responsive design and dark mode support.",
    category: "web",
    tags: ["react", "typescript", "material-ui", "dashboard", "ecommerce", "charts"],
    tech_stack: ["React", "TypeScript", "Material-UI", "Chart.js", "Axios"],
    license: { type: "freemium", price: 29.99 },
    repository: {
      freeUrl: "https://github.com/developer/ecommerce-dashboard-free",
      paidUrl: "https://github.com/developer/ecommerce-dashboard-pro"
    }
  },
  {
    title: "Vue.js Task Management App",
    description: "A modern task management application with drag-and-drop functionality, team collaboration features, and project timelines. Built with Vue.js 3, Vuex, and includes real-time updates via WebSocket connections.",
    category: "web",
    tags: ["vue", "vuex", "task-management", "drag-drop", "websocket", "collaboration"],
    tech_stack: ["Vue.js", "Vuex", "Socket.io", "Tailwind CSS", "Node.js"],
    license: { type: "paid", price: 39.99 },
    repository: {
      paidUrl: "https://github.com/developer/vue-task-manager"
    }
  },
  {
    title: "Flutter Chat Application",
    description: "Cross-platform chat application built with Flutter and Firebase. Features include real-time messaging, media sharing, group chats, push notifications, and end-to-end encryption for secure communication.",
    category: "mobile",
    tags: ["flutter", "firebase", "chat", "real-time", "encryption", "push-notifications"],
    tech_stack: ["Flutter", "Dart", "Firebase", "Cloud Firestore", "FCM"],
    license: { type: "paid", price: 49.99 },
    repository: {
      paidUrl: "https://github.com/developer/flutter-chat-app"
    }
  },
  {
    title: "Python Machine Learning Toolkit",
    description: "A comprehensive machine learning toolkit with pre-built models for classification, regression, and clustering. Includes data preprocessing utilities, model evaluation metrics, and visualization tools for data scientists.",
    category: "library",
    tags: ["python", "machine-learning", "data-science", "sklearn", "tensorflow", "visualization"],
    tech_stack: ["Python", "TensorFlow", "Scikit-learn", "Pandas", "Matplotlib"],
    license: { type: "free", price: 0 },
    repository: {
      freeUrl: "https://github.com/developer/ml-toolkit"
    }
  },
  {
    title: "Node.js REST API Generator",
    description: "Automatically generate RESTful APIs from database schemas with authentication, validation, and documentation. Supports MongoDB, PostgreSQL, and MySQL with customizable middleware and rate limiting.",
    category: "api",
    tags: ["nodejs", "api", "generator", "rest", "authentication", "database", "documentation"],
    tech_stack: ["Node.js", "Express", "MongoDB", "PostgreSQL", "Swagger", "JWT"],
    license: { type: "freemium", price: 24.99 },
    repository: {
      freeUrl: "https://github.com/developer/api-generator-free",
      paidUrl: "https://github.com/developer/api-generator-pro"
    }
  },
  {
    title: "Electron Desktop CRM",
    description: "A powerful customer relationship management desktop application built with Electron and React. Features contact management, sales pipeline tracking, reporting, and email integration for small to medium businesses.",
    category: "desktop",
    tags: ["electron", "crm", "desktop", "sales", "contacts", "reporting"],
    tech_stack: ["Electron", "React", "SQLite", "Node.js", "Chart.js"],
    license: { type: "paid", price: 79.99 },
    repository: {
      paidUrl: "https://github.com/developer/electron-crm"
    }
  },
  {
    title: "React Component Library",
    description: "A modern, accessible React component library with 50+ customizable components. Includes form elements, data display components, navigation, and layout utilities with TypeScript support and Storybook documentation.",
    category: "library",
    tags: ["react", "components", "typescript", "storybook", "accessibility", "ui-kit"],
    tech_stack: ["React", "TypeScript", "Styled Components", "Storybook", "Jest"],
    license: { type: "freemium", price: 19.99 },
    repository: {
      freeUrl: "https://github.com/developer/react-components-free",
      paidUrl: "https://github.com/developer/react-components-pro"
    }
  },
  {
    title: "Unity 2D Platformer Game",
    description: "A complete 2D platformer game template with character controller, enemy AI, level editor, and power-up system. Includes 10 pre-built levels, sprite animations, and sound effects ready for customization.",
    category: "game",
    tags: ["unity", "2d", "platformer", "game-template", "level-editor", "sprites"],
    tech_stack: ["Unity", "C#", "2D Physics", "Animation System", "Audio Manager"],
    license: { type: "paid", price: 34.99 },
    repository: {
      paidUrl: "https://github.com/developer/unity-platformer"
    }
  },
  {
    title: "SwiftUI iOS Weather App",
    description: "Beautiful iOS weather application built with SwiftUI featuring location-based forecasts, weather maps, severe weather alerts, and Apple Watch companion app. Includes Core Location and WeatherKit integration.",
    category: "mobile",
    tags: ["swiftui", "ios", "weather", "core-location", "weatherkit", "apple-watch"],
    tech_stack: ["SwiftUI", "Core Location", "WeatherKit", "Combine", "CloudKit"],
    license: { type: "paid", price: 44.99 },
    repository: {
      paidUrl: "https://github.com/developer/swiftui-weather"
    }
  },
  {
    title: "Docker Development Environment",
    description: "Pre-configured Docker development environment with popular tech stacks. Includes containers for LAMP, MEAN, Django, and Rails with one-command setup and hot reloading for rapid development.",
    category: "tool",
    tags: ["docker", "development", "environment", "lamp", "mean", "django", "rails"],
    tech_stack: ["Docker", "Docker Compose", "Nginx", "MySQL", "Redis", "Node.js"],
    license: { type: "free", price: 0 },
    repository: {
      freeUrl: "https://github.com/developer/docker-dev-env"
    }
  },
  {
    title: "Stripe Payment Integration Kit",
    description: "Complete payment processing solution with Stripe integration. Includes subscription management, one-time payments, refunds, webhooks, and multi-currency support with React and Node.js examples.",
    category: "library",
    tags: ["stripe", "payments", "subscriptions", "webhooks", "multi-currency", "nodejs"],
    tech_stack: ["Node.js", "Stripe API", "Express", "React", "TypeScript"],
    license: { type: "paid", price: 59.99 },
    repository: {
      paidUrl: "https://github.com/developer/stripe-payment-kit"
    }
  },
  {
    title: "Angular Admin Template",
    description: "Professional admin dashboard template built with Angular 15+ and Angular Material. Features include user management, data tables, charts, forms, authentication, and responsive layout with 10+ page templates.",
    category: "web",
    tags: ["angular", "admin", "dashboard", "material", "template", "responsive"],
    tech_stack: ["Angular", "Angular Material", "TypeScript", "RxJS", "Chart.js"],
    license: { type: "freemium", price: 32.99 },
    repository: {
      freeUrl: "https://github.com/developer/angular-admin-free",
      paidUrl: "https://github.com/developer/angular-admin-pro"
    }
  },
  {
    title: "GraphQL API Boilerplate",
    description: "Production-ready GraphQL API boilerplate with authentication, authorization, real-time subscriptions, and database integration. Includes TypeScript, Prisma ORM, and comprehensive testing setup.",
    category: "api",
    tags: ["graphql", "api", "typescript", "prisma", "subscriptions", "authentication"],
    tech_stack: ["GraphQL", "TypeScript", "Prisma", "Apollo Server", "PostgreSQL"],
    license: { type: "paid", price: 42.99 },
    repository: {
      paidUrl: "https://github.com/developer/graphql-boilerplate"
    }
  },
  {
    title: "WordPress Theme Builder",
    description: "Custom WordPress theme with Gutenberg block support, WooCommerce integration, and SEO optimization. Includes page builder compatibility, custom post types, and responsive design with 20+ demo layouts.",
    category: "web",
    tags: ["wordpress", "theme", "gutenberg", "woocommerce", "seo", "responsive"],
    tech_stack: ["PHP", "WordPress", "JavaScript", "SCSS", "Gutenberg"],
    license: { type: "paid", price: 29.99 },
    repository: {
      paidUrl: "https://github.com/developer/wordpress-theme-builder"
    }
  },
  {
    title: "React Native Fitness Tracker",
    description: "Cross-platform fitness tracking app with workout logging, progress charts, social features, and integration with health APIs. Includes barcode scanning for nutrition tracking and offline data sync.",
    category: "mobile",
    tags: ["react-native", "fitness", "health", "tracking", "charts", "offline-sync"],
    tech_stack: ["React Native", "Redux", "SQLite", "Health API", "Chart.js"],
    license: { type: "paid", price: 54.99 },
    repository: {
      paidUrl: "https://github.com/developer/react-native-fitness"
    }
  }
];

async function createFakeProjects() {
  try {
    // Find an admin user to use as the author
    let adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      console.log('No admin user found, creating one...');
      adminUser = new User({
        username: 'demo-admin',
        email: 'demo@example.com',
        password: 'hashedpassword123', // This would be hashed in real app
        role: 'admin',
        isVerified: true,
        reputation: 100
      });
      await adminUser.save();
    }

    console.log(`Using admin user: ${adminUser.username}`);

    // Delete existing fake projects to avoid duplicates
    await Project.deleteMany({ 
      author: adminUser._id,
      title: { $in: fakeProjects.map(p => p.title) }
    });

    console.log('Creating fake projects...');
    
    for (const projectData of fakeProjects) {
      const project = new Project({
        ...projectData,
        author: adminUser._id,
        status: 'published',
        isActive: true,
        stats: {
          views: Math.floor(Math.random() * 1000) + 50,
          downloads: Math.floor(Math.random() * 200) + 10,
          stars: Math.floor(Math.random() * 50) + 5
        },
        license: {
          ...projectData.license,
          marketplaceFeePct: 20,
          sellerEarnings: projectData.license.price * 0.8,
          currency: 'USD',
          features: {
            freeFeatures: projectData.license.type === 'free' ? 
              ["Open source", "Community support", "Basic features"] : 
              ["Limited features", "Community support"],
            paidFeatures: projectData.license.type !== 'free' ? 
              ["Full features", "Priority support", "Commercial license", "Regular updates"] : []
          }
        }
      });

      await project.save();
      console.log(`Created project: ${project.title}`);
    }

    console.log(`Successfully created ${fakeProjects.length} fake projects!`);
    console.log('\nNow you can test AI search with queries like:');
    console.log('- "I need a React dashboard with charts"');
    console.log('- "Looking for a mobile chat application"');
    console.log('- "Find me a Python machine learning library"');
    console.log('- "Payment processing solution with Stripe"');
    console.log('- "Task management app with real-time features"');
    
  } catch (error) {
    console.error('Error creating fake projects:', error);
  } finally {
    mongoose.connection.close();
  }
}

createFakeProjects();