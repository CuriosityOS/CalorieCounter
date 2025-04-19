// This test file is designed to test the complete authentication flow
// It focuses on integration tests that identify potential issues in the auth implementation

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, test, expect, describe, beforeEach, afterEach } from 'vitest';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase-client';
import LoginPage from '@/app/login/page';
import SignupPage from '@/app/signup/page';
import NavBar from '@/components/app/NavBar';
import AuthGuard from '@/components/app/AuthGuard';

// Mock the entire auth object
const mockAuth = {
  getSession: vi.fn(),
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  onAuthStateChange: vi.fn(),
};

// Mock supabase client
vi.mock('@/lib/supabase-client', () => ({
  supabase: {
    auth: mockAuth,
  },
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => '/',
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div data-testid="motion-div" {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 data-testid="motion-h1" {...props}>{children}</h1>,
  },
}));

// Mock localStorage
const setupLocalStorageMock = () => {
  let store: Record<string, string> = {};
  
  const localStorageMock = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
  
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true
  });
  
  return { store, localStorageMock };
};

describe('Authentication Integration Tests', () => {
  const { localStorageMock } = setupLocalStorageMock();
  
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    
    // Default mock for onAuthStateChange
    mockAuth.onAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    });
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('Complete Sign-up Flow', () => {
    test('should complete full signup process successfully', async () => {
      // 1. Setup mocks for successful signup
      mockAuth.signUp.mockResolvedValue({ 
        data: { 
          user: { id: 'new-user-id', email: 'new-user@example.com' },
          session: { access_token: 'new-token' }
        }, 
        error: null 
      });
      
      // Initial state - no session
      mockAuth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });
      
      // 2. Render the signup page
      render(<SignupPage />);
      
      // 3. Fill the form
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'new-user@example.com' }
      });
      
      fireEvent.change(screen.getByLabelText(/^password$/i), {
        target: { value: 'password123' }
      });
      
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'password123' }
      });
      
      // 4. Submit the form
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
      
      // 5. Verify supabase.auth.signUp was called with correct parameters
      await waitFor(() => {
        expect(mockAuth.signUp).toHaveBeenCalledWith({
          email: 'new-user@example.com',
          password: 'password123',
          options: {
            data: { email_confirmed: true }
          }
        });
      });
      
      // 6. Simulate auth state change after successful signup
      const authStateCallback = mockAuth.onAuthStateChange.mock.calls[0][0];
      authStateCallback('SIGNED_IN', { 
        user: { id: 'new-user-id', email: 'new-user@example.com' } 
      });
      
      // 7. Verify success message is displayed
      expect(screen.getByText(/account created/i)).toBeInTheDocument();
    });
    
    test('should handle signup errors', async () => {
      // 1. Setup mocks for failed signup
      const errorMessage = 'Email already registered';
      mockAuth.signUp.mockResolvedValue({ 
        data: { user: null, session: null }, 
        error: { message: errorMessage } 
      });
      
      // Initial state - no session
      mockAuth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });
      
      // 2. Render the signup page
      render(<SignupPage />);
      
      // 3. Fill the form
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'existing@example.com' }
      });
      
      fireEvent.change(screen.getByLabelText(/^password$/i), {
        target: { value: 'password123' }
      });
      
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'password123' }
      });
      
      // 4. Submit the form
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
      
      // 5. Verify error message is displayed
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });
  });
  
  describe('Complete Sign-in Flow', () => {
    test('should complete full signin process successfully', async () => {
      // 1. Setup mocks for successful signin
      mockAuth.signInWithPassword.mockResolvedValue({ 
        data: { 
          user: { id: 'user-id', email: 'user@example.com' },
          session: { access_token: 'token' }
        }, 
        error: null 
      });
      
      // Initial state - no session
      mockAuth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });
      
      // 2. Render the login page
      render(<LoginPage />);
      
      // 3. Fill the form
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'user@example.com' }
      });
      
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' }
      });
      
      // 4. Submit the form
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      
      // 5. Verify supabase.auth.signInWithPassword was called with correct parameters
      await waitFor(() => {
        expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
          email: 'user@example.com',
          password: 'password123',
        });
      });
      
      // 6. Simulate auth state change after successful signin
      const authStateCallback = mockAuth.onAuthStateChange.mock.calls[0][0];
      authStateCallback('SIGNED_IN', { 
        user: { id: 'user-id', email: 'user@example.com' } 
      });
    });
    
    test('should handle signin errors', async () => {
      // 1. Setup mocks for failed signin
      const errorMessage = 'Invalid login credentials';
      mockAuth.signInWithPassword.mockResolvedValue({ 
        data: { user: null, session: null }, 
        error: { message: errorMessage } 
      });
      
      // Initial state - no session
      mockAuth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });
      
      // 2. Render the login page
      render(<LoginPage />);
      
      // 3. Fill the form
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'wrong@example.com' }
      });
      
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'wrongpassword' }
      });
      
      // 4. Submit the form
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      
      // 5. Verify error message is displayed
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });
  });
  
  describe('Session Persistence Tests', () => {
    test('should load existing session on app initialization', async () => {
      // 1. Setup mock for existing session
      const mockUser = { id: 'existing-user-id', email: 'existing@example.com' };
      const mockSession = { user: mockUser, access_token: 'existing-token' };
      
      mockAuth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });
      
      // 2. Create a component that uses the auth hook
      const TestComponent = () => {
        const { user, loading } = useAuth();
        
        if (loading) return <div>Loading...</div>;
        return user ? <div>User: {user.email}</div> : <div>Not logged in</div>;
      };
      
      // 3. Render the component
      render(<TestComponent />);
      
      // 4. Verify session is loaded
      await waitFor(() => {
        expect(mockAuth.getSession).toHaveBeenCalled();
        expect(screen.getByText(`User: ${mockUser.email}`)).toBeInTheDocument();
      });
    });
    
    test('should maintain session after page reload/navigation', async () => {
      // 1. Setup mock for existing session
      const mockUser = { id: 'user-id', email: 'user@example.com' };
      const mockSession = { user: mockUser, access_token: 'token' };
      
      mockAuth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });
      
      // 2. Simulate page load by rendering AuthGuard with protected content
      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );
      
      // 3. Verify auth guard allows access to protected content
      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
      
      // 4. Simulate a second component that relies on the same auth state
      // This represents a navigation to another page in the app
      render(<NavBar />);
      
      // 5. Verify user is still authenticated in the NavBar
      await waitFor(() => {
        // The sign out button is only visible when the user is authenticated
        expect(screen.getByText('Sign Out')).toBeInTheDocument();
      });
    });
  });
  
  describe('Auth Guard Tests', () => {
    test('should redirect unauthenticated users away from protected routes', async () => {
      // 1. Setup mocks
      const mockReplace = vi.fn();
      vi.mock('next/navigation', () => ({
        useRouter: () => ({
          push: vi.fn(),
          replace: mockReplace,
        }),
        usePathname: () => '/protected',
      }));
      
      // No active session
      mockAuth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });
      
      // 2. Render AuthGuard with protected content
      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );
      
      // 3. Verify redirect to login page
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/login');
      });
    });
    
    test('should redirect authenticated users away from auth pages', async () => {
      // 1. Setup mocks
      const mockReplace = vi.fn();
      vi.mock('next/navigation', () => ({
        useRouter: () => ({
          push: vi.fn(),
          replace: mockReplace,
        }),
        usePathname: () => '/login',
      }));
      
      // Active session
      const mockUser = { id: 'user-id', email: 'user@example.com' };
      mockAuth.getSession.mockResolvedValue({
        data: { session: { user: mockUser } },
        error: null,
      });
      
      // 2. Render AuthGuard with login page
      render(
        <AuthGuard>
          <div>Login Page</div>
        </AuthGuard>
      );
      
      // 3. Verify redirect to home page
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/');
      });
    });
  });
  
  describe('SignOut Process', () => {
    test('should complete signout process successfully', async () => {
      // 1. Setup mocks
      const mockRouter = { push: vi.fn() };
      vi.mock('next/navigation', () => ({
        useRouter: () => mockRouter,
        usePathname: () => '/',
      }));
      
      // Mock successful signout
      mockAuth.signOut.mockResolvedValue({ error: null });
      
      // Mock active session
      const mockUser = { id: 'user-id', email: 'user@example.com' };
      mockAuth.getSession.mockResolvedValue({
        data: { session: { user: mockUser } },
        error: null,
      });
      
      // 2. Render NavBar (contains sign out button)
      render(<NavBar />);
      
      // 3. Click sign out button
      fireEvent.click(screen.getByText('Sign Out'));
      
      // 4. Verify signOut was called
      expect(mockAuth.signOut).toHaveBeenCalled();
      
      // 5. Verify redirect to login page
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/login');
      });
      
      // 6. Simulate auth state change after signout
      const authStateCallback = mockAuth.onAuthStateChange.mock.calls[0][0];
      authStateCallback('SIGNED_OUT', null);
    });
  });
});