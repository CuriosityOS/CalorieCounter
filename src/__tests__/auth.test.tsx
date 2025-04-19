import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, test, expect, describe, beforeEach, afterEach } from 'vitest';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase-client';
import AuthGuard from '@/components/app/AuthGuard';
import LoginPage from '@/app/login/page';
import SignupPage from '@/app/signup/page';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => '/',
}));

// Mock Supabase client
vi.mock('@/lib/supabase-client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      }),
    },
  },
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
  },
}));

describe('Authentication Flow Tests', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('useAuth Hook', () => {
    test('getSession should be called on initialization', async () => {
      // Setup
      const mockSession = {
        data: {
          session: {
            user: { id: 'test-user-id', email: 'test@example.com' },
          },
        },
        error: null,
      };
      
      (supabase.auth.getSession as any).mockResolvedValue(mockSession);
      
      // Use the hook in a test component
      const TestComponent = () => {
        const { user, loading } = useAuth();
        return (
          <div>
            {loading ? 'Loading...' : user ? `User: ${user.email}` : 'No user'}
          </div>
        );
      };
      
      // Render
      render(<TestComponent />);
      
      // Assertions
      expect(supabase.auth.getSession).toHaveBeenCalled();
      await waitFor(() => {
        expect(screen.getByText('User: test@example.com')).toBeInTheDocument();
      });
    });

    test('should handle session errors properly', async () => {
      // Setup
      const mockError = {
        data: { session: null },
        error: new Error('Session error'),
      };
      
      (supabase.auth.getSession as any).mockResolvedValue(mockError);
      
      // Use the hook in a test component
      const TestComponent = () => {
        const { user, loading, error } = useAuth();
        return (
          <div>
            {loading 
              ? 'Loading...' 
              : error 
                ? `Error: ${error.message}` 
                : user 
                  ? `User: ${user.email}` 
                  : 'No user'}
          </div>
        );
      };
      
      // Render
      render(<TestComponent />);
      
      // Assertions
      await waitFor(() => {
        expect(screen.getByText('Error: Session error')).toBeInTheDocument();
      });
    });

    test('signIn should call supabase.auth.signInWithPassword with correct params', async () => {
      // Setup
      (supabase.auth.signInWithPassword as any).mockResolvedValue({ data: {}, error: null });
      
      // Use the hook in a test component
      const TestComponent = () => {
        const { signIn } = useAuth();
        return (
          <button onClick={() => signIn('test@example.com', 'password123')}>
            Sign In
          </button>
        );
      };
      
      // Render
      render(<TestComponent />);
      
      // Action
      fireEvent.click(screen.getByText('Sign In'));
      
      // Assertions
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    test('signUp should call supabase.auth.signUp with correct params', async () => {
      // Setup
      (supabase.auth.signUp as any).mockResolvedValue({ data: {}, error: null });
      
      // Use the hook in a test component
      const TestComponent = () => {
        const { signUp } = useAuth();
        return (
          <button onClick={() => signUp('test@example.com', 'password123')}>
            Sign Up
          </button>
        );
      };
      
      // Render
      render(<TestComponent />);
      
      // Action
      fireEvent.click(screen.getByText('Sign Up'));
      
      // Assertions
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: { 
            email_confirmed: true 
          }
        }
      });
    });

    test('signOut should call supabase.auth.signOut', async () => {
      // Setup
      (supabase.auth.signOut as any).mockResolvedValue({ error: null });
      
      // Use the hook in a test component
      const TestComponent = () => {
        const { signOut } = useAuth();
        return <button onClick={() => signOut()}>Sign Out</button>;
      };
      
      // Render
      render(<TestComponent />);
      
      // Action
      fireEvent.click(screen.getByText('Sign Out'));
      
      // Assertions
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });

  describe('AuthGuard Component', () => {
    test('should show loading state initially', () => {
      // Setup
      vi.mock('@/hooks/useAuth', () => ({
        useAuth: () => ({
          user: null,
          loading: true
        })
      }));
      
      // Render
      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );
      
      // Assertion
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    test('should redirect to login when not authenticated', async () => {
      // Setup
      const mockReplace = vi.fn();
      vi.mock('next/navigation', () => ({
        useRouter: () => ({
          push: vi.fn(),
          replace: mockReplace,
        }),
        usePathname: () => '/protected',
      }));
      
      vi.mock('@/hooks/useAuth', () => ({
        useAuth: () => ({
          user: null,
          loading: false
        })
      }));
      
      // Render
      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );
      
      // Assertion
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });

    test('should render children when authenticated', async () => {
      // Setup
      vi.mock('@/hooks/useAuth', () => ({
        useAuth: () => ({
          user: { id: 'user-id', email: 'test@example.com' },
          loading: false
        })
      }));
      
      // Render
      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );
      
      // Assertion
      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });
  });

  describe('Login Page', () => {
    test('should handle form submission correctly', async () => {
      // Setup
      const mockSignIn = vi.fn().mockResolvedValue({});
      
      vi.mock('@/hooks/useAuth', () => ({
        useAuth: () => ({
          user: null,
          loading: false,
          error: null,
          signIn: mockSignIn
        })
      }));
      
      // Render
      render(<LoginPage />);
      
      // Fill form
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' }
      });
      
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' }
      });
      
      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      
      // Assertions
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });
    
    test('should display error messages', async () => {
      // Setup
      vi.mock('@/hooks/useAuth', () => ({
        useAuth: () => ({
          user: null,
          loading: false,
          error: new Error('Invalid login credentials'),
          signIn: vi.fn()
        })
      }));
      
      // Render
      render(<LoginPage />);
      
      // Assertion
      expect(screen.getByText('Invalid login credentials')).toBeInTheDocument();
    });
  });

  describe('Signup Page', () => {
    test('should validate passwords match', async () => {
      // Setup
      const mockSignUp = vi.fn();
      
      vi.mock('@/hooks/useAuth', () => ({
        useAuth: () => ({
          user: null,
          loading: false,
          error: null,
          signUp: mockSignUp
        })
      }));
      
      // Render
      render(<SignupPage />);
      
      // Fill form with mismatched passwords
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' }
      });
      
      fireEvent.change(screen.getByLabelText(/^password$/i), {
        target: { value: 'password123' }
      });
      
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'different-password' }
      });
      
      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
      
      // Assertions
      expect(mockSignUp).not.toHaveBeenCalled();
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
    
    test('should call signUp with correct parameters when passwords match', async () => {
      // Setup
      const mockSignUp = vi.fn().mockResolvedValue({});
      
      vi.mock('@/hooks/useAuth', () => ({
        useAuth: () => ({
          user: null,
          loading: false,
          error: null,
          signUp: mockSignUp
        })
      }));
      
      // Render
      render(<SignupPage />);
      
      // Fill form with matching passwords
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' }
      });
      
      fireEvent.change(screen.getByLabelText(/^password$/i), {
        target: { value: 'password123' }
      });
      
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'password123' }
      });
      
      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
      
      // Assertions
      expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });
});

