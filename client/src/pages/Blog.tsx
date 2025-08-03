import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  CalendarDaysIcon,
  ClockIcon,
  EyeIcon,
  TagIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  author: {
    username: string;
    profile: {
      displayName?: string;
      avatar?: string;
    };
  };
  category: string;
  tags: string[];
  publishedAt: string;
  readTime: number;
  views: number;
  featuredImage?: {
    url: string;
    alt: string;
  };
  featured: boolean;
}

interface Category {
  name: string;
  count: number;
  displayName: string;
}

interface BlogResponse {
  posts: BlogPost[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalPosts: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const Blog: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<BlogResponse['pagination'] | null>(null);

  useEffect(() => {
    loadBlogData();
  }, [currentPage, selectedCategory, searchQuery]);

  const loadBlogData = async () => {
    try {
      setLoading(true);
      
      // Load posts with filters
      const postsParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '6'
      });
      
      if (selectedCategory) postsParams.append('category', selectedCategory);
      if (searchQuery) postsParams.append('search', searchQuery);
      
      const [postsResponse, featuredResponse, categoriesResponse] = await Promise.all([
        axios.get(`/blog?${postsParams}`),
        currentPage === 1 && !selectedCategory && !searchQuery ? axios.get('/blog/featured') : Promise.resolve(null),
        axios.get('/blog/categories')
      ]);

      setPosts(postsResponse.data.posts);
      setPagination(postsResponse.data.pagination);
      
      if (featuredResponse) {
        setFeaturedPosts(featuredResponse.data);
      }
      
      setCategories(categoriesResponse.data);
      
    } catch (err) {
      console.error('Error loading blog data:', err);
      setError('Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadBlogData();
  };

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category === selectedCategory ? '' : category);
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const FeaturedPostCard: React.FC<{ post: BlogPost }> = ({ post }) => (
    <Link to={`/blog/${post.slug}`} className="group block">
      <article className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
        {post.featuredImage && (
          <div className="aspect-w-16 aspect-h-9 bg-gray-200">
            <img
              src={post.featuredImage.url}
              alt={post.featuredImage.alt}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        <div className="p-6">
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              {post.category}
            </span>
            <div className="flex items-center">
              <CalendarDaysIcon className="w-4 h-4 mr-1" />
              {formatDate(post.publishedAt)}
            </div>
            <div className="flex items-center">
              <ClockIcon className="w-4 h-4 mr-1" />
              {post.readTime} min read
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors duration-200">
            {post.title}
          </h2>
          <p className="text-gray-600 mb-4 line-clamp-2">
            {post.excerpt}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {post.author.profile?.displayName?.[0] || post.author.username[0].toUpperCase()}
                </span>
              </div>
              <span className="ml-2 text-sm text-gray-700">
                {post.author.profile?.displayName || post.author.username}
              </span>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <EyeIcon className="w-4 h-4 mr-1" />
              {post.views}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );

  const PostCard: React.FC<{ post: BlogPost }> = ({ post }) => (
    <Link to={`/blog/${post.slug}`} className="group block">
      <article className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
        {post.featuredImage && (
          <div className="aspect-w-16 aspect-h-9 bg-gray-200">
            <img
              src={post.featuredImage.url}
              alt={post.featuredImage.alt}
              className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        <div className="p-4">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {post.category}
            </span>
            <div className="flex items-center">
              <CalendarDaysIcon className="w-3 h-3 mr-1" />
              {formatDate(post.publishedAt)}
            </div>
            <div className="flex items-center">
              <ClockIcon className="w-3 h-3 mr-1" />
              {post.readTime} min
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors duration-200 line-clamp-2">
            {post.title}
          </h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {post.excerpt}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              By {post.author.profile?.displayName || post.author.username}
            </span>
            <div className="flex items-center text-xs text-gray-500">
              <EyeIcon className="w-3 h-3 mr-1" />
              {post.views}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">PackCode Blog</h1>
            <p className="text-xl text-purple-100 max-w-2xl mx-auto">
              Insights, tutorials, and stories from the developer marketplace
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Content */}
          <div className="flex-1">
            
            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <form onSubmit={handleSearch} className="flex gap-4 mb-4">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search blog posts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
                >
                  Search
                </button>
              </form>
              
              {/* Category filters */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleCategoryFilter('')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                    !selectedCategory
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Posts
                </button>
                {categories.map((category) => (
                  <button
                    key={category.name}
                    onClick={() => handleCategoryFilter(category.name)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                      selectedCategory === category.name
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.displayName} ({category.count})
                  </button>
                ))}
              </div>
            </div>

            {/* Featured Posts */}
            {featuredPosts.length > 0 && currentPage === 1 && !selectedCategory && !searchQuery && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Posts</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredPosts.map((post) => (
                    <FeaturedPostCard key={post._id} post={post} />
                  ))}
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading posts...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* Blog Posts Grid */}
            {!loading && !error && posts.length > 0 && (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedCategory ? `${categories.find(c => c.name === selectedCategory)?.displayName} Posts` : 'Latest Posts'}
                    {searchQuery && ` - Search: "${searchQuery}"`}
                  </h2>
                  {pagination && (
                    <p className="text-gray-600 mt-1">
                      Showing {posts.length} of {pagination.totalPosts} posts
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {posts.map((post) => (
                    <PostCard key={post._id} post={post} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={!pagination.hasPrev}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeftIcon className="w-4 h-4 mr-1" />
                      Previous
                    </button>
                    
                    <span className="px-4 py-2 text-sm text-gray-700">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                    
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={!pagination.hasNext}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                      <ChevronRightIcon className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                )}
              </>
            )}

            {/* No Results */}
            {!loading && !error && posts.length === 0 && (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <TagIcon className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
                <p className="text-gray-600">
                  {searchQuery || selectedCategory
                    ? 'Try adjusting your search or filters'
                    : 'No blog posts have been published yet'}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80 space-y-6">
            
            {/* Recent Posts Widget */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
              <div className="space-y-2">
                {categories.slice(0, 6).map((category) => (
                  <button
                    key={category.name}
                    onClick={() => handleCategoryFilter(category.name)}
                    className="flex items-center justify-between w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <span className="text-gray-700">{category.displayName}</span>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {category.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Newsletter Signup */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Stay Updated</h3>
              <p className="text-purple-100 text-sm mb-4">
                Get the latest insights and tutorials delivered to your inbox.
              </p>
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-3 py-2 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
                />
                <button className="w-full bg-white text-purple-600 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Blog;