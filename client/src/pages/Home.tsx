import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  CodeBracketIcon, 
  CurrencyDollarIcon, 
  UserGroupIcon,
  PlayIcon,
  StarIcon,
  ArrowRightIcon,
  LightBulbIcon,
  AcademicCapIcon,
  SparklesIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const Home: React.FC = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: CodeBracketIcon,
      title: 'Share Your Projects',
      description: 'Upload and showcase your coding projects to the vibe coder community.'
    },
    {
      icon: PlayIcon,
      title: 'Run Applications',
      description: 'Test and run projects directly in a secure sandbox environment.'
    },
    {
      icon: CurrencyDollarIcon,
      title: 'License & Monetize',
      description: 'Sell licenses for your code with flexible pricing and usage rights.'
    },
    {
      icon: UserGroupIcon,
      title: 'Community Driven',
      description: 'Connect with fellow developers and discover amazing projects.'
    }
  ];

  const stats = [
    { label: 'Active Developers', value: '1,200+' },
    { label: 'Projects Shared', value: '3,400+' },
    { label: 'Code Downloads', value: '15,000+' },
    { label: 'Revenue Generated', value: '$24,000+' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-purple-900 via-purple-800 to-blue-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              <span className="block bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent">
                PackCode
              </span>
              The marketplace for vibe coders
            </h1>
            <p className="text-xl text-purple-100 mb-8 max-w-3xl mx-auto">
              Share your projects, run applications in the cloud, and monetize your code. 
              Build together as a pack in our community-driven marketplace.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-purple-900 bg-white hover:bg-gray-50 transition-colors duration-200"
                  >
                    Go to Dashboard
                    <ArrowRightIcon className="ml-2 w-5 h-5" />
                  </Link>
                  <Link
                    to="/upload"
                    className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 transition-colors duration-200"
                  >
                    Upload Project
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-purple-900 bg-white hover:bg-gray-50 transition-colors duration-200"
                  >
                    Get Started Free
                    <ArrowRightIcon className="ml-2 w-5 h-5" />
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center px-8 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-white hover:text-purple-900 transition-colors duration-200"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-purple-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* New Coder Success Tools */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Start Building Today
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to go from idea to income. Our tools help new vibe coders 
              build successful projects faster.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Project Idea Generator */}
            <Link
              to="/tools/idea-generator"
              className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-8 border-2 border-transparent hover:border-purple-200"
            >
              <div className="flex items-start">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl group-hover:scale-110 transition-transform">
                  <LightBulbIcon className="w-8 h-8 text-white" />
                </div>
                <div className="ml-6 flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                    Project Idea Generator
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Get personalized project ideas based on your skills and market demand. 
                    Find your next bestseller in minutes.
                  </p>
                  <div className="flex items-center text-purple-600 font-medium">
                    <SparklesIcon className="w-5 h-5 mr-2" />
                    Generate Ideas Now
                    <ArrowRightIcon className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Build Your First Tutorials */}
            <Link
              to="/tutorials"
              className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-8 border-2 border-transparent hover:border-blue-200"
            >
              <div className="flex items-start">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl group-hover:scale-110 transition-transform">
                  <AcademicCapIcon className="w-8 h-8 text-white" />
                </div>
                <div className="ml-6 flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    Build Your First Project
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Step-by-step tutorials to build real projects. Learn, build, and 
                    start earning with guided instruction.
                  </p>
                  <div className="flex items-center text-blue-600 font-medium">
                    <PlayIcon className="w-5 h-5 mr-2" />
                    Start Learning
                    <ArrowRightIcon className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Success Metrics */}
          <div className="mt-12 grid grid-cols-3 gap-8 max-w-3xl mx-auto text-center">
            <div>
              <div className="text-2xl font-bold text-purple-600">2.5x</div>
              <div className="text-sm text-gray-600">Faster to First Sale</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">87%</div>
              <div className="text-sm text-gray-600">Launch Success Rate</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">$125</div>
              <div className="text-sm text-gray-600">Avg First Project Earnings</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to share and monetize your code
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built by developers, for developers. Our platform makes it easy to 
              showcase, distribute, and profit from your coding projects.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-purple-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to share your vibe?
          </h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Join thousands of developers who are already building, sharing, and 
            earning with VibeMarket.
          </p>
          
          {!user && (
            <Link
              to="/register"
              className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-purple-600 bg-white hover:bg-gray-50 transition-colors duration-200"
            >
              Start Building Today
              <ArrowRightIcon className="ml-2 w-5 h-5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;