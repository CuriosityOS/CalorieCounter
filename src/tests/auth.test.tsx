import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import AuthGuard from '@/components/app/AuthGuard';
import LoginPage from '@/app/login/page';
import { useRouter, usePathname } from 'next/navigation';

// Mock the useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

describe('Auth functionality tests', () => {
  // Common mock objects
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  describe('useAuth hook', () => {
    test('should handle successful login', async () => {
      // Mock the authentication state
      const mockAuth = {
        user: null,
        loading: false,
        error: null,
        signIn: jest.fn().mockResolvedValue({}),
        signUp: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn(),
      };
      
      (useAuth as jest.Mock).mockReturnValue(mockAuth);
      
      render(<LoginPage />);
      
      // Fill the login form
      fireEvent.change(screen.getByLabelText(/Email/i), {
        target: { value: 'test@example.com' },
      });
      
      fireEvent.change(screen.getByLabelText(/Password/i), {
        target: { value: 'password123' },
      });
      
      fireEvent.click(screen.getByRole('button', { name: /Sign in/i }));
      
      await waitFor(() => {
        expect(mockAuth.signIn).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });
    
    test('should display error message on login failure', async () => {
      // Mock failed authentication
      const mockAuth = {
        user: null,
        loading: false,
        error: new Error('Invalid login credentials'),
        signIn: jest.fn().mockRejectedValue(new Error('Invalid login credentials')),
        signUp: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn(),
      };
      
      (useAuth as jest.Mock).mockReturnValue(mockAuth);
      
      render(<LoginPage />);
      
      // Fill the login form
      fireEvent.change(screen.getByLabelText(/Email/i), {
        target: { value: 'test@example.com' },
      });
      
      fireEvent.change(screen.getByLabelText(/Password/i), {
        target: { value: 'wrongpassword' },
      });
      
      fireEvent.click(screen.getByRole('button', { name: /Sign in/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/Invalid login credentials/i)).toBeInTheDocument();
      });
    });
  });

  describe('AuthGuard', () => {
    test('should redirect to login when user is not authenticated', async () => {
      // Mock unauthenticated state
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false,
        error: null,
      });
      
      (usePathname as jest.Mock).mockReturnValue('/');
      
      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );
      
      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith('/login');
      });
    });
    
    test('should allow access to protected routes when authenticated', async () => {
      // Mock authenticated state
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: '123', email: 'test@example.com' },
        loading: false,
        error: null,
      });
      
      (usePathname as jest.Mock).mockReturnValue('/');
      
      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });
    
    test('should show loading state when auth is being checked', () => {
      // Mock loading state
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: true,
        error: null,
      });
      
      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );
      
      // Check for loading indicator
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
    
    test('should redirect authenticated users away from login page', async () => {
      // Mock authenticated state
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: '123', email: 'test@example.com' },
        loading: false,
        error: null,
      });
      
      (usePathname as jest.Mock).mockReturnValue('/login');
      
      render(
        <AuthGuard>
          <div>Login Page</div>
        </AuthGuard>
      );
      
      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith('/');
      });
    });
  });
});