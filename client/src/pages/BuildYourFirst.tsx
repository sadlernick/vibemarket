import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  AcademicCapIcon,
  PlayIcon,
  ClockIcon,
  ChartBarIcon,
  CheckCircleIcon,
  LockClosedIcon,
  StarIcon,
  CodeBracketIcon,
  BookOpenIcon,
  ArrowRightIcon,
  BeakerIcon,
  CommandLineIcon,
  DevicePhoneMobileIcon,
  CircleStackIcon,
  CpuChipIcon,
  PuzzlePieceIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';

interface Tutorial {
  id: string;
  title: string;
  slug: string;
  description: string;
  icon: React.ComponentType<any>;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  topics: string[];
  whatYouBuild: string;
  prerequisites: string[];
  estimatedEarnings: string;
  isPremium: boolean;
  completedBy: number;
  rating: number;
}

const BuildYourFirst: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'web' | 'mobile' | 'api' | 'tools'>('all');

  const tutorials: Tutorial[] = [
    {
      id: '1',
      title: 'Build Your First React Component Library',
      slug: 'react-component-library',
      description: 'Learn to create reusable React components, publish to npm, and sell on VibeMarket. Perfect for beginners ready to level up.',
      icon: PuzzlePieceIcon,
      duration: '4-6 hours',
      difficulty: 'beginner',
      topics: ['React basics', 'Component patterns', 'Storybook', 'npm publishing', 'TypeScript intro'],
      whatYouBuild: 'A 10-component UI library with Button, Card, Modal, and more',
      prerequisites: ['Basic React knowledge', 'JavaScript fundamentals'],
      estimatedEarnings: '$20-50/month',
      isPremium: false,
      completedBy: 1247,
      rating: 4.8
    },
    {
      id: '2',
      title: 'Build Your First REST API',
      slug: 'rest-api',
      description: 'Create a production-ready REST API with authentication, database, and deployment. High demand in the marketplace!',
      icon: CircleStackIcon,
      duration: '6-8 hours',
      difficulty: 'intermediate',
      topics: ['Node.js', 'Express', 'MongoDB', 'JWT Auth', 'API design', 'Deployment'],
      whatYouBuild: 'A complete blog API with user auth, CRUD operations, and pagination',
      prerequisites: ['JavaScript knowledge', 'Basic backend concepts'],
      estimatedEarnings: '$30-80/month',
      isPremium: false,
      completedBy: 892,
      rating: 4.9
    },
    {
      id: '3',
      title: 'Build Your First Mobile App',
      slug: 'mobile-app',
      description: 'Create a cross-platform mobile app using React Native. From idea to app store in one tutorial.',
      icon: DevicePhoneMobileIcon,
      duration: '8-10 hours',
      difficulty: 'intermediate',
      topics: ['React Native', 'Mobile UI', 'Navigation', 'State management', 'Publishing'],
      whatYouBuild: 'A habit tracker app with notifications and data persistence',
      prerequisites: ['React basics', 'JavaScript ES6+'],
      estimatedEarnings: '$50-150/month',
      isPremium: true,
      completedBy: 673,
      rating: 4.7
    },
    {
      id: '4',
      title: 'Build Your First CLI Tool',
      slug: 'cli-tool',
      description: 'Create a command-line tool that developers will love. Learn Node.js, npm publishing, and developer ergonomics.',
      icon: CommandLineIcon,
      duration: '3-4 hours',
      difficulty: 'beginner',
      topics: ['Node.js', 'CLI design', 'npm', 'File system', 'User input'],
      whatYouBuild: 'A project scaffolding tool like create-react-app',
      prerequisites: ['Basic JavaScript', 'Terminal familiarity'],
      estimatedEarnings: '$10-40/month',
      isPremium: false,
      completedBy: 456,
      rating: 4.6
    },
    {
      id: '5',
      title: 'Build Your First AI-Powered App',
      slug: 'ai-app',
      description: 'Integrate OpenAI and build an AI-powered application. Hot market with huge potential!',
      icon: CpuChipIcon,
      duration: '5-6 hours',
      difficulty: 'intermediate',
      topics: ['OpenAI API', 'Prompt engineering', 'React', 'Rate limiting', 'Monetization'],
      whatYouBuild: 'An AI writing assistant with multiple templates',
      prerequisites: ['React knowledge', 'API basics'],
      estimatedEarnings: '$100-300/month',
      isPremium: true,
      completedBy: 234,
      rating: 4.9
    },
    {
      id: '6',
      title: 'Build Your First Game',
      slug: 'web-game',
      description: 'Create an engaging web game with Phaser.js. Learn game loops, physics, and monetization strategies.',
      icon: BeakerIcon,
      duration: '6-8 hours',
      difficulty: 'intermediate',
      topics: ['Phaser.js', 'Game design', 'Physics', 'Sprites', 'Sound', 'Leaderboards'],
      whatYouBuild: 'A puzzle game with 10 levels and social features',
      prerequisites: ['JavaScript', 'Basic programming logic'],
      estimatedEarnings: '$20-100/month',
      isPremium: false,
      completedBy: 345,
      rating: 4.5
    }
  ];

  const categories = [
    { id: 'all', label: 'All Tutorials' },
    { id: 'web', label: 'Web Development' },
    { id: 'mobile', label: 'Mobile Apps' },
    { id: 'api', label: 'APIs & Backend' },
    { id: 'tools', label: 'Developer Tools' }
  ];

  const filteredTutorials = tutorials.filter(tutorial => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'web' && ['react-component-library', 'ai-app', 'web-game'].includes(tutorial.slug)) return true;
    if (selectedCategory === 'mobile' && tutorial.slug === 'mobile-app') return true;
    if (selectedCategory === 'api' && tutorial.slug === 'rest-api') return true;
    if (selectedCategory === 'tools' && tutorial.slug === 'cli-tool') return true;
    return false;
  });

  const startTutorial = (tutorial: Tutorial) => {
    if (tutorial.isPremium && !user) {
      navigate('/register');
      return;
    }
    navigate(`/tutorials/${tutorial.slug}`);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl">
            <AcademicCapIcon className="w-12 h-12 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Build Your First Project
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Step-by-step tutorials to build real projects you can sell on VibeMarket. 
          Each tutorial includes market insights and monetization strategies.
        </p>
      </div>

      {/* Stats Bar */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
          <div className="text-white">
            <div className="text-3xl font-bold">4,235</div>
            <div className="text-purple-100">Projects Built</div>
          </div>
          <div className="text-white">
            <div className="text-3xl font-bold">$127k</div>
            <div className="text-purple-100">Total Earnings</div>
          </div>
          <div className="text-white">
            <div className="text-3xl font-bold">892</div>
            <div className="text-purple-100">Active Builders</div>
          </div>
          <div className="text-white">
            <div className="text-3xl font-bold">4.8★</div>
            <div className="text-purple-100">Average Rating</div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedCategory === cat.id
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Tutorial Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTutorials.map((tutorial) => {
          const Icon = tutorial.icon;
          return (
            <div
              key={tutorial.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all group"
            >
              {/* Tutorial Header */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl group-hover:scale-110 transition-transform">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  {tutorial.isPremium && !user && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <LockClosedIcon className="w-3 h-3 mr-1" />
                      Premium
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {tutorial.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {tutorial.description}
                </p>

                {/* Metadata */}
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span className="flex items-center">
                    <ClockIcon className="w-4 h-4 mr-1" />
                    {tutorial.duration}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(tutorial.difficulty)}`}>
                    {tutorial.difficulty}
                  </span>
                </div>

                {/* What You'll Build */}
                <div className="bg-purple-50 rounded-lg p-3 mb-4">
                  <div className="text-xs font-medium text-purple-700 mb-1">What you'll build:</div>
                  <div className="text-sm text-purple-900">{tutorial.whatYouBuild}</div>
                </div>

                {/* Topics */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {tutorial.topics.slice(0, 3).map((topic) => (
                    <span
                      key={topic}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                    >
                      {topic}
                    </span>
                  ))}
                  {tutorial.topics.length > 3 && (
                    <span className="px-2 py-1 text-gray-500 text-xs">
                      +{tutorial.topics.length - 3} more
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3 text-gray-500">
                    <span className="flex items-center">
                      <StarIcon className="w-4 h-4 mr-1 text-yellow-500" />
                      {tutorial.rating}
                    </span>
                    <span className="flex items-center">
                      <CheckCircleIcon className="w-4 h-4 mr-1 text-green-500" />
                      {tutorial.completedBy}
                    </span>
                  </div>
                  <div className="text-green-600 font-medium">
                    {tutorial.estimatedEarnings}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="px-6 pb-6">
                <button
                  onClick={() => startTutorial(tutorial)}
                  className="w-full btn btn-primary group"
                >
                  {tutorial.isPremium && !user ? (
                    <>
                      Sign Up to Access
                      <LockClosedIcon className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Start Tutorial
                      <PlayIcon className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div className="mt-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-8 text-center">
        <h3 className="text-2xl font-bold text-white mb-4">
          Ready to start building?
        </h3>
        <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
          Join thousands of developers who are learning, building, and earning on PackCode.
          Your first successful project is just one tutorial away!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/tools/idea-generator"
            className="btn bg-white text-purple-600 hover:bg-gray-50"
          >
            <LightBulbIcon className="w-5 h-5 mr-2" />
            Get Project Ideas
          </Link>
          <Link
            to="/register"
            className="btn border-white text-white hover:bg-white hover:text-purple-600"
          >
            Sign Up Free
            <ArrowRightIcon className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </div>

      {/* Success Stories */}
      <div className="mt-12">
        <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
          Success Stories from Our Community
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: 'Sarah Chen',
              project: 'React Dashboard Kit',
              earnings: '$1,240/month',
              quote: 'The React component tutorial gave me everything I needed. Published my first project in a weekend!'
            },
            {
              name: 'Marcus Johnson',
              project: 'API Rate Limiter',
              earnings: '$890/month',
              quote: 'Built my first API following the tutorial. Now it\'s one of the top-selling in its category!'
            },
            {
              name: 'Elena Rodriguez',
              project: 'Mobile Fitness App',
              earnings: '$2,100/month',
              quote: 'Never built a mobile app before. The tutorial made it so easy, I built 3 more after!'
            }
          ].map((story, idx) => (
            <div key={idx} className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                  {story.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="ml-3">
                  <div className="font-medium text-gray-900">{story.name}</div>
                  <div className="text-sm text-gray-500">{story.project}</div>
                </div>
              </div>
              <p className="text-gray-600 italic mb-3">"{story.quote}"</p>
              <div className="text-green-600 font-bold">{story.earnings}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BuildYourFirst;