// Create a test to specifically debug potential auth issues
describe('Authentication Debug Tests', () => {
  test('check for Supabase client initialization issues', () => {
    // Verify Supabase URL and key are provided
    expect(supabase).toBeDefined();
    
    // Check auth configuration
    const authConfig = (supabase as any).auth.config;
    expect(authConfig).toBeDefined();
    expect(authConfig.storageKey).toBe('caloriecounter-auth');
    expect(authConfig.autoRefreshToken).toBe(true);
    expect(authConfig.persistSession).toBe(true);
    expect(authConfig.detectSessionInUrl).toBe(true);
  });

  test('debug auth state change listener', async () => {
    // Mock an auth state change event
    const mockListener = vi.fn();
    const mockEvent = 'SIGNED_IN';
    const mockSession = { user: { id: 'test-user-id', email: 'test@example.com' } };
    
    // Setup the mock to call our listener with the event and session
    (supabase.auth.onAuthStateChange as any).mockImplementation((callback) => {
      // Store the callback to call later
      mockListener.mockImplementation(() => callback(mockEvent, mockSession));
      return {
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      };
    });
    
    // Use the hook in a test component
    const TestComponent = () => {
      const { user } = useAuth();
      return <div>{user ? `User: ${user.email}` : 'No user'}</div>;
    };
    
    // Initial state - before auth state change
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
      error: null,
    });
    
    // Render
    render(<TestComponent />);
    
    // Verify initial state
    await waitFor(() => {
      expect(screen.getByText('No user')).toBeInTheDocument();
    });
    
    // Simulate auth state change event
    mockListener();
    
    // Verify state updated correctly
    await waitFor(() => {
      expect(screen.getByText('User: test@example.com')).toBeInTheDocument();
    });
  });

  test('check for session persistence issues', async () => {
    // Setup localStorage mock
    const localStorageMock = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value.toString(); },
        clear: () => { store = {}; }
      };
    })();
    
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock
    });
    
    // Mock Supabase to simulate storing session in localStorage
    (supabase.auth.signInWithPassword as any).mockImplementation(({ email, password }) => {
      // Simulate a successful login that stores session data
      const mockSession = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        user: { id: 'test-user-id', email }
      };
      
      // Store serialized session in localStorage
      window.localStorage.setItem('caloriecounter-auth', JSON.stringify({ 
        currentSession: mockSession
      }));
      
      return { data: { session: mockSession }, error: null };
    });
    
    // Mock getSession to use localStorage
    (supabase.auth.getSession as any).mockImplementation(() => {
      // Get session from localStorage
      const stored = window.localStorage.getItem('caloriecounter-auth');
      const session = stored ? JSON.parse(stored).currentSession : null;
      
      return { data: { session }, error: null };
    });
    
    // Test component
    function TestAuthFlow() {
      const { user, signIn } = useAuth();
      
      return (
        <div>
          {user ? (
            <div>Logged in as: {user.email}</div>
          ) : (
            <button onClick={() => signIn('test@example.com', 'password')}>
              Login
            </button>
          )}
        </div>
      );
    }
    
    // Render
    render(<TestAuthFlow />);
    
    // Click login
    fireEvent.click(screen.getByText('Login'));
    
    // Verify logged in state
    await waitFor(() => {
      expect(screen.getByText('Logged in as: test@example.com')).toBeInTheDocument();
    });
    
    // Verify session was stored correctly
    const storedSession = window.localStorage.getItem('caloriecounter-auth');
    expect(storedSession).toBeDefined();
    expect(JSON.parse(storedSession!).currentSession.user.email).toBe('test@example.com');
  });
});