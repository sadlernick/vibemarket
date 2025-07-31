import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AuthSuccess: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const userParam = urlParams.get('user');
    
    if (userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        setUser(user);
        
        // Store user data in localStorage for persistence
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', 'oauth-authenticated');
        
        // Check for intended action
        const intendedAction = localStorage.getItem('intendedAction');
        if (intendedAction) {
          const { action, projectId } = JSON.parse(intendedAction);
          localStorage.removeItem('intendedAction');
          
          switch (action) {
            case 'view':
              navigate(`/project/${projectId}`);
              break;
            case 'demo':
              window.open(`/api/sandbox/run/${projectId}`, '_blank');
              navigate('/find-projects');
              break;
            case 'license':
              navigate(`/project/${projectId}?tab=license`);
              break;
            default:
              navigate('/dashboard');
          }
        } else {
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Failed to parse user data:', error);
        navigate('/login?error=oauth');
      }
    } else {
      navigate('/login?error=oauth');
    }
  }, [location, navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-medium text-gray-900">Completing sign in...</h2>
        <p className="text-gray-600 mt-2">Please wait while we redirect you.</p>
      </div>
    </div>
  );
};

export default AuthSuccess;