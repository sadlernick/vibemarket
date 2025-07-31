import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import Dashboard from '../../pages/Dashboard';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock user context
const mockUser = {
  _id: 'user123',
  username: 'testuser',
  email: 'test@example.com'
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

// Mock AuthContext
jest.mock('../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: mockUser,
    login: jest.fn(),
    logout: jest.fn(),
    isAdmin: false
  })
}));

const mockDashboardData = {
  publishedProjects: [
    {
      _id: 'project1',
      title: 'React Dashboard',
      description: 'A comprehensive dashboard built with React',
      category: 'web',
      license: { type: 'paid', price: 29.99 },
      stats: { views: 500, downloads: 25, stars: 15 },
      status: 'published',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z'
    }
  ],
  draftProjects: [
    {
      _id: 'draft1',
      title: 'Work in Progress',
      description: 'A project still being developed',
      category: 'web',
      license: { type: 'free', price: 0 },
      stats: { views: 0, downloads: 0, stars: 0 },
      status: 'draft',
      createdAt: '2025-01-02T00:00:00.000Z',
      updatedAt: '2025-01-03T00:00:00.000Z'
    }
  ],
  purchasedLicenses: [
    {
      _id: 'license1',
      project: {
        _id: 'purchased1',
        title: 'Flutter Chat App',
        author: { username: 'developer' },
        license: { price: 49.99 }
      },
      purchaseDate: '2025-01-01T00:00:00.000Z'
    }
  ],
  sellerStats: {
    totalProjects: 1,
    totalViews: 500,
    totalDownloads: 25,
    totalStars: 15,
    totalRevenue: 23.99,
    monthlyRevenue: 23.99,
    paidDownloads: 1,
    freeDownloads: 24
  },
  recentActivity: [
    {
      type: 'purchase',
      message: 'buyer123 purchased React Dashboard',
      date: '2025-01-01T00:00:00.000Z',
      revenue: 23.99
    }
  ]
};

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    
    // Mock successful dashboard API response
    mockedAxios.get.mockResolvedValue({
      data: mockDashboardData
    });
  });

  test('renders dashboard with user greeting', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Welcome back, testuser!')).toBeInTheDocument();
      expect(screen.getByText(/Here's what's happening with your projects/)).toBeInTheDocument();
    });
  });

  test('displays seller statistics correctly', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument(); // Published Projects
      expect(screen.getByText('500')).toBeInTheDocument(); // Total Views
      expect(screen.getByText('25')).toBeInTheDocument(); // Downloads
      expect(screen.getByText('$23.99')).toBeInTheDocument(); // Total Revenue
    });
  });

  test('shows draft projects with notification badge', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      // Check for draft badge in tab
      expect(screen.getByText('1')).toBeInTheDocument(); // Badge number
      expect(screen.getByText('Drafts')).toBeInTheDocument();
    });
  });

  test('switches between tabs correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Welcome back, testuser!')).toBeInTheDocument();
    });

    // Click on Projects tab
    const projectsTab = screen.getByText('Published Projects');
    await user.click(projectsTab);

    await waitFor(() => {
      expect(screen.getByText('React Dashboard')).toBeInTheDocument();
    });

    // Click on Drafts tab
    const draftsTab = screen.getByText('Drafts');
    await user.click(draftsTab);

    await waitFor(() => {
      expect(screen.getByText('Work in Progress')).toBeInTheDocument();
      expect(screen.getByText('Draft')).toBeInTheDocument(); // Draft badge
    });

    // Click on Purchases tab
    const purchasesTab = screen.getByText('Purchases');
    await user.click(purchasesTab);

    await waitFor(() => {
      expect(screen.getByText('Flutter Chat App')).toBeInTheDocument();
      expect(screen.getByText('by developer')).toBeInTheDocument();
    });
  });

  test('displays seller analytics when user has projects', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Seller Analytics')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument(); // Total Stars
      expect(screen.getByText('24')).toBeInTheDocument(); // Free Downloads
      expect(screen.getByText('1')).toBeInTheDocument(); // Paid Downloads
    });
  });

  test('displays recent activity', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(screen.getByText('buyer123 purchased React Dashboard')).toBeInTheDocument();
      expect(screen.getByText('+$23.99')).toBeInTheDocument();
    });
  });

  test('handles publish draft action', async () => {
    const user = userEvent.setup();
    
    mockedAxios.post.mockResolvedValueOnce({
      data: { message: 'Project published successfully' }
    });

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // Switch to drafts tab
    await waitFor(() => {
      expect(screen.getByText('Drafts')).toBeInTheDocument();
    });

    const draftsTab = screen.getByText('Drafts');
    await user.click(draftsTab);

    await waitFor(() => {
      expect(screen.getByText('Work in Progress')).toBeInTheDocument();
    });

    // Click publish button
    const publishButton = screen.getByText('Publish');
    await user.click(publishButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith('/projects/draft1/publish');
    });
  });

  test('handles delete draft action with confirmation', async () => {
    const user = userEvent.setup();
    
    // Mock window.confirm
    const mockConfirm = jest.spyOn(window, 'confirm');
    mockConfirm.mockReturnValue(true);

    mockedAxios.delete.mockResolvedValueOnce({
      data: { message: 'Draft deleted successfully' }
    });

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // Switch to drafts tab
    const draftsTab = screen.getByText('Drafts');
    await user.click(draftsTab);

    await waitFor(() => {
      expect(screen.getByText('Work in Progress')).toBeInTheDocument();
    });

    // Click delete button
    const deleteButton = screen.getByRole('button', { name: '' }); // TrashIcon button
    await user.click(deleteButton);

    expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to delete this draft?');
    
    await waitFor(() => {
      expect(mockedAxios.delete).toHaveBeenCalledWith('/projects/draft1');
    });

    mockConfirm.mockRestore();
  });

  test('shows empty states when no data available', async () => {
    // Mock empty dashboard data
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        publishedProjects: [],
        draftProjects: [],
        purchasedLicenses: [],
        sellerStats: {
          totalProjects: 0,
          totalViews: 0,
          totalDownloads: 0,
          totalStars: 0,
          totalRevenue: 0,
          monthlyRevenue: 0,
          paidDownloads: 0,
          freeDownloads: 0
        },
        recentActivity: []
      }
    });

    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // Check projects tab empty state
    const projectsTab = screen.getByText('Published Projects');
    await user.click(projectsTab);

    await waitFor(() => {
      expect(screen.getByText('No published projects')).toBeInTheDocument();
      expect(screen.getByText('Create Your First Project')).toBeInTheDocument();
    });

    // Check drafts tab empty state
    const draftsTab = screen.getByText('Drafts');
    await user.click(draftsTab);

    await waitFor(() => {
      expect(screen.getByText('No draft projects')).toBeInTheDocument();
    });

    // Check purchases tab empty state
    const purchasesTab = screen.getByText('Purchases');
    await user.click(purchasesTab);

    await waitFor(() => {
      expect(screen.getByText('No purchases yet')).toBeInTheDocument();
      expect(screen.getByText('Browse Projects')).toBeInTheDocument();
    });
  });

  test('displays loading state initially', () => {
    // Mock slow API response
    mockedAxios.get.mockImplementationOnce(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({ data: mockDashboardData }), 100)
      )
    );

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // Should show loading skeleton
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  test('handles API errors gracefully', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load dashboard data')).toBeInTheDocument();
    });
  });

  test('redirects to login when user is not authenticated', () => {
    // Mock no user
    jest.mocked(require('../../contexts/AuthContext').useAuth).mockReturnValue({
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
      isAdmin: false
    });

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('shows quick actions in overview tab', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('Create New Project')).toBeInTheDocument();
      expect(screen.getByText('Browse Projects')).toBeInTheDocument();
    });
  });

  test('shows draft preview in overview when drafts exist', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Recent Drafts')).toBeInTheDocument();
      expect(screen.getByText('Work in Progress')).toBeInTheDocument();
    });
  });

  test('calls dashboard API on component mount', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('refreshes data after publishing draft', async () => {
    const user = userEvent.setup();
    
    mockedAxios.post.mockResolvedValueOnce({
      data: { message: 'Project published successfully' }
    });

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    const draftsTab = screen.getByText('Drafts');
    await user.click(draftsTab);

    await waitFor(() => {
      expect(screen.getByText('Publish')).toBeInTheDocument();
    });

    const publishButton = screen.getByText('Publish');
    await user.click(publishButton);

    // Should call dashboard API again to refresh data
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledTimes(2); // Initial load + refresh
    });
  });
});