import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  ArrowLeftIcon,
  EyeIcon,
  DocumentTextIcon,
  TagIcon,
  PhotoIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

interface BlogPost {
  _id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  featuredImage?: {
    url: string;
    alt: string;
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    focusKeyword: string;
    canonicalUrl: string;
  };
  readTime: number;
}

interface Category {
  name: string;
  displayName: string;
}

const BlogEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [previewMode, setPreviewMode] = useState(false);

  const [post, setPost] = useState<BlogPost>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: 'development',
    tags: [],
    status: 'draft',
    featured: false,
    seo: {
      metaTitle: '',
      metaDescription: '',
      focusKeyword: '',
      canonicalUrl: ''
    },
    readTime: 1
  });

  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (isAdmin) {
      loadCategories();
      if (id && id !== 'new') {
        loadPost();
      }
    }
  }, [id, isAdmin]);

  useEffect(() => {
    // Auto-generate slug from title
    if (post.title && (!id || id === 'new')) {
      const slug = post.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setPost(prev => ({ ...prev, slug }));
    }
  }, [post.title, id]);

  useEffect(() => {
    // Auto-generate SEO fields
    if (post.title && !post.seo.metaTitle) {
      setPost(prev => ({
        ...prev,
        seo: { ...prev.seo, metaTitle: post.title }
      }));
    }
    if (post.excerpt && !post.seo.metaDescription) {
      setPost(prev => ({
        ...prev,
        seo: { ...prev.seo, metaDescription: post.excerpt.slice(0, 160) }
      }));
    }
  }, [post.title, post.excerpt]);

  useEffect(() => {
    // Calculate read time based on content
    const wordCount = post.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    const readTime = Math.max(1, Math.ceil(wordCount / 200)); // 200 words per minute
    setPost(prev => ({ ...prev, readTime }));
  }, [post.content]);

  const loadCategories = async () => {
    try {
      const response = await axios.get('/blog/categories');
      setCategories(response.data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const loadPost = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/blog/admin/posts/${id}`);
      setPost(response.data);
      setTagInput(response.data.tags.join(', '));
    } catch (err) {
      console.error('Error loading post:', err);
      setError('Failed to load blog post');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (status: 'draft' | 'published' | 'archived' = post.status) => {
    if (!post.title || !post.content) {
      setError('Title and content are required');
      return;
    }

    try {
      setSaving(true);
      setError('');

      // Parse tags
      const tags = tagInput
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const postData = { ...post, tags, status };

      let response;
      if (id && id !== 'new') {
        response = await axios.put(`/blog/admin/posts/${id}`, postData);
      } else {
        response = await axios.post('/blog/admin/posts', postData);
      }

      if (status === 'published') {
        navigate('/admin/blog');
      } else if (id === 'new') {
        navigate(`/admin/blog/edit/${response.data._id}`);
      }

    } catch (err: any) {
      console.error('Error saving post:', err);
      setError(err.response?.data?.message || 'Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link
                to="/admin/blog"
                className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Blog Admin
              </Link>
              <div className="ml-6">
                <h1 className="text-lg font-semibold text-gray-900">
                  {id === 'new' ? 'New Blog Post' : 'Edit Blog Post'}
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
              >
                <EyeIcon className="w-4 h-4 mr-2" />
                {previewMode ? 'Edit' : 'Preview'}
              </button>
              
              <button
                onClick={() => handleSave('draft')}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors duration-200"
              >
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              
              <button
                onClick={() => handleSave('published')}
                disabled={saving || !post.title || !post.content}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors duration-200"
              >
                {saving ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Main Editor */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              
              {previewMode ? (
                /* Preview Mode */
                <div className="p-6">
                  <div className="mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {post.category}
                      </span>
                      <span>{post.readTime} min read</span>
                      {post.featured && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Featured
                        </span>
                      )}
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>
                    <p className="text-xl text-gray-600">{post.excerpt}</p>
                  </div>
                  
                  <div 
                    className="prose prose-lg max-w-none prose-purple"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                  />
                  
                  {post.tags.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <div className="flex items-center flex-wrap gap-2">
                        <TagIcon className="w-4 h-4 text-gray-400" />
                        {post.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Edit Mode */
                <div className="p-6">
                  <div className="space-y-6">
                    
                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title *
                      </label>
                      <input
                        type="text"
                        value={post.title}
                        onChange={(e) => setPost(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Enter your blog post title..."
                      />
                    </div>

                    {/* Slug */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        URL Slug
                      </label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 py-2 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                          /blog/
                        </span>
                        <input
                          type="text"
                          value={post.slug}
                          onChange={(e) => setPost(prev => ({ ...prev, slug: e.target.value }))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Excerpt */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Excerpt *
                      </label>
                      <textarea
                        value={post.excerpt}
                        onChange={(e) => setPost(prev => ({ ...prev, excerpt: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Brief description of your blog post..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {post.excerpt.length}/160 characters (ideal for SEO)
                      </p>
                    </div>

                    {/* Content */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Content *
                      </label>
                      <textarea
                        value={post.content}
                        onChange={(e) => setPost(prev => ({ ...prev, content: e.target.value }))}
                        rows={20}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                        placeholder="Write your blog post content here... You can use HTML for formatting."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Supports HTML formatting. Read time: ~{post.readTime} minutes
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Post Settings */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DocumentTextIcon className="w-5 h-5 mr-2" />
                Post Settings
              </h3>
              
              <div className="space-y-4">
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={post.status}
                    onChange={(e) => setPost(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={post.category}
                    onChange={(e) => setPost(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="development">Development</option>
                    <option value="marketplace">Marketplace</option>
                    <option value="tutorials">Tutorials</option>
                    <option value="announcements">Announcements</option>
                    <option value="community">Community</option>
                    <option value="tools">Tools</option>
                    <option value="best-practices">Best Practices</option>
                    <option value="case-studies">Case Studies</option>
                  </select>
                </div>

                {/* Featured */}
                <div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={post.featured}
                      onChange={(e) => setPost(prev => ({ ...prev, featured: e.target.checked }))}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label htmlFor="featured" className="ml-2 block text-sm text-gray-700">
                      Featured Post
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TagIcon className="w-5 h-5 mr-2" />
                Tags
              </h3>
              
              <div>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="react, javascript, tutorial"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate tags with commas
                </p>
              </div>
            </div>

            {/* SEO Settings */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <GlobeAltIcon className="w-5 h-5 mr-2" />
                SEO Settings
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    value={post.seo.metaTitle}
                    onChange={(e) => setPost(prev => ({ 
                      ...prev, 
                      seo: { ...prev.seo, metaTitle: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    placeholder="SEO title"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {post.seo.metaTitle.length}/60 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Description
                  </label>
                  <textarea
                    value={post.seo.metaDescription}
                    onChange={(e) => setPost(prev => ({ 
                      ...prev, 
                      seo: { ...prev.seo, metaDescription: e.target.value }
                    }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    placeholder="SEO description"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {post.seo.metaDescription.length}/160 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Focus Keyword
                  </label>
                  <input
                    type="text"
                    value={post.seo.focusKeyword}
                    onChange={(e) => setPost(prev => ({ 
                      ...prev, 
                      seo: { ...prev.seo, focusKeyword: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    placeholder="Primary keyword"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogEditor;