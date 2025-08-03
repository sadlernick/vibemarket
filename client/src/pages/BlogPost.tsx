import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import {
  CalendarDaysIcon,
  ClockIcon,
  EyeIcon,
  TagIcon,
  UserIcon,
  ShareIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: {
    username: string;
    profile: {
      displayName?: string;
      avatar?: string;
      bio?: string;
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
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    focusKeyword?: string;
  };
}

interface BlogPostResponse {
  post: BlogPost;
  relatedPosts: BlogPost[];
}

const BlogPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [blogPost, setBlogPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (slug) {
      loadBlogPost();
    }
  }, [slug]);

  const loadBlogPost = async () => {
    try {
      setLoading(true);
      const response = await axios.get<BlogPostResponse>(`/blog/${slug}`);
      setBlogPost(response.data.post);
      setRelatedPosts(response.data.relatedPosts);
    } catch (err: any) {
      console.error('Error loading blog post:', err);
      if (err.response?.status === 404) {
        setError('Blog post not found');
      } else {
        setError('Failed to load blog post');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const sharePost = async () => {
    if (navigator.share && blogPost) {
      try {
        await navigator.share({
          title: blogPost.title,
          text: blogPost.excerpt,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // You could show a toast notification here
    }
  };

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

  if (error || !blogPost) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <TagIcon className="w-10 h-10 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {error === 'Blog post not found' ? 'Post Not Found' : 'Error Loading Post'}
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            to="/blog"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": blogPost.title,
    "description": blogPost.excerpt,
    "image": blogPost.featuredImage?.url,
    "author": {
      "@type": "Person",
      "name": blogPost.author.profile?.displayName || blogPost.author.username
    },
    "publisher": {
      "@type": "Organization",
      "name": "PackCode",
      "logo": {
        "@type": "ImageObject",
        "url": `${window.location.origin}/logo192.png`
      }
    },
    "datePublished": blogPost.publishedAt,
    "dateModified": blogPost.publishedAt,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": window.location.href
    }
  };

  return (
    <>
      <Helmet>
        <title>{blogPost.seo.metaTitle || blogPost.title} | PackCode Blog</title>
        <meta name="description" content={blogPost.seo.metaDescription || blogPost.excerpt} />
        <meta name="keywords" content={blogPost.tags.join(', ')} />
        
        {/* Open Graph tags */}
        <meta property="og:title" content={blogPost.title} />
        <meta property="og:description" content={blogPost.excerpt} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={window.location.href} />
        {blogPost.featuredImage && <meta property="og:image" content={blogPost.featuredImage.url} />}
        
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={blogPost.title} />
        <meta name="twitter:description" content={blogPost.excerpt} />
        {blogPost.featuredImage && <meta name="twitter:image" content={blogPost.featuredImage.url} />}
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link
              to="/blog"
              className="inline-flex items-center text-purple-600 hover:text-purple-700 transition-colors duration-200"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Blog
            </Link>
          </div>
        </div>

        {/* Hero Section */}
        {blogPost.featuredImage && (
          <div className="relative h-64 md:h-96 bg-gray-900">
            <img
              src={blogPost.featuredImage.url}
              alt={blogPost.featuredImage.alt}
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
          </div>
        )}

        {/* Article */}
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            
            {/* Header */}
            <header className="px-6 py-8 border-b border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {blogPost.category}
                </span>
                <div className="flex items-center">
                  <CalendarDaysIcon className="w-4 h-4 mr-1" />
                  {formatDate(blogPost.publishedAt)}
                </div>
                <div className="flex items-center">
                  <ClockIcon className="w-4 h-4 mr-1" />
                  {blogPost.readTime} min read
                </div>
                <div className="flex items-center">
                  <EyeIcon className="w-4 h-4 mr-1" />
                  {blogPost.views} views
                </div>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {blogPost.title}
              </h1>

              <p className="text-xl text-gray-600 mb-6">
                {blogPost.excerpt}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">
                      {blogPost.author.profile?.displayName?.[0] || blogPost.author.username[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {blogPost.author.profile?.displayName || blogPost.author.username}
                    </p>
                    {blogPost.author.profile?.bio && (
                      <p className="text-sm text-gray-500">
                        {blogPost.author.profile.bio}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={sharePost}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                >
                  <ShareIcon className="w-4 h-4 mr-2" />
                  Share
                </button>
              </div>
            </header>

            {/* Content */}
            <div className="px-6 py-8">
              <div 
                className="prose prose-lg max-w-none prose-purple prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-purple-600 hover:prose-a:text-purple-700 prose-code:text-purple-600 prose-code:bg-purple-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-gray-100"
                dangerouslySetInnerHTML={{ __html: blogPost.content }}
              />
            </div>

            {/* Tags */}
            {blogPost.tags.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center flex-wrap gap-2">
                  <TagIcon className="w-4 h-4 text-gray-400" />
                  {blogPost.tags.map((tag) => (
                    <Link
                      key={tag}
                      to={`/blog?search=${encodeURIComponent(tag)}`}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors duration-200"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Posts</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((post) => (
                  <Link
                    key={post._id}
                    to={`/blog/${post.slug}`}
                    className="group block bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300"
                  >
                    {post.featuredImage && (
                      <div className="aspect-w-16 aspect-h-9">
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
                        <span>{formatDate(post.publishedAt)}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors duration-200 line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {post.excerpt}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>
    </>
  );
};

export default BlogPost;