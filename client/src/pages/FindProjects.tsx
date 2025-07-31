import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  StarIcon,
  PlayIcon,
  CodeBracketIcon,
  CurrencyDollarIcon,
  LockClosedIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface Project {
  _id: string;
  title: string;
  description: string;
  author: {
    username: string;
    profileImage?: string;
    reputation: number;
  };
  category: string;
  tags: string[];
  license: {
    type: string;
    price: number;
    currency: string;
  };
  stats: {
    views: number;
    downloads: number;
    stars: number;
  };
  createdAt: string;
  demo?: {
    url: string;
    screenshots: string[];
  };
}

const FindProjects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [showFilters, setShowFilters] = useState(false);
  const [aiSearching, setAiSearching] = useState(false);
  const [aiSearchSummary, setAiSearchSummary] = useState('');
  const [isAiSearch, setIsAiSearch] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  const categories = [
    { value: 'all', label: 'All Categories', count: 0 },
    { value: 'web', label: 'Web Apps', count: 0 },
    { value: 'mobile', label: 'Mobile Apps', count: 0 },
    { value: 'desktop', label: 'Desktop Apps', count: 0 },
    { value: 'api', label: 'APIs', count: 0 },
    { value: 'library', label: 'Libraries', count: 0 },
    { value: 'tool', label: 'Tools', count: 0 },
    { value: 'game', label: 'Games', count: 0 },
    { value: 'other', label: 'Other', count: 0 }
  ];

  const sortOptions = [
    { value: 'createdAt', label: 'Newest First' },
    { value: 'stats.views', label: 'Most Viewed' },
    { value: 'stats.downloads', label: 'Most Downloaded' },
    { value: 'stats.stars', label: 'Highest Rated' },
    { value: 'license.price', label: 'Price: Low to High' }
  ];

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setIsAiSearch(false);
      setAiSearchSummary('');
      
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortBy === 'license.price' ? 'asc' : 'desc');

      const response = await axios.get(`/projects?${params}`);
      setProjects(response.data.projects || []);
    } catch (error: any) {
      console.error('Failed to fetch projects:', error);
      setError(error.response?.data?.error || 'Failed to fetch projects. Please try again.');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, sortBy]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleAiSearch = async () => {
    if (!search.trim()) return;
    
    try {
      setAiSearching(true);
      setLoading(true);
      
      const response = await axios.post('/projects/ai-search', {
        query: search
      });
      
      setProjects(response.data.projects || []);
      setAiSearchSummary(response.data.searchSummary || '');
      setIsAiSearch(true);
    } catch (error) {
      console.error('AI search failed:', error);
      // Fallback to regular search
      fetchProjects();
    } finally {
      setAiSearching(false);
      setLoading(false);
    }
  };

  const handleProjectAction = (action: string, projectId: string) => {
    if (!user) {
      // Store the intended action and redirect to login
      localStorage.setItem('intendedAction', JSON.stringify({ action, projectId }));
      navigate('/login');
      return;
    }
    
    // Handle the action for logged-in users
    switch (action) {
      case 'view':
        navigate(`/project/${projectId}`);
        break;
      case 'demo':
        // Open demo in new tab
        window.open(`/api/sandbox/run/${projectId}`, '_blank');
        break;
      case 'license':
        navigate(`/project/${projectId}?tab=license`);
        break;
    }
  };

  const ProjectCard: React.FC<{ project: Project }> = ({ project }) => (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden border border-gray-100">
      {/* Project Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-purple-600 cursor-pointer"
                onClick={() => handleProjectAction('view', project._id)}>
              {project.title}
            </h3>
            <p className="text-gray-600 text-sm line-clamp-2 mb-3">
              {project.description}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              project.license.type === 'free' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {project.license.type === 'free' ? 'Free' : `$${project.license.price}`}
            </span>
          </div>
        </div>

        {/* Author Info */}
        <div className="flex items-center mb-4">
          {project.author.profileImage ? (
            <img
              src={project.author.profileImage}
              alt={project.author.username}
              className="w-8 h-8 rounded-full mr-3"
            />
          ) : (
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
              {project.author.username.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-900">{project.author.username}</p>
            <p className="text-xs text-gray-500">{project.author.reputation} reputation</p>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
            {project.category}
          </span>
          {project.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
            >
              {tag}
            </span>
          ))}
          {project.tags.length > 3 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              +{project.tags.length - 3}
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <EyeIcon className="w-4 h-4 mr-1" />
              {project.stats.views}
            </span>
            <span className="flex items-center">
              <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
              {project.stats.downloads}
            </span>
            <span className="flex items-center">
              <StarIcon className="w-4 h-4 mr-1" />
              {project.stats.stars}
            </span>
          </div>
          <span className="text-xs text-gray-400">
            {new Date(project.createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={() => handleProjectAction('view', project._id)}
            className="flex-1 btn btn-primary text-sm"
          >
            <EyeIcon className="w-4 h-4 mr-2" />
            View Details
          </button>
          
          <button
            onClick={() => handleProjectAction('demo', project._id)}
            className="btn btn-secondary text-sm"
            title="Run Demo"
          >
            <PlayIcon className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => handleProjectAction('license', project._id)}
            className="btn btn-secondary text-sm"
            title={user ? 'Get License' : 'Login to License'}
          >
            {user ? <CodeBracketIcon className="w-4 h-4" /> : <LockClosedIcon className="w-4 h-4" />}
          </button>
          
          {project.license.type !== 'free' && (
            <button
              onClick={() => handleProjectAction('license', project._id)}
              className="btn btn-secondary text-sm"
              title={user ? 'Purchase' : 'Login to Purchase'}
            >
              {user ? <CurrencyDollarIcon className="w-4 h-4" /> : <LockClosedIcon className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Projects</h1>
        <p className="text-gray-600">
          Discover amazing projects from the vibe coder pack. Browse freely, login to interact.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* AI Search Helper */}
          <div className="lg:hidden mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <SparklesIcon className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <span className="font-medium">Try AI Search:</span> Describe what you're looking for naturally, like "I need a dashboard template with charts" or "looking for a payment integration library"
              </div>
            </div>
          </div>
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects... (e.g., 'I need a React component for user authentication')"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchProjects()}
                className="w-full pl-10 pr-16 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                onClick={handleAiSearch}
                disabled={aiSearching || !search.trim()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-purple-600 hover:text-purple-800 disabled:opacity-50 disabled:cursor-not-allowed"
                title="AI Smart Search"
              >
                {aiSearching ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                ) : (
                  <SparklesIcon className="w-4 h-4" />
                )}
              </button>
            </div>
            {isAiSearch && aiSearchSummary && (
              <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-start">
                  <SparklesIcon className="w-4 h-4 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-purple-800">
                    <span className="font-medium">AI Search: </span>
                    {aiSearchSummary}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Category Filter */}
          <div className="lg:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="lg:w-48">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-secondary lg:px-3"
          >
            <FunnelIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Extended Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                <select className="w-full input">
                  <option value="">Any Price</option>
                  <option value="free">Free Only</option>
                  <option value="0-10">$0 - $10</option>
                  <option value="10-50">$10 - $50</option>
                  <option value="50+">$50+</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <select className="w-full input">
                  <option value="">Any Rating</option>
                  <option value="4+">4+ Stars</option>
                  <option value="3+">3+ Stars</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Updated</label>
                <select className="w-full input">
                  <option value="">Any Time</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading projects...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => fetchProjects()}
            className="btn btn-primary"
          >
            Try Again
          </button>
        </div>
      ) : projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <MagnifyingGlassIcon className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-600 mb-6">
            Try adjusting your search criteria or browse all categories.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedCategory('all');
            }}
            className="btn btn-primary"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Login CTA for non-logged users */}
      {!user && (
        <div className="mt-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">
            Ready to dive deeper?
          </h3>
          <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
            Sign up to run demos, view source code, purchase licenses, and join the pack.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn bg-white text-purple-600 hover:bg-gray-50">
              Sign Up Free
            </Link>
            <Link to="/login" className="btn border-white text-white hover:bg-white hover:text-purple-600">
              Sign In
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default FindProjects;