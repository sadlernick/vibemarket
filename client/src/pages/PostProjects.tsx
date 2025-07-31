import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  CloudArrowUpIcon,
  CurrencyDollarIcon,
  CodeBracketIcon,
  DocumentTextIcon,
  LinkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import GitHubRepositoryPicker from '../components/GitHubRepositoryPicker';

const PostProjects: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    freeRepositoryUrl: '',
    paidRepositoryUrl: '',
    demoUrl: '',
    category: '',
    tags: '',
    licenseType: 'free',
    price: 0,
    features: {
      freeFeatures: '',
      paidFeatures: ''
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [isDraft, setIsDraft] = useState(false);

  const categories = [
    { value: '', label: 'Select Category' },
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

  // Load project data when in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      const loadProjectData = async () => {
        try {
          setLoading(true);
          console.log('Loading project with ID:', id);
          console.log('Request URL will be:', axios.defaults.baseURL + `/projects/${id}`);
          const response = await axios.get(`/projects/${id}`);
          console.log('Project loaded successfully:', response.data);
          const project = response.data.project || response.data;
          
          setFormData({
            title: project.title || '',
            description: project.description || '',
            freeRepositoryUrl: project.repository?.freeUrl || '',
            paidRepositoryUrl: project.repository?.paidUrl || '',
            demoUrl: project.demoUrl || '',
            category: project.category || '',
            tags: project.tags?.join(', ') || '',
            licenseType: project.license?.type || 'free',
            price: project.license?.price || 0,
            features: {
              freeFeatures: project.features?.freeFeatures || '',
              paidFeatures: project.features?.paidFeatures || ''
            }
          });
          
          setIsDraft(project.status === 'draft');
        } catch (err: any) {
          setError('Failed to load project data');
          console.error('Load project error:', err);
        } finally {
          setLoading(false);
        }
      };
      
      loadProjectData();
    }
  }, [isEditMode, id]);
  
  const calculateFees = (sellerPrice: number) => {
    // Seller sets their desired price
    // Marketplace fee is added on top (not deducted from seller price)
    const marketplaceFee = (sellerPrice * MARKETPLACE_FEE_PCT) / 100;
    const totalPrice = sellerPrice + marketplaceFee;
    const roundedTotalPrice = Math.round(totalPrice);
    
    return { 
      sellerPrice, // What seller receives
      marketplaceFee,
      totalPrice: roundedTotalPrice, // What customer pays (rounded)
      sellerEarnings: sellerPrice // Seller gets their full asking price
    };
  };

  const generateFakeGitHubUrl = (type: 'free' | 'paid') => {
    // Create valid GitHub username (letters, numbers, hyphens only, can't start/end with hyphen)
    let username = (user?.username || 'developer')
      .replace(/[^a-zA-Z0-9-]/g, '') // Remove invalid characters
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
      .toLowerCase();
    
    // Ensure username is not empty and doesn't start/end with hyphen
    if (!username || username.length === 0) {
      username = 'developer';
    }
    
    // Create valid repository name
    let projectSlug = formData.title
      ? formData.title.toLowerCase()
          .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .replace(/-+/g, '-') // Replace multiple hyphens with single
          .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
      : 'my-project';
    
    if (!projectSlug || projectSlug.length === 0) {
      projectSlug = 'my-project';
    }
    
    const suffix = type === 'paid' ? '-premium' : '-free';
    return `https://github.com/${username}/${projectSlug}${suffix}`;
  };

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

  const handleAIGenerate = async () => {
    if (!formData.title) {
      setError('Please fill in title before generating AI content');
      return;
    }

    setAiGenerating(true);
    setError('');

    try {
      const response = await axios.post('/projects/ai-generate', {
        projectName: formData.title,
        description: formData.description || `A project called ${formData.title}${formData.category ? ` in the ${formData.category} category` : ''}`
      });

      const aiData = response.data;

      setFormData(prev => ({
        ...prev,
        description: aiData.description || prev.description,
        tags: aiData.tags ? aiData.tags.join(', ') : prev.tags,
        freeRepositoryUrl: aiData.freeRepositoryUrl || prev.freeRepositoryUrl,
        paidRepositoryUrl: aiData.paidRepositoryUrl || prev.paidRepositoryUrl,
        features: {
          freeFeatures: aiData.features?.freeFeatures ? aiData.features.freeFeatures.join(', ') : prev.features.freeFeatures,
          paidFeatures: aiData.features?.paidFeatures ? aiData.features.paidFeatures.join(', ') : prev.features.paidFeatures
        }
      }));
    } catch (err: any) {
      setError('Failed to generate AI content. Please try again.');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, saveAsDraft = false) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const feeData = calculateFees(formData.price);
      
      const projectData = {
        title: formData.title,
        description: formData.description,
        repository: {
          freeUrl: formData.freeRepositoryUrl || (formData.licenseType !== 'paid' ? generateFakeGitHubUrl('free') : ''),
          paidUrl: formData.paidRepositoryUrl || (formData.licenseType !== 'free' ? generateFakeGitHubUrl('paid') : '')
        },
        demo: formData.demoUrl ? { url: formData.demoUrl } : undefined,
        category: formData.category,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        license: {
          type: formData.licenseType,
          price: formData.licenseType === 'paid' ? feeData.totalPrice : 0, // Customer pays this amount
          sellerPrice: formData.licenseType === 'paid' ? feeData.sellerPrice : 0, // Seller receives this
          marketplaceFeePct: MARKETPLACE_FEE_PCT,
          sellerEarnings: formData.licenseType === 'paid' ? feeData.sellerEarnings : 0,
          currency: 'USD',
          features: {
            freeFeatures: formData.features.freeFeatures.split(',').map(f => f.trim()).filter(f => f),
            paidFeatures: formData.features.paidFeatures.split(',').map(f => f.trim()).filter(f => f)
          }
        }
      };

      console.log('Sending project data:', JSON.stringify(projectData, null, 2));
      
      let response: any;
      if (isEditMode && id) {
        // Update existing project
        const endpoint = saveAsDraft ? `/projects/${id}/draft` : `/projects/${id}`;
        response = await axios.put(endpoint, projectData);
      } else {
        // Create new project
        const endpoint = saveAsDraft ? '/projects/draft' : '/projects';
        response = await axios.post(endpoint, projectData);
      }
      
      console.log('Server response:', response.data);
      
      if (saveAsDraft) {
        setIsDraft(true);
        setSuccess(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setSuccess(true);
        const projectId = response.data.project?._id || response.data._id || response.data.id;
        console.log('Navigating to project:', projectId);
        setTimeout(() => {
          navigate(`/project/${projectId}`);
        }, 2000);
      }
    } catch (err: any) {
      console.error('Project operation error:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.error || `Failed to ${isEditMode ? 'update' : 'create'} project`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-6">
            <CloudArrowUpIcon className="w-10 h-10 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Share Your Projects with the World
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of developers who are monetizing their code and building their reputation on VibeMarket.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CurrencyDollarIcon className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Earn Revenue</h3>
              <p className="text-gray-600">Monetize your projects with flexible pricing and licensing options.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <CodeBracketIcon className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Showcase Skills</h3>
              <p className="text-gray-600">Build your developer portfolio and gain recognition in the community.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <CloudArrowUpIcon className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Easy Setup</h3>
              <p className="text-gray-600">Simple project upload with automatic sandboxing and demo generation.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn btn-primary text-lg px-8 py-3">
              Sign Up to Post Projects
            </Link>
            <Link to="/login" className="btn btn-secondary text-lg px-8 py-3">
              Already Have an Account?
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircleIcon className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {isDraft ? 'Draft Saved Successfully!' : 'Project Created Successfully!'}
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          {isDraft 
            ? 'Your project draft has been saved. You can review and publish it later from your dashboard.' 
            : 'Your project has been uploaded and is now live on VibeMarket. Redirecting to your project page...'
          }
        </p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {isEditMode ? 'Edit Project' : 'Post a New Project'}
        </h1>
        <p className="text-gray-600">
          Share your project with the VibeMarket community and start earning from your code.
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-red-700">{error}</div>
            </div>
          )}

          {/* Basic Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DocumentTextIcon className="w-5 h-5 mr-2 text-purple-600" />
              Project Information
            </h2>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Project Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Enter your project title"
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description *
                  </label>
                  <button
                    type="button"
                    onClick={handleAIGenerate}
                    disabled={aiGenerating || !formData.title}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {aiGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-700 mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="w-4 h-4 mr-2" />
                        AI Generate
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={8}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Describe what your project does, its key features, and what problems it solves... Or use AI Generate to create content automatically!"
                />
                <p className="mt-1 text-sm text-gray-500">
                  💡 Fill in the title and category above, then click "AI Generate" to automatically create a professional description
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleInputChange}
                    className="input"
                  >
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    id="tags"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="react, javascript, api (comma-separated)"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Links */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <LinkIcon className="w-5 h-5 mr-2 text-purple-600" />
              Project Links
            </h2>
            
            <div className="grid grid-cols-1 gap-6">
              {(formData.licenseType === 'free' || formData.licenseType === 'freemium') && (
                <GitHubRepositoryPicker
                  value={formData.freeRepositoryUrl}
                  onChange={(url) => setFormData(prev => ({ ...prev, freeRepositoryUrl: url }))}
                  label="Free Version Repository URL"
                  placeholder="Enter GitHub repository URL for the free version"
                  required={formData.licenseType === 'free' || formData.licenseType === 'freemium'}
                />
              )}

              {(formData.licenseType === 'paid' || formData.licenseType === 'freemium') && (
                <GitHubRepositoryPicker
                  value={formData.paidRepositoryUrl}
                  onChange={(url) => setFormData(prev => ({ ...prev, paidRepositoryUrl: url }))}
                  label="Paid Version Repository URL"
                  placeholder="Enter GitHub repository URL for the paid version"
                  required={formData.licenseType === 'paid' || formData.licenseType === 'freemium'}
                />
              )}
              
              <div>
                <label htmlFor="demoUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  Demo URL (Optional)
                </label>
                <input
                  type="url"
                  id="demoUrl"
                  name="demoUrl"
                  value={formData.demoUrl}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="https://yourproject.com/demo"
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CurrencyDollarIcon className="w-5 h-5 mr-2 text-purple-600" />
              Pricing & Licensing
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  License Type *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="relative flex cursor-pointer rounded-lg border border-gray-300 p-4 focus:outline-none">
                    <input
                      type="radio"
                      name="licenseType"
                      value="free"
                      checked={formData.licenseType === 'free'}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className="flex flex-1">
                      <div className="flex flex-col">
                        <span className="block text-sm font-medium text-gray-900">Free</span>
                        <span className="mt-1 flex items-center text-sm text-gray-500">
                          Open source, free to use
                        </span>
                      </div>
                    </div>
                    <CheckCircleIcon
                      className={`h-5 w-5 ${
                        formData.licenseType === 'free' ? 'text-purple-600' : 'text-gray-300'
                      }`}
                    />
                  </label>
                  
                  <label className="relative flex cursor-pointer rounded-lg border border-gray-300 p-4 focus:outline-none">
                    <input
                      type="radio"
                      name="licenseType"
                      value="paid"
                      checked={formData.licenseType === 'paid'}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className="flex flex-1">
                      <div className="flex flex-col">
                        <span className="block text-sm font-medium text-gray-900">Paid Only</span>
                        <span className="mt-1 flex items-center text-sm text-gray-500">
                          Premium version only
                        </span>
                      </div>
                    </div>
                    <CheckCircleIcon
                      className={`h-5 w-5 ${
                        formData.licenseType === 'paid' ? 'text-purple-600' : 'text-gray-300'
                      }`}
                    />
                  </label>

                  <label className="relative flex cursor-pointer rounded-lg border border-gray-300 p-4 focus:outline-none">
                    <input
                      type="radio"
                      name="licenseType"
                      value="freemium"
                      checked={formData.licenseType === 'freemium'}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className="flex flex-1">
                      <div className="flex flex-col">
                        <span className="block text-sm font-medium text-gray-900">Freemium</span>
                        <span className="mt-1 flex items-center text-sm text-gray-500">
                          Both free & paid versions
                        </span>
                      </div>
                    </div>
                    <CheckCircleIcon
                      className={`h-5 w-5 ${
                        formData.licenseType === 'freemium' ? 'text-purple-600' : 'text-gray-300'
                      }`}
                    />
                  </label>
                </div>
              </div>
              
              {(formData.licenseType === 'paid' || formData.licenseType === 'freemium') && (
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                    Your Price (USD) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      min="0"
                      step="0.01"
                      required={formData.licenseType === 'paid' || formData.licenseType === 'freemium'}
                      value={formData.price}
                      onChange={handleInputChange}
                      className="input pl-8"
                      placeholder="0.00"
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(formData.licenseType === 'free' || formData.licenseType === 'freemium') && (
                  <div>
                    <label htmlFor="features.freeFeatures" className="block text-sm font-medium text-gray-700 mb-2">
                      {formData.licenseType === 'freemium' ? 'Free Version Features' : 'Features Included'}
                    </label>
                    <textarea
                      id="features.freeFeatures"
                      name="features.freeFeatures"
                      rows={3}
                      value={formData.features.freeFeatures}
                      onChange={handleInputChange}
                      className="input"
                      placeholder="Basic usage, view source code, personal use (comma-separated)"
                    />
                  </div>
                )}
                
                {(formData.licenseType === 'paid' || formData.licenseType === 'freemium') && (
                  <div>
                    <label htmlFor="features.paidFeatures" className="block text-sm font-medium text-gray-700 mb-2">
                      {formData.licenseType === 'freemium' ? 'Paid Version Features' : 'Features Included'}
                    </label>
                    <textarea
                      id="features.paidFeatures"
                      name="features.paidFeatures"
                      rows={3}
                      value={formData.features.paidFeatures}
                      onChange={handleInputChange}
                      className="input"
                      placeholder="Commercial use, support, updates, white-label (comma-separated)"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              By posting, you agree to our Terms of Service and confirm you have rights to this code.
            </div>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => navigate('/find-projects')}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={loading || !formData.title}
                className="btn btn-outline"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <DocumentTextIcon className="w-4 h-4 mr-2" />
                    Save as Draft
                  </>
                )}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
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
        </form>
      </div>
    </div>
  );
};

export default PostProjects;