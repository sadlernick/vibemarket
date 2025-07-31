import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: string;
  username: string;
  email: string;
  profileImage?: string;
  bio?: string;
  skills: string[];
  githubProfile?: string;
  website?: string;
  reputation: number;
  isVerified: boolean;
  role?: 'user' | 'admin';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  loginWithOAuth: (token: string, userData: User) => void;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  setUser: (user: User | null) => void;
  isLoading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Configure axios defaults
axios.defaults.baseURL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:5001/api';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await axios.get('/auth/profile');
      setUser(response.data.user);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // Use arrow function to avoid circular dependency
      setUser(null);
      setToken(null);
      localStorage.removeItem('vibemarket_token');
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    }
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem('vibemarket_token') || localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(userData);
        if (storedToken !== 'oauth-authenticated') {
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        }
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        logout();
      }
      setIsLoading(false);
    } else if (storedToken) {
      setToken(storedToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      fetchUserProfile();
    } else {
      setIsLoading(false);
    }
  }, [fetchUserProfile]);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('/auth/login', { email, password });
      const { token: newToken, user: userData } = response.data;
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('vibemarket_token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const response = await axios.post('/auth/register', {
        username,
        email,
        password
      });
      const { token: newToken, user: userData } = response.data;
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('vibemarket_token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  };

  const loginWithOAuth = (token: string, userData: User) => {
    setToken(token);
    setUser(userData);
    localStorage.setItem('vibemarket_token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const response = await axios.put('/auth/profile', data);
      setUser(response.data.user);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Profile update failed');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('vibemarket_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
  };

  const isAdmin = user?.role === 'admin';

  const value = {
    user,
    token,
    login,
    register,
    loginWithOAuth,
    logout,
    updateProfile,
    setUser,
    isLoading,
    isAdmin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};