import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  ChartBarIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  StarIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  CloudArrowUpIcon,
  TrashIcon,
  CalendarIcon,
  ShoppingBagIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';

interface Project {
  _id: string;
  title: string;
  description: string;
  category: string;
  license: {
    type: string;
    price: number;
  };
  stats: {
    views: number;
    downloads: number;
    stars: number;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Purchase {
  _id: string;
  project: {
    _id: string;
    title: string;
    author: {
      username: string;
    };
    license: {
      price: number;
    };
  };
  purchaseDate: string;
}

interface SellerStats {
  totalProjects: number;
  totalViews: number;
  totalDownloads: number;
  totalStars: number;
  totalRevenue: number;
  monthlyRevenue: number;
  paidDownloads: number;
  freeDownloads: number;
}

interface Activity {
  type: string;
  message: string;
  date: string;
  revenue?: number;
}

interface DashboardData {
  publishedProjects: Project[];
  draftProjects: Project[];
  purchasedLicenses: Purchase[];
  sellerStats: SellerStats;
  recentActivity: Activity[];
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'drafts' | 'purchases'>('overview');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchDashboardData();
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    try {
      console.log('Fetching dashboard data...');
      console.log('Current axios headers:', axios.defaults.headers.common);
      const response = await axios.get('/dashboard');
      setDashboardData(response.data);
    } catch (err: any) {
      console.error('Dashboard error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        headers: err.response?.headers
      });
      if (err.response?.status === 401) {
        setError('Please log in to view dashboard');
      } else {
        setError('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDraft = async (draftId: string) => {
    if (!window.confirm('Are you sure you want to delete this draft?')) return;

    try {
      await axios.delete(`/projects/${draftId}`);
      // Refresh data
      fetchDashboardData();
    } catch (err: any) {
      setError('Failed to delete draft');
    }
  };

  const handlePublishDraft = async (draftId: string) => {
    try {
      await axios.post(`/projects/${draftId}/publish`);
      // Refresh data
      fetchDashboardData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to publish draft');
    }
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
            ))}
          </div>
          <div className="bg-gray-200 h-64 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-700">{error}</div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const { publishedProjects, draftProjects, purchasedLicenses, sellerStats, recentActivity } = dashboardData;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user.username}!
        </h1>
        <p className="text-gray-600">
          Here's what's happening with your projects and purchases.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DocumentTextIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Published Projects</p>
              <p className="text-2xl font-bold text-gray-900">{sellerStats.totalProjects}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <EyeIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-gray-900">{sellerStats.totalViews.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ArrowDownTrayIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Downloads</p>
              <p className="text-2xl font-bold text-gray-900">{sellerStats.totalDownloads}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <CurrencyDollarIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${sellerStats.totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'overview', label: 'Overview', icon: ChartBarIcon },
              { key: 'projects', label: 'Published Projects', icon: DocumentTextIcon },
              { key: 'drafts', label: 'Drafts', icon: PencilIcon },
              { key: 'purchases', label: 'Purchases', icon: ShoppingBagIcon }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
                {tab.key === 'drafts' && draftProjects.length > 0 && (
                  <span className="ml-2 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                    {draftProjects.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Stats and Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Seller Analytics */}
            {sellerStats.totalProjects > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <ArrowTrendingUpIcon className="w-5 h-5 mr-2 text-purple-600" />
                  Seller Analytics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{sellerStats.totalStars}</p>
                    <p className="text-sm text-gray-600">Total Stars</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{sellerStats.freeDownloads}</p>
                    <p className="text-sm text-gray-600">Free Downloads</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{sellerStats.paidDownloads}</p>
                    <p className="text-sm text-gray-600">Paid Downloads</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">${sellerStats.monthlyRevenue.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">This Month</p>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              {recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.slice(0, 5).map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <BanknotesIcon className="w-5 h-5 text-green-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.date).toLocaleDateString()}
                        </p>
                      </div>
                      {activity.revenue && (
                        <div className="flex-shrink-0">
                          <span className="text-sm font-medium text-green-600">
                            +${activity.revenue.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No recent activity</p>
              )}
            </div>
          </div>

          {/* Right Column - Quick Actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to="/post-projects"
                  className="w-full btn btn-primary flex items-center justify-center"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Create New Project
                </Link>
                <Link
                  to="/find-projects"
                  className="w-full btn btn-secondary flex items-center justify-center"
                >
                  <EyeIcon className="w-4 h-4 mr-2" />
                  Browse Projects
                </Link>
                {draftProjects.length > 0 && (
                  <button
                    onClick={() => setActiveTab('drafts')}
                    className="w-full btn btn-outline flex items-center justify-center"
                  >
                    <PencilIcon className="w-4 h-4 mr-2" />
                    View Drafts ({draftProjects.length})
                  </button>
                )}
              </div>
            </div>

            {/* Draft Projects Preview */}
            {draftProjects.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Drafts</h3>
                <div className="space-y-3">
                  {draftProjects.slice(0, 3).map(draft => (
                    <div key={draft._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {draft.title || 'Untitled Project'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Updated {new Date(draft.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Link
                          to={`/edit-project/${draft._id}`}
                          className="text-purple-600 hover:text-purple-800"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Published Projects</h2>
            <Link to="/post-projects" className="btn btn-primary">
              <PlusIcon className="w-4 h-4 mr-2" />
              New Project
            </Link>
          </div>
          
          {publishedProjects.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {publishedProjects.map(project => (
                <div key={project._id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        <Link to={`/project/${project._id}`} className="hover:text-purple-600">
                          {project.title}
                        </Link>
                      </h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {project.description}
                      </p>
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
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
                        <span className="capitalize">{project.license.type}</span>
                        {project.license.price > 0 && (
                          <span className="font-medium text-green-600">
                            ${project.license.price}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        to={`/project/${project._id}`}
                        className="btn btn-sm btn-secondary"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No published projects</h3>
              <p className="text-gray-600 mb-6">
                Start sharing your work with the community.
              </p>
              <Link to="/post-projects" className="btn btn-primary">
                Create Your First Project
              </Link>
            </div>
          )}
        </div>
      )}

      {activeTab === 'drafts' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Draft Projects</h2>
          </div>
          
          {draftProjects.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {draftProjects.map(draft => (
                <div key={draft._id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {draft.title || 'Untitled Project'}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3">
                        {draft.description || 'No description provided'}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Last updated: {new Date(draft.updatedAt).toLocaleDateString()}</span>
                        <span className="capitalize">{draft.category || 'No category'}</span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Draft
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handlePublishDraft(draft._id)}
                        className="btn btn-sm btn-primary"
                      >
                        <CloudArrowUpIcon className="w-4 h-4 mr-1" />
                        Publish
                      </button>
                      <Link
                        to={`/edit-project/${draft._id}`}
                        className="btn btn-sm btn-secondary"
                      >
                        <PencilIcon className="w-4 h-4 mr-1" />
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteDraft(draft._id)}
                        className="btn btn-sm btn-outline text-red-600 hover:bg-red-50"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <PencilIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No draft projects</h3>
              <p className="text-gray-600 mb-6">
                Save projects as drafts to review and publish later.
              </p>
              <Link to="/post-projects" className="btn btn-primary">
                Create New Project
              </Link>
            </div>
          )}
        </div>
      )}

      {activeTab === 'purchases' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Your Purchases</h2>
          </div>
          
          {purchasedLicenses.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {purchasedLicenses.map(license => (
                <div key={license._id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        <Link to={`/project/${license.project._id}`} className="hover:text-purple-600">
                          {license.project.title}
                        </Link>
                      </h3>
                      <p className="text-gray-600 text-sm mb-3">
                        by {license.project.author.username}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-1" />
                          Purchased {new Date(license.purchaseDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center font-medium text-green-600">
                          <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                          ${license.project.license.price}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        to={`/project/${license.project._id}`}
                        className="btn btn-sm btn-primary"
                      >
                        View Project
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <ShoppingBagIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No purchases yet</h3>
              <p className="text-gray-600 mb-6">
                Discover amazing projects from the community.
              </p>
              <Link to="/find-projects" className="btn btn-primary">
                Browse Projects
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;