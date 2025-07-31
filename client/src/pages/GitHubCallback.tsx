import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const GitHubCallback: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');

    if (error) {
      // Send error to parent window
      window.opener?.postMessage({
        type: 'GITHUB_OAUTH_ERROR',
        error: errorDescription || error
      }, window.location.origin);
    } else if (code) {
      // Send success to parent window
      window.opener?.postMessage({
        type: 'GITHUB_OAUTH_SUCCESS',
        code,
        state
      }, window.location.origin);
    } else {
      // Send generic error
      window.opener?.postMessage({
        type: 'GITHUB_OAUTH_ERROR',
        error: 'No authorization code received'
      }, window.location.origin);
    }

    // Close the popup
    window.close();
  }, [location]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Completing GitHub Authentication
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please wait while we complete your GitHub authentication...
          </p>
        </div>
      </div>
    </div>
  );
};

export default GitHubCallback;