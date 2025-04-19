import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import LoginPage from '@/app/login/page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a real QueryClient for testing
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

// Mock the Supabase client
jest.mock('@/lib/supabase-client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: {
          subscription: {
            unsubscribe: jest.fn()
          }
        }
      })),
      resetPasswordForEmail: jest.fn()
    }
  }
}));

// Helper component wrapper for testing
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

describe('Authentication Integration Tests', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (usePathname as jest.Mock).mockReturnValue('/login');
    
    // Mock default getSession response (unauthenticated)
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: {
        session: null
      },
      error: null
    });
  });

  test('should display login form and attempt to sign in', async () => {
    // Mock successful sign in
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: {
        user: { id: '123', email: 'test@example.com' },
        session: { access_token: 'fake-token' }
      },
      error: null
    });
    
    render(<LoginPage />, { wrapper: Wrapper });
    
    // Check if login form is displayed
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    
    // Fill in and submit the form
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'test@example.com' }
    });
    
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'password123' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /Sign in/i }));
    
    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
    
    // Check redirect after successful login
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/');
    });
  });

  test('should display error message when login fails', async () => {
    // Mock failed sign in
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' }
    });
    
    render(<LoginPage />, { wrapper: Wrapper });
    
    // Fill in and submit the form
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'test@example.com' }
    });
    
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'wrongpassword' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /Sign in/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/Invalid login credentials/i)).toBeInTheDocument();
    });
  });

  test('should handle Supabase session state changes', async () => {
    // First render with no user
    const { rerender } = render(<LoginPage />, { wrapper: Wrapper });
    
    // After rendering, simulate a Supabase auth state change event
    const authStateCallback = (supabase.auth.onAuthStateChange as jest.Mock).mock.calls[0][0];
    
    // Simulate auth state change with a user
    act(() => {
      authStateCallback('SIGNED_IN', {
        user: { id: '123', email: 'test@example.com' },
        access_token: 'fake-token'
      });
    });
    
    // Rerender after state change
    rerender(<LoginPage />);
    
    // Check if router.push was called to redirect to home page
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/');
    });
  });

  test('should properly clean up auth subscription on unmount', () => {
    const unsubscribeMock = jest.fn();
    (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
      data: {
        subscription: {
          unsubscribe: unsubscribeMock
        }
      }
    });
    
    const { unmount } = render(<LoginPage />, { wrapper: Wrapper });
    
    // Unmount the component
    unmount();
    
    // Check if the subscription was unsubscribed
    expect(unsubscribeMock).toHaveBeenCalled();
  });
});