import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import FindProjects from '../../pages/FindProjects';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock data
const mockProjects = [
  {
    _id: '1',
    title: 'React Dashboard',
    description: 'A comprehensive dashboard built with React',
    author: {
      username: 'testuser',
      profileImage: null,
      reputation: 100
    },
    category: 'web',
    tags: ['react', 'dashboard'],
    license: {
      type: 'free',
      price: 0,
      currency: 'USD'
    },
    stats: {
      views: 100,
      downloads: 50,
      stars: 25
    },
    createdAt: '2025-01-01T00:00:00.000Z'
  },
  {
    _id: '2',
    title: 'Flutter Chat App',
    description: 'Mobile chat application',
    author: {
      username: 'developer',
      profileImage: null,
      reputation: 200
    },
    category: 'mobile',
    tags: ['flutter', 'chat'],
    license: {
      type: 'paid',
      price: 29.99,
      currency: 'USD'
    },
    stats: {
      views: 200,
      downloads: 75,
      stars: 30
    },
    createdAt: '2025-01-02T00:00:00.000Z'
  }
];

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe('FindProjects Component', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock successful API response
    mockedAxios.get.mockResolvedValue({
      data: {
        projects: mockProjects,
        pagination: {
          current: 1,
          pages: 1,
          total: 2
        }
      }
    });
  });

  test('renders find projects page', async () => {
    render(
      <TestWrapper>
        <FindProjects />
      </TestWrapper>
    );

    expect(screen.getByText('Find Projects')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search projects/i)).toBeInTheDocument();
    
    // Wait for projects to load
    await waitFor(() => {
      expect(screen.getByText('React Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Flutter Chat App')).toBeInTheDocument();
    });
  });

  test('displays projects with correct information', async () => {
    render(
      <TestWrapper>
        <FindProjects />
      </TestWrapper>
    );

    await waitFor(() => {
      // Check first project
      expect(screen.getByText('React Dashboard')).toBeInTheDocument();
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByText('Free')).toBeInTheDocument();
      
      // Check second project
      expect(screen.getByText('Flutter Chat App')).toBeInTheDocument();
      expect(screen.getByText('developer')).toBeInTheDocument();
      expect(screen.getByText('$29.99')).toBeInTheDocument();
    });
  });

  test('filters projects by category', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <FindProjects />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('React Dashboard')).toBeInTheDocument();
    });

    // Select mobile category
    const categorySelect = screen.getByDisplayValue('All Categories');
    await user.selectOptions(categorySelect, 'mobile');

    // Should make new API call with category filter
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('category=mobile')
      );
    });
  });

  test('performs search when typing in search box', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <FindProjects />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText(/search projects/i);
    await user.type(searchInput, 'react');

    // Should trigger search after typing
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('search=react')
      );
    });
  });

  test('performs AI search when sparkles button is clicked', async () => {
    const user = userEvent.setup();
    
    // Mock AI search response
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        projects: [mockProjects[0]],
        searchSummary: 'Found React projects matching your query',
        totalFound: 1
      }
    });

    render(
      <TestWrapper>
        <FindProjects />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText(/search projects/i);
    await user.type(searchInput, 'I need a React dashboard');

    // Click AI search button (sparkles icon)
    const aiSearchButton = screen.getByTitle('AI Smart Search');
    await user.click(aiSearchButton);

    // Should call AI search endpoint
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith('/projects/ai-search', {
        query: 'I need a React dashboard'
      });
    });

    // Should display AI search summary
    await waitFor(() => {
      expect(screen.getByText(/AI Search:/)).toBeInTheDocument();
      expect(screen.getByText(/Found React projects matching your query/)).toBeInTheDocument();
    });
  });

  test('handles empty search results', async () => {
    // Mock empty response
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        projects: [],
        pagination: {
          current: 1,
          pages: 0,
          total: 0
        }
      }
    });

    render(
      <TestWrapper>
        <FindProjects />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('No projects found')).toBeInTheDocument();
      expect(screen.getByText('Clear Filters')).toBeInTheDocument();
    });
  });

  test('handles API errors gracefully', async () => {
    // Mock API error
    mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));

    render(
      <TestWrapper>
        <FindProjects />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('No projects found')).toBeInTheDocument();
    });
  });

  test('disables AI search button when no search query', () => {
    render(
      <TestWrapper>
        <FindProjects />
      </TestWrapper>
    );

    const aiSearchButton = screen.getByTitle('AI Smart Search');
    expect(aiSearchButton).toBeDisabled();
  });

  test('shows loading state during AI search', async () => {
    const user = userEvent.setup();
    
    // Mock slow AI search response
    mockedAxios.post.mockImplementationOnce(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          data: { projects: [], searchSummary: 'No results' }
        }), 100)
      )
    );

    render(
      <TestWrapper>
        <FindProjects />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText(/search projects/i);
    await user.type(searchInput, 'test query');

    const aiSearchButton = screen.getByTitle('AI Smart Search');
    await user.click(aiSearchButton);

    // Should show loading spinner
    expect(screen.getByTitle('AI Smart Search')).toBeDisabled();
    // Note: We'd need to check for loading spinner in the button, 
    // but it's hard to test with our current implementation
  });

  test('clears filters when clear filters button is clicked', async () => {
    const user = userEvent.setup();
    
    // Mock empty response first
    mockedAxios.get.mockResolvedValueOnce({
      data: { projects: [], pagination: { current: 1, pages: 0, total: 0 } }
    });

    render(
      <TestWrapper>
        <FindProjects />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Clear Filters')).toBeInTheDocument();
    });

    // Mock response after clearing filters
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        projects: mockProjects,
        pagination: { current: 1, pages: 1, total: 2 }
      }
    });

    const clearButton = screen.getByText('Clear Filters');
    await user.click(clearButton);

    // Should reset search and category
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.not.stringContaining('search=')
      );
    });
  });
});