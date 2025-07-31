import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import PostProjects from '../../pages/PostProjects';
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

describe('PostProjects Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  test('renders post projects form', () => {
    render(
      <TestWrapper>
        <PostProjects />
      </TestWrapper>
    );

    expect(screen.getByText('Post a New Project')).toBeInTheDocument();
    expect(screen.getByLabelText(/project title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
  });

  test('enables AI Generate button when title is provided', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <PostProjects />
      </TestWrapper>
    );

    const aiButton = screen.getByText('AI Generate');
    expect(aiButton).toBeDisabled();

    const titleInput = screen.getByLabelText(/project title/i);
    await user.type(titleInput, 'My Test Project');

    expect(aiButton).not.toBeDisabled();
  });

  test('performs AI generation when button is clicked', async () => {
    const user = userEvent.setup();
    
    // Mock AI response
    const mockAIResponse = {
      title: 'Enhanced Test Project',
      description: 'A comprehensive test project with advanced features',
      tags: ['react', 'javascript'],
      category: 'web',
      tech_stack: ['React', 'Node.js'],
      freeRepositoryUrl: 'https://github.com/user/project-free',
      paidRepositoryUrl: 'https://github.com/user/project-pro',
      features: {
        freeFeatures: ['Basic features'],
        paidFeatures: ['Advanced features']
      }
    };

    mockedAxios.post.mockResolvedValueOnce({
      data: mockAIResponse
    });

    render(
      <TestWrapper>
        <PostProjects />
      </TestWrapper>
    );

    const titleInput = screen.getByLabelText(/project title/i);
    await user.type(titleInput, 'Test Project');

    const aiButton = screen.getByText('AI Generate');
    await user.click(aiButton);

    // Should call AI generate endpoint
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith('/projects/ai-generate', {
        projectName: 'Test Project',
        description: 'A project called Test Project'
      });
    });

    // Should populate form fields
    await waitFor(() => {
      expect(screen.getByDisplayValue('A comprehensive test project with advanced features')).toBeInTheDocument();
      expect(screen.getByDisplayValue('react, javascript')).toBeInTheDocument();
    });
  });

  test('shows loading state during AI generation', async () => {
    const user = userEvent.setup();
    
    // Mock slow AI response
    mockedAxios.post.mockImplementationOnce(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({ data: {} }), 100)
      )
    );

    render(
      <TestWrapper>
        <PostProjects />
      </TestWrapper>
    );

    const titleInput = screen.getByLabelText(/project title/i);
    await user.type(titleInput, 'Test Project');

    const aiButton = screen.getByText('AI Generate');
    await user.click(aiButton);

    expect(screen.getByText('Generating...')).toBeInTheDocument();
  });

  test('handles AI generation errors', async () => {
    const user = userEvent.setup();
    
    mockedAxios.post.mockRejectedValueOnce(new Error('AI service unavailable'));

    render(
      <TestWrapper>
        <PostProjects />
      </TestWrapper>
    );

    const titleInput = screen.getByLabelText(/project title/i);
    await user.type(titleInput, 'Test Project');

    const aiButton = screen.getByText('AI Generate');
    await user.click(aiButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to generate ai content/i)).toBeInTheDocument();
    });
  });

  test('saves project as draft', async () => {
    const user = userEvent.setup();
    
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        message: 'Draft saved successfully',
        project: { _id: 'draft123', title: 'Test Draft' }
      }
    });

    render(
      <TestWrapper>
        <PostProjects />
      </TestWrapper>
    );

    const titleInput = screen.getByLabelText(/project title/i);
    await user.type(titleInput, 'Test Draft');

    const draftButton = screen.getByText('Save as Draft');
    await user.click(draftButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith('/projects/draft', expect.any(Object));
    });

    await waitFor(() => {
      expect(screen.getByText('Draft Saved Successfully!')).toBeInTheDocument();
    });
  });

  test('publishes project with complete data', async () => {
    const user = userEvent.setup();
    
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        message: 'Project created successfully',
        project: { _id: 'project123', title: 'Test Project' }
      }
    });

    render(
      <TestWrapper>
        <PostProjects />
      </TestWrapper>
    );

    // Fill in required fields
    const titleInput = screen.getByLabelText(/project title/i);
    await user.type(titleInput, 'Complete Project');

    const descriptionInput = screen.getByLabelText(/description/i);
    await user.type(descriptionInput, 'A complete project description');

    const categorySelect = screen.getByLabelText(/category/i);
    await user.selectOptions(categorySelect, 'web');

    const publishButton = screen.getByText('Publish Project');
    await user.click(publishButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith('/projects', expect.objectContaining({
        title: 'Complete Project',
        description: 'A complete project description',
        category: 'web'
      }));
    });
  });

  test('shows different license options and pricing', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <PostProjects />
      </TestWrapper>
    );

    // Check free license (default)
    expect(screen.getByLabelText('Free')).toBeChecked();

    // Select paid license
    const paidRadio = screen.getByLabelText('Paid Only');
    await user.click(paidRadio);

    // Should show price input
    expect(screen.getByLabelText(/your price/i)).toBeInTheDocument();

    // Enter price and check fee calculation
    const priceInput = screen.getByLabelText(/your price/i);
    await user.type(priceInput, '50');

    await waitFor(() => {
      expect(screen.getByText('$50.00')).toBeInTheDocument(); // Customer pays
      expect(screen.getByText('-$10.00')).toBeInTheDocument(); // Marketplace fee
      expect(screen.getByText('$40.00')).toBeInTheDocument(); // Seller earnings
    });
  });

  test('shows freemium license options', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <PostProjects />
      </TestWrapper>
    );

    const freemiumRadio = screen.getByLabelText('Freemium');
    await user.click(freemiumRadio);

    // Should show both repository URL fields
    expect(screen.getByLabelText(/free version repository url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/paid version repository url/i)).toBeInTheDocument();

    // Should show both feature fields
    expect(screen.getByLabelText(/free version features/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/paid version features/i)).toBeInTheDocument();
  });

  test('generates fake GitHub URLs', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <PostProjects />
      </TestWrapper>
    );

    const titleInput = screen.getByLabelText(/project title/i);
    await user.type(titleInput, 'My Cool Project');

    // Select freemium to show both URL fields
    const freemiumRadio = screen.getByLabelText('Freemium');
    await user.click(freemiumRadio);

    const generateFreeButton = screen.getAllByText('Generate Test URL')[0];
    await user.click(generateFreeButton);

    const freeUrlInput = screen.getByLabelText(/free version repository url/i) as HTMLInputElement;
    expect(freeUrlInput.value).toContain('github.com');
    expect(freeUrlInput.value).toContain('my-cool-project-free');
  });

  test('validates required fields for publishing', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <PostProjects />
      </TestWrapper>
    );

    const publishButton = screen.getByText('Publish Project');
    await user.click(publishButton);

    // Should not submit without required fields
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  test('handles API errors when submitting', async () => {
    const user = userEvent.setup();
    
    mockedAxios.post.mockRejectedValueOnce({
      response: {
        data: { error: 'Required fields missing' }
      }
    });

    render(
      <TestWrapper>
        <PostProjects />
      </TestWrapper>
    );

    const titleInput = screen.getByLabelText(/project title/i);
    await user.type(titleInput, 'Test Project');

    const publishButton = screen.getByText('Publish Project');
    await user.click(publishButton);

    await waitFor(() => {
      expect(screen.getByText('Required fields missing')).toBeInTheDocument();
    });
  });

  test('disables save as draft when no title', () => {
    render(
      <TestWrapper>
        <PostProjects />
      </TestWrapper>
    );

    const draftButton = screen.getByText('Save as Draft');
    expect(draftButton).toBeDisabled();
  });
});