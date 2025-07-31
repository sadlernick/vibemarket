import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  LightBulbIcon,
  SparklesIcon,
  CodeBracketSquareIcon,
  RocketLaunchIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ClockIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface ProjectIdea {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  marketDemand: 'low' | 'medium' | 'high' | 'very-high';
  estimatedPrice: { min: number; max: number };
  requiredSkills: string[];
  suggestedFeatures: string[];
  monetizationTips: string[];
  similarProjectsCount: number;
  trendingScore: number;
}

const ProjectIdeaGenerator: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<ProjectIdea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<ProjectIdea | null>(null);

  // Form state
  const [skillLevel, setSkillLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [interests, setInterests] = useState<string[]>([]);
  const [timeCommitment, setTimeCommitment] = useState<'weekend' | '1-week' | '2-weeks' | '1-month'>('1-week');
  const [goals, setGoals] = useState<string[]>([]);

  const skillCategories = [
    { id: 'web', label: 'Web Development', icon: '🌐' },
    { id: 'mobile', label: 'Mobile Apps', icon: '📱' },
    { id: 'api', label: 'APIs & Backend', icon: '🔌' },
    { id: 'data', label: 'Data & Analytics', icon: '📊' },
    { id: 'ai', label: 'AI & Machine Learning', icon: '🤖' },
    { id: 'game', label: 'Game Development', icon: '🎮' },
    { id: 'tool', label: 'Developer Tools', icon: '🛠️' },
    { id: 'design', label: 'UI/UX Components', icon: '🎨' }
  ];

  const projectGoals = [
    { id: 'learn', label: 'Learn new skills', icon: '📚' },
    { id: 'portfolio', label: 'Build portfolio', icon: '💼' },
    { id: 'income', label: 'Generate income', icon: '💰' },
    { id: 'opensource', label: 'Contribute to open source', icon: '🌍' },
    { id: 'solve', label: 'Solve a personal problem', icon: '🔧' },
    { id: 'fun', label: 'Just for fun!', icon: '🎉' }
  ];

  const generateIdeas = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/tools/generate-ideas', {
        skillLevel,
        interests,
        timeCommitment,
        goals
      });
      setIdeas(response.data.ideas);
      setStep(3);
    } catch (error) {
      console.error('Failed to generate ideas:', error);
      // Fallback to static ideas for now
      setIdeas(getMockIdeas());
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  const getMockIdeas = (): ProjectIdea[] => {
    const baseIdeas = [
      {
        id: '1',
        title: 'Task Management Dashboard',
        description: 'A modern task management app with drag-and-drop kanban boards, time tracking, and team collaboration features. Perfect for learning React state management and UI libraries.',
        category: 'web',
        difficulty: skillLevel,
        estimatedTime: timeCommitment === 'weekend' ? '2-3 days' : '1 week',
        marketDemand: 'high' as const,
        estimatedPrice: { min: 29, max: 79 },
        requiredSkills: ['React', 'State Management', 'CSS/Tailwind', 'REST APIs'],
        suggestedFeatures: [
          'Drag and drop tasks between columns',
          'Real-time updates',
          'Task assignments and due dates',
          'Progress tracking',
          'Dark mode support'
        ],
        monetizationTips: [
          'Offer a free version with limited boards',
          'Premium features: unlimited boards, team members',
          'White-label option for businesses'
        ],
        similarProjectsCount: 47,
        trendingScore: 85
      },
      {
        id: '2',
        title: 'API Rate Limiter Package',
        description: 'Create a flexible rate limiting middleware for Node.js APIs with Redis support, multiple strategies, and easy configuration. High demand in the API development community.',
        category: 'api',
        difficulty: 'intermediate' as const,
        estimatedTime: '4-5 days',
        marketDemand: 'very-high' as const,
        estimatedPrice: { min: 19, max: 49 },
        requiredSkills: ['Node.js', 'Redis', 'Express/Fastify', 'Testing'],
        suggestedFeatures: [
          'Multiple rate limiting strategies',
          'Redis and in-memory storage',
          'Customizable error responses',
          'Whitelist/blacklist support',
          'Analytics dashboard'
        ],
        monetizationTips: [
          'Free for basic use (1000 requests/hour)',
          'Paid tiers for higher limits',
          'Enterprise support packages'
        ],
        similarProjectsCount: 23,
        trendingScore: 92
      },
      {
        id: '3',
        title: 'React Component Library',
        description: 'Build a collection of beautiful, accessible React components with TypeScript support, Storybook documentation, and customizable themes.',
        category: 'design',
        difficulty: skillLevel,
        estimatedTime: '2 weeks',
        marketDemand: 'high' as const,
        estimatedPrice: { min: 39, max: 99 },
        requiredSkills: ['React', 'TypeScript', 'CSS-in-JS', 'Storybook'],
        suggestedFeatures: [
          '20+ essential components',
          'Full TypeScript support',
          'Theme customization',
          'Accessibility compliant',
          'Interactive documentation'
        ],
        monetizationTips: [
          'Free core components',
          'Pro version with advanced components',
          'Custom theme builder for premium'
        ],
        similarProjectsCount: 156,
        trendingScore: 78
      }
    ];

    // Filter based on interests
    return baseIdeas.filter(idea => 
      interests.length === 0 || interests.includes(idea.category)
    );
  };

  const startProject = (idea: ProjectIdea) => {
    if (!user) {
      navigate('/register');
      return;
    }
    
    // Navigate to project creation with pre-filled data
    navigate('/post-projects', {
      state: {
        prefilled: {
          title: idea.title,
          description: idea.description,
          category: idea.category,
          tags: idea.requiredSkills,
          suggestedPrice: idea.estimatedPrice.min
        }
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl">
            <LightBulbIcon className="w-12 h-12 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Project Idea Generator
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Get personalized project ideas based on your skills, interests, and goals. 
          Find the perfect project to build and sell on VibeMarket.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          <div className={`flex items-center ${step >= 1 ? 'text-purple-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
              step >= 1 ? 'border-purple-600 bg-purple-50' : 'border-gray-300'
            }`}>
              1
            </div>
            <span className="ml-2 font-medium">Your Info</span>
          </div>
          
          <ChevronRightIcon className="w-5 h-5 text-gray-400" />
          
          <div className={`flex items-center ${step >= 2 ? 'text-purple-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
              step >= 2 ? 'border-purple-600 bg-purple-50' : 'border-gray-300'
            }`}>
              2
            </div>
            <span className="ml-2 font-medium">Preferences</span>
          </div>
          
          <ChevronRightIcon className="w-5 h-5 text-gray-400" />
          
          <div className={`flex items-center ${step >= 3 ? 'text-purple-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
              step >= 3 ? 'border-purple-600 bg-purple-50' : 'border-gray-300'
            }`}>
              3
            </div>
            <span className="ml-2 font-medium">Your Ideas</span>
          </div>
        </div>
      </div>

      {/* Step 1: Skill Level & Interests */}
      {step === 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Tell us about yourself
          </h2>
          
          <div className="space-y-8">
            {/* Skill Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                What's your coding experience level?
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { value: 'beginner', label: 'Beginner', desc: '< 1 year coding' },
                  { value: 'intermediate', label: 'Intermediate', desc: '1-3 years' },
                  { value: 'advanced', label: 'Advanced', desc: '3+ years' }
                ].map((level) => (
                  <button
                    key={level.value}
                    onClick={() => setSkillLevel(level.value as any)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      skillLevel === level.value
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{level.label}</div>
                    <div className="text-sm text-gray-500 mt-1">{level.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Interests */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                What areas interest you? (Select all that apply)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {skillCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setInterests(prev =>
                        prev.includes(cat.id)
                          ? prev.filter(i => i !== cat.id)
                          : [...prev, cat.id]
                      );
                    }}
                    className={`p-3 rounded-lg border-2 transition-all flex items-center ${
                      interests.includes(cat.id)
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl mr-2">{cat.icon}</span>
                    <span className="text-sm font-medium">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={() => setStep(2)}
              className="btn btn-primary"
            >
              Next Step
              <ChevronRightIcon className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Time & Goals */}
      {step === 2 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Set your preferences
          </h2>
          
          <div className="space-y-8">
            {/* Time Commitment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                How much time can you dedicate?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { value: 'weekend', label: 'Weekend', icon: '⚡' },
                  { value: '1-week', label: '1 Week', icon: '📅' },
                  { value: '2-weeks', label: '2 Weeks', icon: '📆' },
                  { value: '1-month', label: '1 Month', icon: '🗓️' }
                ].map((time) => (
                  <button
                    key={time.value}
                    onClick={() => setTimeCommitment(time.value as any)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      timeCommitment === time.value
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{time.icon}</div>
                    <div className="font-medium text-gray-900">{time.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Goals */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                What are your goals? (Select all that apply)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {projectGoals.map((goal) => (
                  <button
                    key={goal.id}
                    onClick={() => {
                      setGoals(prev =>
                        prev.includes(goal.id)
                          ? prev.filter(g => g !== goal.id)
                          : [...prev, goal.id]
                      );
                    }}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      goals.includes(goal.id)
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{goal.icon}</div>
                    <div className="text-sm font-medium">{goal.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="btn btn-secondary"
            >
              Back
            </button>
            <button
              onClick={generateIdeas}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                  Generating Ideas...
                </>
              ) : (
                <>
                  Generate Ideas
                  <SparklesIcon className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Generated Ideas */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Perfect project ideas for you!
            </h2>
            <p className="text-gray-600">
              Based on your skills and goals, here are personalized project ideas with market insights
            </p>
          </div>

          {ideas.map((idea) => (
            <div
              key={idea.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {idea.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {idea.description}
                  </p>
                </div>
                <div className="ml-4 text-right">
                  <div className="text-2xl font-bold text-green-600">
                    ${idea.estimatedPrice.min}-${idea.estimatedPrice.max}
                  </div>
                  <div className="text-sm text-gray-500">estimated price</div>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <ChartBarIcon className="w-6 h-6 text-gray-600 mx-auto mb-1" />
                  <div className="text-sm font-medium text-gray-900">
                    {idea.marketDemand.replace('-', ' ')} demand
                  </div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <ClockIcon className="w-6 h-6 text-gray-600 mx-auto mb-1" />
                  <div className="text-sm font-medium text-gray-900">
                    {idea.estimatedTime}
                  </div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <CodeBracketSquareIcon className="w-6 h-6 text-gray-600 mx-auto mb-1" />
                  <div className="text-sm font-medium text-gray-900">
                    {idea.difficulty}
                  </div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <RocketLaunchIcon className="w-6 h-6 text-gray-600 mx-auto mb-1" />
                  <div className="text-sm font-medium text-gray-900">
                    {idea.trendingScore}% trending
                  </div>
                </div>
              </div>

              {/* Expandable Details */}
              <details className="group">
                <summary className="cursor-pointer text-purple-600 hover:text-purple-700 font-medium mb-4">
                  View detailed breakdown →
                </summary>
                
                <div className="space-y-4 mt-4">
                  {/* Required Skills */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Required Skills:</h4>
                    <div className="flex flex-wrap gap-2">
                      {idea.requiredSkills.map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Suggested Features */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Key Features to Build:</h4>
                    <ul className="space-y-1">
                      {idea.suggestedFeatures.map((feature, idx) => (
                        <li key={idx} className="flex items-start">
                          <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Monetization Tips */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Monetization Strategy:</h4>
                    <ul className="space-y-1">
                      {idea.monetizationTips.map((tip, idx) => (
                        <li key={idx} className="flex items-start">
                          <CurrencyDollarIcon className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-600">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 text-sm text-gray-500">
                    {idea.similarProjectsCount} similar projects • 
                    Competition: {idea.similarProjectsCount > 100 ? 'High' : idea.similarProjectsCount > 50 ? 'Medium' : 'Low'}
                  </div>
                </div>
              </details>

              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <button
                  onClick={() => setSelectedIdea(idea)}
                  className="btn btn-secondary"
                >
                  Save for Later
                </button>
                <button
                  onClick={() => startProject(idea)}
                  className="btn btn-primary"
                >
                  Start This Project
                  <ChevronRightIcon className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          ))}

          <div className="text-center mt-8">
            <button
              onClick={() => {
                setStep(1);
                setIdeas([]);
              }}
              className="btn btn-secondary"
            >
              Generate New Ideas
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectIdeaGenerator;