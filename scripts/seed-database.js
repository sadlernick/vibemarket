#!/usr/bin/env node

/**
 * Database seeding script for development
 * Creates sample data for testing and development
 */

const { connectToDatabase, disconnectFromDatabase } = require('../config/database');
const User = require('../server/models/User');
const Project = require('../server/models/Project');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await connectToDatabase();
    
    // Clear existing data (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('🧹 Clearing existing data...');
      await User.deleteMany({});
      await Project.deleteMany({});
    }
    
    // Create sample users
    console.log('👥 Creating sample users...');
    
    const sampleUsers = [
      {
        username: 'john_dev',
        email: 'john@example.com',
        password: await bcrypt.hash('password123', 8),
        profile: {
          displayName: 'John Developer',
          bio: 'Full-stack developer passionate about creating amazing user experiences.',
          location: 'San Francisco, CA',
          website: 'https://johndeveloper.com'
        },
        githubProfile: {
          id: '12345',
          username: 'john_dev',
          displayName: 'John Developer',
          profileUrl: 'https://github.com/john_dev'
        }
      },
      {
        username: 'sarah_coder',
        email: 'sarah@example.com',
        password: await bcrypt.hash('password123', 8),
        profile: {
          displayName: 'Sarah Coder',
          bio: 'Frontend specialist with a love for React and modern CSS.',
          location: 'New York, NY',
          website: 'https://sarahcodes.dev'
        },
        githubProfile: {
          id: '67890',
          username: 'sarah_coder',
          displayName: 'Sarah Coder',
          profileUrl: 'https://github.com/sarah_coder'
        }
      },
      {
        username: 'mike_backend',
        email: 'mike@example.com',
        password: await bcrypt.hash('password123', 8),
        profile: {
          displayName: 'Mike Backend',
          bio: 'Backend engineer specializing in scalable Node.js applications.',
          location: 'Austin, TX'
        }
      }
    ];
    
    const createdUsers = await User.create(sampleUsers);
    console.log(`✅ Created ${createdUsers.length} sample users`);
    
    // Create sample projects
    console.log('📦 Creating sample projects...');
    
    const sampleProjects = [
      {
        title: 'React Dashboard Template',
        description: `**React Dashboard Template** is a comprehensive admin dashboard built with modern React practices.

🚀 **Key Features:**
- Responsive design that works on all devices
- Dark/light theme support
- Multiple chart types and data visualizations
- User management and authentication
- Real-time notifications

🛠️ **Tech Stack:**
- React 18 with hooks
- TypeScript for type safety
- Tailwind CSS for styling
- Chart.js for visualizations
- JWT authentication

Perfect for developers looking to jumpstart their admin panel projects or learn advanced React patterns.`,
        author: createdUsers[0]._id,
        category: 'web',
        tags: ['react', 'typescript', 'dashboard', 'admin', 'tailwind'],
        repository: {
          freeUrl: 'https://github.com/john_dev/react-dashboard-free',
          paidUrl: 'https://github.com/john_dev/react-dashboard-pro'
        },
        demo: {
          url: 'https://react-dashboard-demo.vercel.app'
        },
        license: {
          type: 'freemium',
          price: 49,
          sellerPrice: 49,
          currency: 'USD',
          features: {
            freeFeatures: ['Basic dashboard layout', 'Light theme', 'Basic charts', 'Personal use license'],
            paidFeatures: ['Advanced components', 'Dark theme', 'All chart types', 'Commercial license', 'Priority support']
          }
        },
        status: 'published',
        featured: true,
        metrics: {
          views: 1250,
          downloads: 89,
          likes: 34
        }
      },
      {
        title: 'E-commerce API Starter',
        description: `**E-commerce API Starter** provides a solid foundation for building scalable e-commerce backends.

🌐 **API Features:**
- Complete product management
- Shopping cart functionality
- Order processing system
- Payment integration ready
- User authentication & authorization

🔒 **Security & Performance:**
- JWT token authentication
- Rate limiting
- Input validation
- MongoDB optimizations
- Comprehensive error handling

Ideal for developers building e-commerce platforms or learning backend development best practices.`,
        author: createdUsers[2]._id,
        category: 'api',
        tags: ['nodejs', 'express', 'mongodb', 'ecommerce', 'api'],
        repository: {
          freeUrl: 'https://github.com/mike_backend/ecommerce-api-basic',
          paidUrl: 'https://github.com/mike_backend/ecommerce-api-pro'
        },
        license: {
          type: 'freemium',
          price: 79,
          sellerPrice: 79,
          currency: 'USD',
          features: {
            freeFeatures: ['Basic CRUD operations', 'User authentication', 'Documentation', 'Personal use license'],
            paidFeatures: ['Advanced features', 'Payment integration', 'Email notifications', 'Commercial license', '1 year support']
          }
        },
        status: 'published',
        metrics: {
          views: 890,
          downloads: 45,
          likes: 28
        }
      },
      {
        title: 'CSS Animation Library',
        description: `**CSS Animation Library** contains beautiful, performant CSS animations ready to use in any project.

✨ **Animation Types:**
- Fade in/out effects
- Slide transitions
- Bounce animations
- Loading spinners
- Hover effects

🎨 **Features:**
- Pure CSS (no JavaScript required)
- Customizable timing and easing
- Cross-browser compatible
- Lightweight and performant
- Easy integration

Perfect for designers and developers who want to add smooth animations to their projects without the complexity of JavaScript libraries.`,
        author: createdUsers[1]._id,
        category: 'library',
        tags: ['css', 'animations', 'frontend', 'ui', 'library'],
        repository: {
          freeUrl: 'https://github.com/sarah_coder/css-animations-free'
        },
        demo: {
          url: 'https://css-animations-demo.netlify.app'
        },
        license: {
          type: 'free',
          price: 0,
          currency: 'USD',
          features: {
            freeFeatures: ['20+ animations', 'Documentation', 'Personal & commercial use', 'Community support']
          }
        },
        status: 'published',
        metrics: {
          views: 2100,
          downloads: 156,
          likes: 78
        }
      }
    ];
    
    const createdProjects = await Project.create(sampleProjects);
    console.log(`✅ Created ${createdProjects.length} sample projects`);
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Users: ${createdUsers.length}`);
    console.log(`   - Projects: ${createdProjects.length}`);
    console.log('\n🔐 Sample login credentials:');
    console.log('   Email: john@example.com');
    console.log('   Password: password123');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await disconnectFromDatabase();
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };