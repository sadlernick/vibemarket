import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Helmet } from 'react-helmet-async';
import StripeProvider from '../components/Payments/StripeProvider';
import CheckoutForm from '../components/Payments/CheckoutForm';
import axios from 'axios';
import {
  PlayIcon,
  CodeBracketIcon,
  ArrowDownTrayIcon,
  StarIcon,
  EyeIcon,
  UserIcon,
  LockClosedIcon,
  ShoppingCartIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface Project {
  _id: string;
  title: string;
  description: string;
  author: {
    _id: string;
    username: string;
    profileImage?: string;
    reputation: number;
  };
  category: string;
  tags: string[];
  tech_stack?: string[];
  license: {
    type: 'free' | 'paid' | 'freemium';
    price: number;
    currency: string;
    marketplaceFeePct: number;
    sellerEarnings: number;
    features: {
      freeFeatures: string[];
      paidFeatures: string[];
    };
  };
  repository: {
    freeUrl?: string;
    paidUrl?: string;
  };
  demo?: {
    url: string;
  };
  stats: {
    views: number;
    downloads: number;
    stars: number;
  };
  createdAt: string;
}

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [userLicense, setUserLicense] = useState<any>(null);

  const fetchProject = useCallback(async () => {
    try {
      const response = await axios.get(`/projects/${id}`);
      setProject(response.data.project);
      setUserLicense(response.data.userLicense);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchProject();
    }
  }, [id, fetchProject]);

  const handlePurchaseClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setShowCheckout(true);
  };

  const handlePurchaseSuccess = () => {
    setShowCheckout(false);
    fetchProject(); // Refresh to get updated license info
  };

  const requiresLogin = (action: string) => {
    if (!user) {
      return (
        <div className="text-center py-6 bg-gray-50 rounded-lg">
          <LockClosedIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Sign in to {action}</p>
          <div className="space-x-4">
            <Link to="/login" className="btn btn-primary">
              Sign In
            </Link>
            <Link to="/register" className="btn btn-secondary">
              Sign Up
            </Link>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Project Not Found</h1>
        <p className="text-gray-600 mb-8">{error || 'The project you are looking for does not exist.'}</p>
        <Link to="/find-projects" className="btn btn-primary">
          Browse Projects
        </Link>
      </div>
    );
  }

  const hasAccess = project.license.type === 'free' || userLicense?.isActive;
  const marketplaceFee = (project.license.price * project.license.marketplaceFeePct) / 100;
  const sellerEarnings = project.license.price - marketplaceFee;

  // Generate SEO-optimized meta data
  const generateSEOData = () => {
    if (!project) return {};
    
    const title = `${project.title} - ${project.category} Project | PackCode`;
    const description = project.description.length > 160 
      ? project.description.substring(0, 157) + '...'
      : project.description;
    const keywords = [
      project.title.toLowerCase(),
      project.category,
      ...project.tags,
      ...(project.tech_stack || []),
      'open source',
      'code repository',
      'developer tools'
    ].join(', ');

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": project.title,
      "description": project.description,
      "category": project.category,
      "author": {
        "@type": "Person",
        "name": project.author.username,
        "url": `${window.location.origin}/author/${project.author._id}`
      },
      "programmingLanguage": project.tags,
      "operatingSystem": "Cross-platform",
      "applicationCategory": `${project.category} Software`,
      "aggregateRating": project.stats.stars > 0 ? {
        "@type": "AggregateRating",
        "ratingValue": "4.5",
        "ratingCount": project.stats.stars,
        "bestRating": "5",
        "worstRating": "1"
      } : undefined,
      "interactionStatistic": [
        {
          "@type": "InteractionCounter",
          "interactionType": "https://schema.org/ViewAction",
          "userInteractionCount": project.stats.views
        },
        {
          "@type": "InteractionCounter", 
          "interactionType": "https://schema.org/DownloadAction",
          "userInteractionCount": project.stats.downloads
        }
      ],
      "url": window.location.href,
      ...(project.license.type === 'free' ? {
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock"
        }
      } : {})
    };

    return { title, description, keywords, structuredData };
  };

  const seoData = generateSEOData();

  return (
    <>
      {project && (
        <Helmet>
          <title>{seoData.title}</title>
          <meta name="description" content={seoData.description} />
          <meta name="keywords" content={seoData.keywords} />
          
          {/* Open Graph / Facebook */}
          <meta property="og:type" content="website" />
          <meta property="og:url" content={window.location.href} />
          <meta property="og:title" content={seoData.title} />
          <meta property="og:description" content={seoData.description} />
          <meta property="og:site_name" content="PackCode" />
          
          {/* Twitter */}
          <meta property="twitter:card" content="summary_large_image" />
          <meta property="twitter:url" content={window.location.href} />
          <meta property="twitter:title" content={seoData.title} />
          <meta property="twitter:description" content={seoData.description} />
          
          {/* Additional SEO tags */}
          <meta name="author" content={project.author.username} />
          <meta name="robots" content="index, follow" />
          <link rel="canonical" href={window.location.href} />
          
          {/* Structured Data */}
          <script type="application/ld+json">
            {JSON.stringify(seoData.structuredData)}
          </script>
        </Helmet>
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                  {project.category}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  project.license.type === 'free' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {project.license.type === 'free' ? 'Free' : `$${project.license.price}`}
                </span>
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{project.title}</h1>
            
            <div className="flex items-center space-x-6 text-sm text-gray-500 mb-6">
              <span className="flex items-center">
                <EyeIcon className="w-4 h-4 mr-1" />
                {project.stats.views} views
              </span>
              <span className="flex items-center">
                <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                {project.stats.downloads} downloads
              </span>
              <span className="flex items-center">
                <StarIcon className="w-4 h-4 mr-1" />
                {project.stats.stars} stars
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">About This Project</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{project.description}</p>
            
            {/* Use Cases Section */}
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Perfect For</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center text-gray-700">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                    <span>Developers looking for {project.category} solutions</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                    <span>Teams building with {project.tech_stack?.[0] || project.tags[0]}</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                    <span>Learning {project.tags.slice(0, 2).join(' and ')} development</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-700">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                    <span>Rapid prototyping and MVP development</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                    <span>Production-ready {project.category} applications</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                    <span>Educational and learning projects</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Technologies</h2>
            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Features */}
          {(project.license.features.freeFeatures.length > 0 || project.license.features.paidFeatures.length > 0) && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Features</h2>
              
              {project.license.type === 'freemium' ? (
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Free Version</h3>
                    <ul className="space-y-2">
                      {project.license.features.freeFeatures.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Paid Version</h3>
                    <ul className="space-y-2">
                      {project.license.features.paidFeatures.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircleIcon className="w-5 h-5 text-purple-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <ul className="space-y-2">
                  {(project.license.type === 'free' ? project.license.features.freeFeatures : project.license.features.paidFeatures).map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Author */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">About the Developer</h2>
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                <UserIcon className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <Link 
                  to={`/author/${project.author._id}`} 
                  className="text-lg font-medium text-gray-900 hover:text-purple-600 transition-colors"
                >
                  {project.author.username}
                </Link>
                <p className="text-sm text-gray-500 mb-3">{project.author.reputation} reputation points</p>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <p>Specializes in {project.category} development with expertise in {project.tags.slice(0, 3).join(', ')}</p>
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <EyeIcon className="w-4 h-4 mr-1" />
                      {project.stats.views} views
                    </span>
                    <span className="flex items-center">
                      <StarIcon className="w-4 h-4 mr-1" />
                      {project.stats.stars} stars
                    </span>
                    <span className="flex items-center">
                      <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                      {project.stats.downloads} downloads
                    </span>
                  </div>
                </div>
                
                <Link 
                  to={`/author/${project.author._id}`}
                  className="inline-flex items-center mt-3 text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  View all projects by {project.author.username}
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Purchase/Access Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {project.license.type === 'free' ? (
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Free & Open Source</h3>
                <p className="text-gray-600 mb-6">This project is completely free to use and modify.</p>
                {user ? (
                  hasAccess ? (
                    <a
                      href={project.repository.freeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full btn btn-primary flex items-center justify-center"
                    >
                      <CodeBracketIcon className="w-4 h-4 mr-2" />
                      View Repository
                    </a>
                  ) : (
                    requiresLogin('access this project')
                  )
                ) : (
                  <div>
                    <div className="w-full btn btn-primary flex items-center justify-center mb-3">
                      <CodeBracketIcon className="w-4 h-4 mr-2" />
                      Free Access
                    </div>
                    <Link to="/login" className="text-sm text-purple-600 hover:text-purple-700">
                      Sign in to access repository
                    </Link>
                  </div>
                )}
              </div>
            ) : userLicense?.isActive ? (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircleIcon className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">You own this project</h3>
                <p className="text-gray-600 mb-6">You have access to the full version.</p>
                <a
                  href={project.repository.paidUrl || project.repository.freeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full btn btn-primary flex items-center justify-center"
                >
                  <CodeBracketIcon className="w-4 h-4 mr-2" />
                  View Repository
                </a>
              </div>
            ) : (
              <div className="text-center">
                {user ? (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      ${project.license.price}
                    </h3>
                    <p className="text-gray-600 mb-4">One-time purchase</p>
                    
                    <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Price:</span>
                        <span>${project.license.price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Marketplace fee:</span>
                        <span className="text-gray-600">-${marketplaceFee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-medium pt-2 border-t">
                        <span>Creator earns:</span>
                        <span className="text-green-600">${sellerEarnings.toFixed(2)}</span>
                      </div>
                    </div>

                    <button
                      onClick={handlePurchaseClick}
                      className="w-full btn btn-primary flex items-center justify-center mb-4"
                    >
                      <ShoppingCartIcon className="w-4 h-4 mr-2" />
                      Purchase Project
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Premium Project</h3>
                    <p className="text-gray-600 mb-6">Advanced features and commercial license available.</p>
                    
                    <div className="space-y-3">
                      <div className="w-full btn btn-primary flex items-center justify-center">
                        <LockClosedIcon className="w-4 h-4 mr-2" />
                        Sign in to Purchase
                      </div>
                      <Link to="/login" className="text-sm text-purple-600 hover:text-purple-700">
                        Create account to see pricing
                      </Link>
                    </div>
                  </>
                )}

                {project.repository.freeUrl && (
                  <a
                    href={project.repository.freeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full btn btn-secondary flex items-center justify-center mt-3"
                  >
                    <EyeIcon className="w-4 h-4 mr-2" />
                    Preview Free Version
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Demo Link */}
          {project.demo?.url && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Demo</h3>
              <a
                href={project.demo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full btn btn-secondary flex items-center justify-center"
              >
                <PlayIcon className="w-4 h-4 mr-2" />
                Try Demo
              </a>
            </div>
          )}

          {/* Project Stats */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Views:</span>
                <span className="font-medium">{project.stats.views}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Downloads:</span>
                <span className="font-medium">{project.stats.downloads}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Stars:</span>
                <span className="font-medium">{project.stats.stars}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span className="font-medium">
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowCheckout(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-transparent rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <StripeProvider>
                <CheckoutForm
                  projectId={project._id}
                  projectTitle={project.title}
                  amount={project.license.price}
                  marketplaceFee={marketplaceFee}
                  sellerAmount={sellerEarnings}
                  onSuccess={handlePurchaseSuccess}
                  onCancel={() => setShowCheckout(false)}
                />
              </StripeProvider>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default ProjectDetail;