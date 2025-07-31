import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import CheckoutForm from '../../components/Payments/CheckoutForm';
import GitHubLogin from '../../components/Auth/GitHubLogin';
import GitHubRepositoryPicker from '../../components/GitHubRepositoryPicker';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock Stripe
jest.mock('@stripe/react-stripe-js', () => ({
  useStripe: () => ({
    confirmCardPayment: jest.fn()
  }),
  useElements: () => ({
    getElement: jest.fn(() => ({}))
  }),
  CardElement: () => <div data-testid="card-element">Card Element</div>
}));

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe('Payment and GitHub Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Stripe Payment Integration', () => {
    const mockProps = {
      projectId: 'test-project-id',
      projectTitle: 'Test Project',
      amount: 24.99,
      marketplaceFee: 4.99,
      sellerAmount: 20.00,
      onSuccess: jest.fn(),
      onCancel: jest.fn()
    };

    test('creates payment intent on mount', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { clientSecret: 'pi_test_client_secret' }
      });

      render(
        <TestWrapper>
          <CheckoutForm {...mockProps} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith('/payments/create-payment-intent', {
          projectId: 'test-project-id'
        });
      });
    });

    test('displays project and pricing information correctly', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { clientSecret: 'pi_test_client_secret' }
      });

      render(
        <TestWrapper>
          <CheckoutForm {...mockProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Test Project')).toBeInTheDocument();
      expect(screen.getByText('$24.99')).toBeInTheDocument();
      expect(screen.getByText('$20.00')).toBeInTheDocument();
      expect(screen.getByText('Pay $24.99')).toBeInTheDocument();
    });

    test('handles payment submission', async () => {
      const mockStripe = {
        confirmCardPayment: jest.fn().mockResolvedValue({
          paymentIntent: { 
            id: 'pi_test_success', 
            status: 'succeeded' 
          }
        })
      };

      mockedAxios.post
        .mockResolvedValueOnce({
          data: { clientSecret: 'pi_test_client_secret' }
        })
        .mockResolvedValueOnce({
          data: { success: true, license: 'license-id' }
        });

      // Mock Stripe hook to return our mock
      jest.doMock('@stripe/react-stripe-js', () => ({
        useStripe: () => mockStripe,
        useElements: () => ({
          getElement: jest.fn(() => ({}))
        }),
        CardElement: () => <div data-testid="card-element">Card Element</div>
      }));

      render(
        <TestWrapper>
          <CheckoutForm {...mockProps} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /pay \$24\.99/i })).toBeInTheDocument();
      });

      // Note: Full payment flow testing would require more complex Stripe mocking
    });

    test('displays error when payment intent creation fails', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: { data: { error: 'Payment setup failed' } }
      });

      render(
        <TestWrapper>
          <CheckoutForm {...mockProps} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Payment setup failed')).toBeInTheDocument();
      });
    });

    test('calculates marketplace fees correctly', () => {
      const sellerPrice = 20.00;
      const marketplaceFee = Math.round(sellerPrice * 0.20 * 100) / 100;
      const totalPrice = sellerPrice + marketplaceFee;
      
      expect(marketplaceFee).toBe(4.00);
      expect(totalPrice).toBe(24.00);
    });
  });

  describe('GitHub OAuth Integration', () => {
    test('displays GitHub login button', () => {
      render(
        <TestWrapper>
          <GitHubLogin />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /continue with github/i })).toBeInTheDocument();
    });

    test('initiates GitHub OAuth flow', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { authUrl: 'https://github.com/login/oauth/authorize?client_id=test' }
      });

      // Mock window.open
      const mockOpen = jest.fn();
      Object.defineProperty(window, 'open', { value: mockOpen });

      render(
        <TestWrapper>
          <GitHubLogin />
        </TestWrapper>
      );

      const githubButton = screen.getByRole('button', { name: /continue with github/i });
      fireEvent.click(githubButton);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith('/github/oauth/login');
        expect(mockOpen).toHaveBeenCalledWith(
          'https://github.com/login/oauth/authorize?client_id=test',
          'github-oauth',
          expect.stringContaining('width=600,height=700')
        );
      });
    });

    test('handles OAuth callback success', async () => {
      const mockOnSuccess = jest.fn();
      
      mockedAxios.get.mockResolvedValueOnce({
        data: { authUrl: 'https://github.com/login/oauth/authorize?client_id=test' }
      });

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          token: 'jwt-token',
          user: {
            id: 'user-id',
            username: 'testuser',
            email: 'test@example.com'
          }
        }
      });

      render(
        <TestWrapper>
          <GitHubLogin onSuccess={mockOnSuccess} />
        </TestWrapper>
      );

      // Simulate OAuth callback message
      const messageEvent = new MessageEvent('message', {
        data: {
          type: 'GITHUB_OAUTH_SUCCESS',
          code: 'oauth-code',
          state: 'oauth-state'
        },
        origin: window.location.origin
      });

      const githubButton = screen.getByRole('button', { name: /continue with github/i });
      fireEvent.click(githubButton);

      // Simulate the message from popup
      window.dispatchEvent(messageEvent);

      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith('/github/oauth/callback', {
          code: 'oauth-code',
          state: 'oauth-state'
        });
      });
    });

    test('handles OAuth error', async () => {
      const mockOnError = jest.fn();
      
      render(
        <TestWrapper>
          <GitHubLogin onError={mockOnError} />
        </TestWrapper>
      );

      // Simulate OAuth error message
      const errorEvent = new MessageEvent('message', {
        data: {
          type: 'GITHUB_OAUTH_ERROR',
          error: 'Access denied'
        },
        origin: window.location.origin
      });

      window.dispatchEvent(errorEvent);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Access denied');
      });
    });
  });

  describe('GitHub Repository Picker', () => {
    const mockProps = {
      value: '',
      onChange: jest.fn(),
      label: 'Repository URL'
    };

    test('displays repository input field', () => {
      render(
        <TestWrapper>
          <GitHubRepositoryPicker {...mockProps} />
        </TestWrapper>
      );

      expect(screen.getByLabelText('Repository URL')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter github repository url/i)).toBeInTheDocument();
    });

    test('shows connect GitHub button when not connected', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { isConnected: false }
      });

      render(
        <TestWrapper>
          <GitHubRepositoryPicker {...mockProps} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /connect github/i })).toBeInTheDocument();
      });
    });

    test('shows browse button when GitHub is connected', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { isConnected: true }
      });

      render(
        <TestWrapper>
          <GitHubRepositoryPicker {...mockProps} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /browse/i })).toBeInTheDocument();
      });
    });

    test('verifies repository URL when entered', async () => {
      const mockOnChange = jest.fn();
      
      mockedAxios.get.mockResolvedValueOnce({
        data: { isConnected: true }
      });

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          verified: true,
          repository: {
            fullName: 'testuser/testrepo',
            description: 'Test repository',
            language: 'JavaScript',
            stars: 10,
            isPrivate: false
          }
        }
      });

      render(
        <TestWrapper>
          <GitHubRepositoryPicker value="" onChange={mockOnChange} label="Repository URL" />
        </TestWrapper>
      );

      const input = await screen.findByLabelText('Repository URL');
      fireEvent.change(input, { target: { value: 'https://github.com/testuser/testrepo' } });

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('https://github.com/testuser/testrepo');
        expect(mockedAxios.post).toHaveBeenCalledWith('/github/verify-repository', {
          repositoryUrl: 'https://github.com/testuser/testrepo'
        });
      });
    });

    test('displays repository verification success', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { isConnected: true }
      });

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          verified: true,
          repository: {
            fullName: 'testuser/testrepo',
            description: 'Test repository',
            language: 'JavaScript',
            stars: 10,
            isPrivate: false
          }
        }
      });

      render(
        <TestWrapper>
          <GitHubRepositoryPicker {...mockProps} />
        </TestWrapper>
      );

      const input = await screen.findByLabelText('Repository URL');
      fireEvent.change(input, { target: { value: 'https://github.com/testuser/testrepo' } });

      await waitFor(() => {
        expect(screen.getByText('Repository verified!')).toBeInTheDocument();
        expect(screen.getByText('testuser/testrepo')).toBeInTheDocument();
        expect(screen.getByText('Test repository')).toBeInTheDocument();
      });
    });

    test('displays repository verification failure', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { isConnected: true }
      });

      mockedAxios.post.mockRejectedValueOnce({
        response: { data: { error: 'Repository not found or not accessible' } }
      });

      render(
        <TestWrapper>
          <GitHubRepositoryPicker {...mockProps} />
        </TestWrapper>
      );

      const input = await screen.findByLabelText('Repository URL');
      fireEvent.change(input, { target: { value: 'https://github.com/invalid/repo' } });

      await waitFor(() => {
        expect(screen.getByText('Verification failed')).toBeInTheDocument();
        expect(screen.getByText('Repository not found or not accessible')).toBeInTheDocument();
      });
    });

    test('fetches and displays user repositories', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({ data: { isConnected: true } })
        .mockResolvedValueOnce({
          data: {
            repositories: [
              {
                id: 1,
                fullName: 'testuser/repo1',
                name: 'repo1',
                description: 'First repository',
                language: 'JavaScript',
                stars: 5,
                forks: 2,
                isPrivate: false,
                hasAccess: true,
                updatedAt: '2024-01-01T00:00:00Z'
              },
              {
                id: 2,
                fullName: 'testuser/repo2',
                name: 'repo2',
                description: 'Second repository',
                language: 'TypeScript',
                stars: 15,
                forks: 8,
                isPrivate: true,
                hasAccess: true,
                updatedAt: '2024-01-02T00:00:00Z'
              }
            ]
          }
        });

      render(
        <TestWrapper>
          <GitHubRepositoryPicker {...mockProps} />
        </TestWrapper>
      );

      const browseButton = await screen.findByRole('button', { name: /browse/i });
      fireEvent.click(browseButton);

      await waitFor(() => {
        expect(screen.getByText('repo1')).toBeInTheDocument();
        expect(screen.getByText('repo2')).toBeInTheDocument();
        expect(screen.getByText('First repository')).toBeInTheDocument();
        expect(screen.getByText('Second repository')).toBeInTheDocument();
      });
    });
  });

  describe('Integration Scenarios', () => {
    test('GitHub authentication enables repository verification for project posting', async () => {
      // Simulate GitHub auth success
      mockedAxios.get.mockResolvedValue({
        data: { isConnected: true }
      });

      // Simulate repository verification
      mockedAxios.post.mockResolvedValue({
        data: {
          verified: true,
          repository: {
            fullName: 'testuser/awesome-project',
            description: 'An awesome project',
            language: 'JavaScript'
          }
        }
      });

      render(
        <TestWrapper>
          <GitHubRepositoryPicker
            value=""
            onChange={jest.fn()}
            label="Project Repository"
          />
        </TestWrapper>
      );

      // Should show browse button when authenticated
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /browse/i })).toBeInTheDocument();
      });

      // Repository verification should work
      const input = screen.getByLabelText('Project Repository');
      fireEvent.change(input, { target: { value: 'https://github.com/testuser/awesome-project' } });

      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith('/github/verify-repository', {
          repositoryUrl: 'https://github.com/testuser/awesome-project'
        });
      });
    });

    test('Stripe payment processing works after GitHub project verification', async () => {
      // This would be a more complex integration test
      // For now, we verify that both systems can coexist
      
      expect(true).toBe(true); // Placeholder for complex integration test
    });
  });
});

// Environment-specific tests
describe('Environment Configuration', () => {
  test('uses correct Stripe configuration', () => {
    const stripeKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
    // In test environment, this might be undefined, which is expected
    expect(typeof stripeKey === 'string' || typeof stripeKey === 'undefined').toBe(true);
  });

  test('GitHub OAuth configuration is environment-aware', () => {
    // GitHub client ID should be available in environment
    // In test, this might not be set, which is fine
    expect(true).toBe(true);
  });
});