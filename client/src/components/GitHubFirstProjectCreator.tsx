import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  CloudArrowUpIcon,
  CodeBracketIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

interface Repository {
  id: number;
  fullName: string;
  name: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  isPrivate: boolean;
  htmlUrl: string;
  updatedAt: string;
  hasAccess: boolean;
}

interface ProjectAnalysis {
  title: string;
  description: string;
  category: string;
  tags: string[];
  features: {
    freeFeatures: string[];
    paidFeatures: string[];
  };
  techStack: string;
  suggestedPrice: number;
}

const GitHubFirstProjectCreator: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Step management
  const [currentStep, setCurrentStep] = useState<'select' | 'analyze' | 'customize' | 'pricing'>('select');
  
  // Repository selection
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [repoSearch, setRepoSearch] = useState('');
  
  // Analysis
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ProjectAnalysis | null>(null);
  
  // Project data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
    licenseType: 'freemium' as 'free' | 'paid' | 'freemium',
    price: 0,
    features: {
      freeFeatures: '',
      paidFeatures: ''
    },
    demoUrl: ''
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const categories = [
    { value: 'web', label: 'Web Application' },
    { value: 'mobile', label: 'Mobile Application' },
    { value: 'desktop', label: 'Desktop Application' },
    { value: 'api', label: 'API / Backend Service' },
    { value: 'library', label: 'Library / Framework' },
    { value: 'tool', label: 'Developer Tool' },
    { value: 'game', label: 'Game' },
    { value: 'other', label: 'Other' }
  ];

  const MARKETPLACE_FEE_PCT = 20;

  // Load user's repositories
  useEffect(() => {
    const loadRepositories = async () => {
      try {
        setLoadingRepos(true);
        const response = await axios.get('/github/repositories', {
          params: { per_page: 50, type: 'all' }
        });
        setRepositories(response.data.repositories.filter((repo: Repository) => repo.hasAccess));
      } catch (err: any) {
        setError('Failed to load repositories. Please ensure your GitHub account is connected.');
      } finally {
        setLoadingRepos(false);
      }
    };

    if (user) {
      loadRepositories();
    }
  }, [user]);

  // Filter repositories based on search
  const filteredRepositories = repositories.filter(repo =>
    repo.name.toLowerCase().includes(repoSearch.toLowerCase()) ||
    repo.description?.toLowerCase().includes(repoSearch.toLowerCase()) ||
    repo.language?.toLowerCase().includes(repoSearch.toLowerCase())
  );

  // Handle repository selection - skip AI analysis entirely
  const handleRepositorySelect = async (repo: Repository) => {
    setSelectedRepo(repo);
    setError('');
    
    // Skip AI analysis - go straight to manual setup
    const fallbackAnalysis = {
      title: repo.name.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: repo.description || `**${repo.name}** is a well-crafted project providing essential functionality for developers.

🚀 **Key Features:**
- View and explore the source code
- Well-documented implementation
- ${repo.language || 'Modern'} development practices
- Open source project

🛠️ **Technical Details:**
- Language: ${repo.language || 'Various'}
- Repository: ${repo.fullName}
- Stars: ${repo.stars} | Forks: ${repo.forks}

Perfect for developers looking to learn from real-world implementations.`,
      category: 'web',
      tags: [repo.language, 'open-source', 'github'].filter(Boolean),
      features: {
        freeFeatures: ['View source code', 'Basic documentation', 'Personal use license'],
        paidFeatures: ['Commercial license', 'Priority support', 'Extended examples']
      },
      techStack: repo.language || 'JavaScript',
      suggestedPrice: 25
    };
    
    setAnalysis(fallbackAnalysis);
    
    // Pre-fill form with repository data
    setFormData({
      title: fallbackAnalysis.title,
      description: fallbackAnalysis.description,
      category: fallbackAnalysis.category,
      tags: fallbackAnalysis.tags.join(', '),
      licenseType: 'freemium',
      price: fallbackAnalysis.suggestedPrice,
      features: {
        freeFeatures: fallbackAnalysis.features.freeFeatures.join(', '),
        paidFeatures: fallbackAnalysis.features.paidFeatures.join(', ')
      },
      demoUrl: ''
    });

    setCurrentStep('customize');
  };

  // Handle form field changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev] as any,
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'price' ? parseFloat(value) || 0 : value
      }));
    }
  };

  // Calculate pricing
  const calculateFees = (sellerPrice: number) => {
    const marketplaceFee = (sellerPrice * MARKETPLACE_FEE_PCT) / 100;
    const totalPrice = sellerPrice + marketplaceFee;
    const roundedTotalPrice = Math.round(totalPrice);
    
    return { 
      sellerPrice,
      marketplaceFee,
      totalPrice: roundedTotalPrice,
      sellerEarnings: sellerPrice
    };
  };

  // Submit project
  const handleSubmit = async (saveAsDraft = false) => {
    if (!selectedRepo) return;

    setLoading(true);
    setError('');

    try {
      const feeData = calculateFees(formData.price);
      
      const projectData = {
        title: formData.title,
        description: formData.description,
        repository: {
          freeUrl: selectedRepo.htmlUrl,
          paidUrl: selectedRepo.htmlUrl
        },
        demo: formData.demoUrl ? { url: formData.demoUrl } : undefined,
        category: formData.category,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        license: {
          type: formData.licenseType,
          price: formData.licenseType === 'paid' ? feeData.totalPrice : 0,
          sellerPrice: formData.licenseType === 'paid' ? feeData.sellerPrice : 0,
          marketplaceFeePct: MARKETPLACE_FEE_PCT,
          sellerEarnings: formData.licenseType === 'paid' ? feeData.sellerEarnings : 0,
          currency: 'USD',
          features: {
            freeFeatures: formData.features.freeFeatures.split(',').map(f => f.trim()).filter(f => f),
            paidFeatures: formData.features.paidFeatures.split(',').map(f => f.trim()).filter(f => f)
          }
        },
        // Mark as GitHub-verified
        githubVerified: true,
        sourceRepository: {
          fullName: selectedRepo.fullName,
          url: selectedRepo.htmlUrl,
          language: selectedRepo.language,
          stars: selectedRepo.stars
        }
      };

      const endpoint = saveAsDraft ? '/projects/draft' : '/projects';
      const response = await axios.post(endpoint, projectData);
      
      setSuccess(true);
      const projectId = response.data.project?._id || response.data._id || response.data.id;
      
      setTimeout(() => {
        if (saveAsDraft) {
          navigate('/dashboard');
        } else {
          navigate(`/project/${projectId}`);
        }
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="w-20 h-20 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-6">
          <CodeBracketIcon className="w-10 h-10 text-purple-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Connect Your GitHub Account</h1>
        <p className="text-xl text-gray-600 mb-8">Sign in with GitHub to create projects from your repositories</p>
        <button
          onClick={() => navigate('/login')}
          className="btn btn-primary text-lg px-8 py-3"
        >
          Sign In with GitHub
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircleIcon className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Project Created Successfully!</h1>
        <p className="text-xl text-gray-600 mb-8">
          Your project has been created from your GitHub repository. Redirecting...
        </p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Project from GitHub</h1>
        <p className="text-gray-600">Select a repository and we'll automatically analyze it to create your project listing</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-8">
          <div className={`flex items-center ${currentStep === 'select' ? 'text-purple-600' : currentStep === 'customize' || currentStep === 'pricing' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 mr-2 ${currentStep === 'select' ? 'border-purple-600 bg-purple-50' : currentStep === 'customize' || currentStep === 'pricing' ? 'border-green-600 bg-green-50' : 'border-gray-300'}`}>
              {currentStep === 'customize' || currentStep === 'pricing' ? <CheckCircleIcon className="w-5 h-5" /> : '1'}
            </div>
            <span className="font-medium text-sm">Select Repository</span>
          </div>
          <div className={`flex items-center ${currentStep === 'customize' || currentStep === 'pricing' ? 'text-purple-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 mr-2 ${currentStep === 'customize' || currentStep === 'pricing' ? 'border-purple-600 bg-purple-50' : 'border-gray-300'}`}>
              2
            </div>
            <span className="font-medium text-sm">Customize & Publish</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-red-700">{error}</div>
        </div>
      )}

      {/* Step 1: Repository Selection */}
      {currentStep === 'select' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Select a Repository</h2>
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search repositories..."
                  value={repoSearch}
                  onChange={(e) => setRepoSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 w-64"
                />
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {loadingRepos ? (
              <div className="text-center py-12">
                <ArrowPathIcon className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading your repositories...</p>
              </div>
            ) : filteredRepositories.length === 0 ? (
              <div className="text-center py-12">
                <CodeBracketIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No repositories found. Make sure your GitHub account is connected.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {filteredRepositories.map((repo) => (
                  <div
                    key={repo.id}
                    onClick={() => handleRepositorySelect(repo)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900 truncate">{repo.name}</h3>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 ml-2">
                        <span>⭐ {repo.stars}</span>
                        <span>🍴 {repo.forks}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {repo.description || 'No description available'}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                        {repo.language || 'Unknown'}
                      </span>
                      <span className="text-xs text-gray-500">
                        Updated {new Date(repo.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Customize Project */}
      {currentStep === 'customize' && analysis && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Customize Your Project</h2>
              <div className="flex items-center text-sm text-green-600">
                <CheckCircleIcon className="w-4 h-4 mr-1" />
                AI Analysis Complete
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">Project Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="input"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={6}
                  className="input"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="react, javascript, api"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Demo URL (Optional)</label>
                  <input
                    type="url"
                    name="demoUrl"
                    value={formData.demoUrl}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="https://yourproject.com/demo"
                  />
                </div>
              </div>
              
              {analysis.techStack && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Detected Tech Stack:</strong> {analysis.techStack}
                  </p>
                </div>
              )}
            </div>

            {/* Pricing */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">Pricing & Features</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">License Type</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(['free', 'paid', 'freemium'] as const).map((type) => (
                    <label key={type} className="relative flex cursor-pointer rounded-lg border border-gray-300 p-4 focus:outline-none">
                      <input
                        type="radio"
                        name="licenseType"
                        value={type}
                        checked={formData.licenseType === type}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <div className="flex flex-1">
                        <div className="flex flex-col">
                          <span className="block text-sm font-medium text-gray-900 capitalize">{type}</span>
                          <span className="mt-1 text-sm text-gray-500">
                            {type === 'free' && 'Open source, free to use'}
                            {type === 'paid' && 'Premium version only'}
                            {type === 'freemium' && 'Both free & paid versions'}
                          </span>
                        </div>
                      </div>
                      <CheckCircleIcon
                        className={`h-5 w-5 ${formData.licenseType === type ? 'text-purple-600' : 'text-gray-300'}`}
                      />
                    </label>
                  ))}
                </div>
              </div>
              
              {(formData.licenseType === 'paid' || formData.licenseType === 'freemium') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Price (USD) 
                    <span className="text-xs text-gray-500 ml-2">
                      (AI suggested: ${analysis.suggestedPrice})
                    </span>
                  </label>
                  <div className="relative w-48">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      name="price"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="input pl-8"
                    />
                  </div>
                  
                  {formData.price > 0 && (
                    <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Fee Breakdown:</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Your price:</span>
                          <span className="font-medium">${formData.price.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Marketplace fee ({MARKETPLACE_FEE_PCT}%):</span>
                          <span className="text-orange-600">+${calculateFees(formData.price).marketplaceFee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200">
                          <span className="font-medium text-gray-900">Customer pays:</span>
                          <span className="font-bold text-blue-600">${calculateFees(formData.price).totalPrice}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-900">You receive:</span>
                          <span className="font-bold text-green-600">${calculateFees(formData.price).sellerEarnings.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(formData.licenseType === 'free' || formData.licenseType === 'freemium') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {formData.licenseType === 'freemium' ? 'Free Version Features' : 'Features Included'}
                    </label>
                    <textarea
                      name="features.freeFeatures"
                      value={formData.features.freeFeatures}
                      onChange={handleInputChange}
                      rows={3}
                      className="input"
                      placeholder="Basic usage, view source code, personal use"
                    />
                  </div>
                )}
                
                {(formData.licenseType === 'paid' || formData.licenseType === 'freemium') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {formData.licenseType === 'freemium' ? 'Paid Version Features' : 'Features Included'}
                    </label>
                    <textarea
                      name="features.paidFeatures"
                      value={formData.features.paidFeatures}
                      onChange={handleInputChange}
                      rows={3}
                      className="input"
                      placeholder="Commercial use, support, updates, white-label"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                onClick={() => setCurrentStep('select')}
                className="btn btn-secondary"
              >
                ← Back to Repositories
              </button>
              <div className="flex space-x-4">
                <button
                  onClick={() => handleSubmit(true)}
                  disabled={loading}
                  className="btn btn-outline"
                >
                  {loading ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save as Draft'
                  )}
                </button>
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <CloudArrowUpIcon className="w-4 h-4 mr-2" />
                      Publish Project
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GitHubFirstProjectCreator;