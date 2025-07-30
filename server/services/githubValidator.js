const axios = require('axios');

class GitHubValidator {
  constructor() {
    this.githubAPI = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'VibeMarket-Validator'
      }
    });
  }

  // Validate if a GitHub URL is properly formatted
  isValidGitHubUrl(url) {
    const githubUrlPattern = /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\/[a-zA-Z0-9._-]+\/?$/;
    return githubUrlPattern.test(url);
  }

  // Extract owner and repo from GitHub URL
  parseGitHubUrl(url) {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) return null;
    
    return {
      owner: match[1],
      repo: match[2].replace(/\.git$/, '') // Remove .git suffix if present
    };
  }

  // Check if repository exists and is accessible
  async validateRepository(url) {
    try {
      if (!this.isValidGitHubUrl(url)) {
        return {
          valid: false,
          error: 'Invalid GitHub URL format',
          details: 'URL must be in format: https://github.com/username/repository'
        };
      }

      const parsed = this.parseGitHubUrl(url);
      if (!parsed) {
        return {
          valid: false,
          error: 'Could not parse GitHub URL',
          details: 'Unable to extract owner and repository from URL'
        };
      }

      // Check if repository exists
      const response = await this.githubAPI.get(`/repos/${parsed.owner}/${parsed.repo}`);
      
      return {
        valid: true,
        repository: {
          name: response.data.name,
          fullName: response.data.full_name,
          description: response.data.description,
          isPrivate: response.data.private,
          owner: response.data.owner.login,
          stars: response.data.stargazers_count,
          language: response.data.language,
          createdAt: response.data.created_at,
          updatedAt: response.data.updated_at
        }
      };

    } catch (error) {
      if (error.response?.status === 404) {
        return {
          valid: false,
          error: 'Repository not found',
          details: 'The repository does not exist or is private and not accessible'
        };
      }

      if (error.response?.status === 403) {
        return {
          valid: false,
          error: 'Access forbidden',
          details: 'Rate limit exceeded or repository access restricted'
        };
      }

      return {
        valid: false,
        error: 'Validation failed',
        details: error.message || 'Unable to validate repository'
      };
    }
  }

  // Check if user has access to repository (requires GitHub token)
  async checkUserAccess(url, githubToken) {
    try {
      if (!githubToken) {
        return {
          hasAccess: false,
          error: 'GitHub authentication required',
          details: 'Please connect your GitHub account to verify repository access'
        };
      }

      const parsed = this.parseGitHubUrl(url);
      if (!parsed) {
        return {
          hasAccess: false,
          error: 'Invalid URL',
          details: 'Could not parse GitHub URL'
        };
      }

      // Create authenticated axios instance
      const authAPI = axios.create({
        baseURL: 'https://api.github.com',
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'VibeMarket-Validator'
        }
      });

      // Check if user can access the repository
      const repoResponse = await authAPI.get(`/repos/${parsed.owner}/${parsed.repo}`);
      
      // Check user's permission level
      const permissionResponse = await authAPI.get(`/repos/${parsed.owner}/${parsed.repo}/collaborators/${parsed.owner}/permission`);
      
      const permission = permissionResponse.data.permission;
      const hasWriteAccess = ['admin', 'write'].includes(permission);

      return {
        hasAccess: true,
        permission: permission,
        canModify: hasWriteAccess,
        repository: {
          name: repoResponse.data.name,
          fullName: repoResponse.data.full_name,
          isPrivate: repoResponse.data.private,
          owner: repoResponse.data.owner.login
        }
      };

    } catch (error) {
      if (error.response?.status === 404) {
        return {
          hasAccess: false,
          error: 'No access to repository',
          details: 'You do not have access to this repository'
        };
      }

      return {
        hasAccess: false,
        error: 'Access check failed',
        details: error.message || 'Unable to verify repository access'
      };
    }
  }

  // Batch validate multiple URLs
  async validateMultipleRepositories(urls) {
    const results = {};
    
    for (const [key, url] of Object.entries(urls)) {
      if (url && url.trim()) {
        results[key] = await this.validateRepository(url);
      } else {
        results[key] = { valid: true, empty: true };
      }
    }
    
    return results;
  }
}

module.exports = new GitHubValidator();