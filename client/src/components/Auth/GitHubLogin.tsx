import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { CodeBracketIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface GitHubLoginProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const GitHubLogin: React.FC<GitHubLoginProps> = ({ onSuccess, onError }) => {
  const { loginWithOAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGitHubLogin = async () => {
    setLoading(true);
    setError('');

    try {
      // Get GitHub OAuth URL
      const response = await axios.get('/github/oauth/login');
      const authUrl = response.data.authUrl;

      // Open popup window for OAuth
      const popup = window.open(
        authUrl,
        'github-oauth',
        'width=600,height=700,left=' + 
        (window.screen.width / 2 - 300) + 
        ',top=' + (window.screen.height / 2 - 350)
      );

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      // Listen for the OAuth callback
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          setLoading(false);
        }
      }, 1000);

      // Listen for messages from the popup
      const messageListener = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'GITHUB_OAUTH_SUCCESS') {
          const { code, state } = event.data;
          clearInterval(checkClosed);
          popup.close();

          try {
            // Exchange code for token
            const authResponse = await axios.post('/github/oauth/callback', {
              code,
              state
            });

            // Login user
            loginWithOAuth(authResponse.data.token, authResponse.data.user);
            
            if (onSuccess) {
              onSuccess();
            }
          } catch (callbackError: any) {
            const errorMessage = callbackError.response?.data?.error || 'GitHub authentication failed';
            setError(errorMessage);
            if (onError) {
              onError(errorMessage);
            }
          } finally {
            setLoading(false);
          }
        } else if (event.data.type === 'GITHUB_OAUTH_ERROR') {
          clearInterval(checkClosed);
          popup.close();
          const errorMessage = event.data.error || 'GitHub authentication failed';
          setError(errorMessage);
          if (onError) {
            onError(errorMessage);
          }
          setLoading(false);
        }
      };

      window.addEventListener('message', messageListener);

      // Cleanup listener after 5 minutes
      setTimeout(() => {
        window.removeEventListener('message', messageListener);
        if (!popup.closed) {
          popup.close();
        }
        setLoading(false);
      }, 300000);

    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to initiate GitHub login';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleGitHubLogin}
        disabled={loading}
        className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
            Connecting to GitHub...
          </>
        ) : (
          <>
            <CodeBracketIcon className="w-5 h-5 mr-2" />
            Continue with GitHub
          </>
        )}
      </button>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-sm text-red-700">{error}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GitHubLogin;