import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  DocumentTextIcon,
  PencilIcon,
  TrashIcon,
  CloudArrowUpIcon,
  CalendarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface DraftProject {
  _id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  license: {
    type: string;
    price: number;
  };
  updatedAt: string;
  createdAt: string;
}

const DraftProjects: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<DraftProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [publishing, setPublishing] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchDrafts();
  }, [user, navigate]);

  const fetchDrafts = async () => {
    try {
      const response = await axios.get('/projects/drafts');
      setDrafts(response.data.drafts || []);
    } catch (err: any) {
      setError('Failed to load drafts');
      console.error('Failed to fetch drafts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (draftId: string) => {
    try {
      setPublishing(draftId);
      setError('');
      
      await axios.post(`/projects/${draftId}/publish`);
      
      // Remove the published draft from the list
      setDrafts(prev => prev.filter(draft => draft._id !== draftId));
      
      // Show success message
      alert('Project published successfully!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to publish project');
    } finally {
      setPublishing(null);
    }
  };

  const handleDelete = async (draftId: string) => {
    if (!window.confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`/projects/${draftId}`);
      setDrafts(prev => prev.filter(draft => draft._id !== draftId));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete draft');
    }
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Draft Projects</h1>
        <p className="text-gray-600">
          Review and publish your project drafts when you're ready to share them with the community.
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-red-700">{error}</div>
        </div>
      )}

      {drafts.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <DocumentTextIcon className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No draft projects</h3>
          <p className="text-gray-600 mb-6">
            Create a new project and save it as a draft to review later.
          </p>
          <Link to="/post-projects" className="btn btn-primary">
            Create New Project
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {drafts.map((draft) => (
            <div key={draft._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {draft.title || 'Untitled Project'}
                  </h3>
                  
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {draft.description || 'No description provided'}
                  </p>

                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center">
                      <CalendarIcon className="w-4 h-4 mr-1" />
                      Last updated: {new Date(draft.updatedAt).toLocaleDateString()}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                      {draft.category || 'No category'}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      draft.license?.type === 'free' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {draft.license?.type === 'free' ? 'Free' : `$${draft.license?.price || 0}`}
                    </span>
                  </div>

                  {draft.tags && draft.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {draft.tags.slice(0, 5).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                        >
                          {tag}
                        </span>
                      ))}
                      {draft.tags.length > 5 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          +{draft.tags.length - 5}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="ml-6 flex flex-col space-y-2">
                  <button
                    onClick={() => handlePublish(draft._id)}
                    disabled={publishing === draft._id}
                    className="btn btn-primary text-sm"
                  >
                    {publishing === draft._id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Publishing...
                      </>
                    ) : (
                      <>
                        <CloudArrowUpIcon className="w-4 h-4 mr-2" />
                        Publish
                      </>
                    )}
                  </button>
                  
                  <Link
                    to={`/edit-project/${draft._id}`}
                    className="btn btn-secondary text-sm"
                  >
                    <PencilIcon className="w-4 h-4 mr-2" />
                    Edit
                  </Link>
                  
                  <button
                    onClick={() => handleDelete(draft._id)}
                    className="btn btn-outline text-red-600 hover:bg-red-50 hover:border-red-300 text-sm"
                  >
                    <TrashIcon className="w-4 h-4 mr-2" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create New Project CTA */}
      <div className="mt-8 bg-purple-50 border border-purple-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-medium text-purple-900 mb-2">
          Ready to create another project?
        </h3>
        <p className="text-purple-700 mb-4">
          Start working on your next idea and save it as a draft to come back to later.
        </p>
        <Link to="/post-projects" className="btn btn-primary">
          Create New Project
        </Link>
      </div>
    </div>
  );
};

export default DraftProjects;