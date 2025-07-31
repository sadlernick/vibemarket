import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  StarIcon,
  EyeIcon,
  CodeBracketIcon,
  LockClosedIcon,
  GlobeAltIcon
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
  cloneUrl: string;
  defaultBranch: string;
  topics: string[];
  license: string | null;
  updatedAt: string;
  createdAt: string;
  hasAccess: boolean;
}

interface GitHubRepositoryPickerProps {
  value: string;
  onChange: (url: string, repository?: Repository) => void;
  label: string;
  placeholder?: string;
  required?: boolean;
}

const GitHubRepositoryPicker: React.FC<GitHubRepositoryPickerProps> = ({
  value,
  onChange,
  label,
  placeholder = "Enter GitHub repository URL or select from your repositories",
  required = false
}) => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(false);
  const [githubConnected, setGithubConnected] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean;
    repository?: Repository;
    error?: string;
  } | null>(null);

  // Check GitHub connection status
  useEffect(() => {
    checkGitHubStatus();
  }, []);

  const checkGitHubStatus = async () => {
    try {
      const response = await axios.get('/github/status');
      setGithubConnected(response.data.isConnected);
    } catch (error) {
      console.error('Failed to check GitHub status:', error);
    }
  };

  const connectGitHub = async () => {
    try {
      const response = await axios.get('/github/oauth/login');
      window.open(response.data.authUrl, '_blank', 'width=600,height=700');
      
      // Listen for auth completion
      const checkAuth = setInterval(async () => {
        try {
          const statusResponse = await axios.get('/github/status');
          if (statusResponse.data.isConnected) {
            setGithubConnected(true);
            clearInterval(checkAuth);
          }
        } catch (error) {
          // Still checking...
        }
      }, 2000);

      // Stop checking after 5 minutes
      setTimeout(() => clearInterval(checkAuth), 300000);
    } catch (error) {
      console.error('Failed to initiate GitHub OAuth:', error);
    }
  };

  const fetchRepositories = async () => {
    if (!githubConnected) return;

    setLoading(true);
    try {
      const response = await axios.get('/github/repositories');
      setRepositories(response.data.repositories);
    } catch (error) {
      console.error('Failed to fetch repositories:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifyRepository = async (url: string) => {
    if (!url) {
      setVerificationResult(null);
      return;
    }

    setVerifying(true);
    try {
      const response = await axios.post('/github/verify-repository', {
        repositoryUrl: url
      });
      
      setVerificationResult({
        verified: true,
        repository: response.data.repository
      });
    } catch (error: any) {
      setVerificationResult({
        verified: false,
        error: error.response?.data?.error || 'Failed to verify repository'
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleUrlChange = (url: string) => {
    onChange(url);
    
    // Auto-verify if it looks like a GitHub URL
    if (url && url.includes('github.com')) {
      verifyRepository(url);
    } else {
      setVerificationResult(null);
    }
  };

  const selectRepository = (repo: Repository) => {
    const url = repo.htmlUrl;
    onChange(url, repo);
    setVerificationResult({
      verified: true,
      repository: repo
    });
    setShowPicker(false);
  };

  const filteredRepositories = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.language?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        
        <div className="flex space-x-2">
          <div className="flex-1">
            <input
              type="url"
              value={value}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required={required}
            />
          </div>
          
          {githubConnected ? (
            <button
              type="button"
              onClick={() => {
                setShowPicker(!showPicker);
                if (!showPicker && repositories.length === 0) {
                  fetchRepositories();
                }
              }}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 flex items-center space-x-2"
            >
              <CodeBracketIcon className="w-4 h-4" />
              <span>Browse</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={connectGitHub}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 flex items-center space-x-2"
            >
              <CodeBracketIcon className="w-4 h-4" />
              <span>Connect GitHub</span>
            </button>
          )}
        </div>
      </div>

      {/* Verification Status */}
      {verifying && (
        <div className="flex items-center space-x-2 text-blue-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm">Verifying repository access...</span>
        </div>
      )}

      {verificationResult && (
        <div className={`p-4 rounded-lg border ${
          verificationResult.verified 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start space-x-3">
            {verificationResult.verified ? (
              <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5" />
            ) : (
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mt-0.5" />
            )}
            <div className="flex-1">
              {verificationResult.verified ? (
                <div>
                  <p className="text-green-800 font-medium text-sm">Repository verified!</p>
                  {verificationResult.repository && (
                    <div className="mt-2 text-sm text-green-700">
                      <p className="font-medium">{verificationResult.repository.fullName}</p>
                      {verificationResult.repository.description && (
                        <p className="text-green-600 mt-1">{verificationResult.repository.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2">
                        {verificationResult.repository.language && (
                          <span className="flex items-center space-x-1">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span>{verificationResult.repository.language}</span>
                          </span>
                        )}
                        <span className="flex items-center space-x-1">
                          <StarIcon className="w-3 h-3" />
                          <span>{verificationResult.repository.stars}</span>
                        </span>
                        {verificationResult.repository.isPrivate ? (
                          <span className="flex items-center space-x-1">
                            <LockClosedIcon className="w-3 h-3" />
                            <span>Private</span>
                          </span>
                        ) : (
                          <span className="flex items-center space-x-1">
                            <GlobeAltIcon className="w-3 h-3" />
                            <span>Public</span>
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-red-800 font-medium text-sm">Verification failed</p>
                  <p className="text-red-700 text-sm mt-1">{verificationResult.error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Repository Picker Modal */}
      {showPicker && (
        <div className="border border-gray-300 rounded-lg bg-white shadow-lg max-h-96 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search repositories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Loading repositories...</p>
              </div>
            ) : filteredRepositories.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filteredRepositories.map((repo) => (
                  <div
                    key={repo.id}
                    className="p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => selectRepository(repo)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900">{repo.name}</h3>
                          {repo.isPrivate ? (
                            <LockClosedIcon className="w-4 h-4 text-gray-400" />
                          ) : (
                            <GlobeAltIcon className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        {repo.description && (
                          <p className="text-sm text-gray-600 mt-1">{repo.description}</p>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          {repo.language && (
                            <span className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span>{repo.language}</span>
                            </span>
                          )}
                          <span className="flex items-center space-x-1">
                            <StarIcon className="w-3 h-3" />
                            <span>{repo.stars}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <EyeIcon className="w-3 h-3" />
                            <span>{repo.forks}</span>
                          </span>
                          <span>Updated {new Date(repo.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      {!repo.hasAccess && (
                        <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                          No access
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                <p>No repositories found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GitHubRepositoryPicker;