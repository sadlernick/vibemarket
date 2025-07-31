import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  UserIcon,
  StarIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  CodeBracketIcon,
  CursorArrowRaysIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

interface Author {
  _id: string;
  username: string;
  email?: string;
  profileImage?: string;
  reputation: number;
  createdAt: string;
  githubProfile?: string;
  website?: string;
}

interface Project {
  _id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  tech_stack?: string[];
  license: {
    type: string;
    price: number;
  };
  stats: {
    views: number;
    downloads: number;
    stars: number;
  };
  createdAt: string;
  status: string;
  isActive: boolean;
}

interface AuthorStats {
  totalProjects: number;
  totalViews: number;
  totalDownloads: number;
  totalStars: number;
  categories: { [key: string]: number };
  technologies: { [key: string]: number };
}

const AuthorProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [author, setAuthor] = useState<Author | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<AuthorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchAuthorData();
    }
  }, [id]);

  const fetchAuthorData = async () => {
    try {
      setLoading(true);
      
      // Fetch author info and projects
      const [authorResponse, projectsResponse] = await Promise.all([
        axios.get(`/users/${id}`),
        axios.get(`/projects?author=${id}&status=published`)
      ]);

      const authorData = authorResponse.data;
      const projectsData = projectsResponse.data.projects || [];

      setAuthor(authorData);
      setProjects(projectsData);

      // Calculate stats
      const authorStats: AuthorStats = {
        totalProjects: projectsData.length,
        totalViews: projectsData.reduce((sum: number, p: Project) => sum + p.stats.views, 0),
        totalDownloads: projectsData.reduce((sum: number, p: Project) => sum + p.stats.downloads, 0),
        totalStars: projectsData.reduce((sum: number, p: Project) => sum + p.stats.stars, 0),
        categories: {},
        technologies: {}
      };

      // Count categories and technologies
      projectsData.forEach((project: Project) => {
        authorStats.categories[project.category] = (authorStats.categories[project.category] || 0) + 1;
        project.tags.forEach(tag => {
          authorStats.technologies[tag] = (authorStats.technologies[tag] || 0) + 1;
        });
      });

      setStats(authorStats);
    } catch (err: any) {
      setError('Failed to load author profile');
      console.error('Author profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-200 h-64 rounded-lg"></div>
            <div className="md:col-span-2 bg-gray-200 h-64 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !author) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-700">{error || 'Author not found'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Author Info Sidebar */}
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
                <UserIcon className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{author.username}</h1>
              <p className="text-gray-600 mb-4">{author.reputation} reputation points</p>
              <div className="text-sm text-gray-500">
                Member since {new Date(author.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long' 
                })}
              </div>
            </div>

            {/* External Links */}
            {(author.githubProfile || author.website) && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="space-y-2">
                  {author.githubProfile && (
                    <a 
                      href={author.githubProfile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-gray-600 hover:text-purple-600 text-sm"
                    >
                      <CodeBracketIcon className="w-4 h-4 mr-2" />
                      GitHub Profile
                    </a>
                  )}
                  {author.website && (
                    <a 
                      href={author.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-gray-600 hover:text-purple-600 text-sm"
                    >
                      <CursorArrowRaysIcon className="w-4 h-4 mr-2" />
                      Website
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Stats Card */}
          {stats && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Projects</span>
                  <span className="font-medium">{stats.totalProjects}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Views</span>
                  <span className="font-medium">{stats.totalViews.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Downloads</span>
                  <span className="font-medium">{stats.totalDownloads.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Stars</span>
                  <span className="font-medium">{stats.totalStars}</span>
                </div>
              </div>
            </div>
          )}

          {/* Specializations */}
          {stats && Object.keys(stats.categories).length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Specializations</h2>
              <div className="space-y-2">
                {Object.entries(stats.categories)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-gray-600 capitalize">{category}</span>
                      <span className="text-sm text-gray-500">{count} project{count > 1 ? 's' : ''}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Top Technologies */}
          {stats && Object.keys(stats.technologies).length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Technologies</h2>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.technologies)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 10)
                  .map(([tech, count]) => (
                    <span
                      key={tech}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {tech}
                      <span className="ml-1 text-gray-500">({count})</span>
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Projects Grid */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Projects by {author.username}
            </h2>
            <p className="text-gray-600">
              {stats?.totalProjects || 0} published project{(stats?.totalProjects || 0) !== 1 ? 's' : ''}
            </p>
          </div>

          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((project) => (
                <div key={project._id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="mb-4">
                    <Link 
                      to={`/project/${project._id}`}
                      className="text-lg font-semibold text-gray-900 hover:text-purple-600 line-clamp-2"
                    >
                      {project.title}
                    </Link>
                    <p className="text-gray-600 text-sm mt-2 line-clamp-3">
                      {project.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {project.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {tag}
                      </span>
                    ))}
                    {project.tags.length > 3 && (
                      <span className="text-xs text-gray-500">+{project.tags.length - 3} more</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
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
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        project.license.type === 'free' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {project.license.type === 'free' ? 'Free' : 'Premium'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center">
                        <CalendarIcon className="w-4 h-4 mr-1" />
                        {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                      <span className="capitalize">{project.category}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
              <p className="text-gray-600">This developer hasn't published any projects.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthorProfile;