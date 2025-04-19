import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase-client';
import { createClient } from '@supabase/supabase-js';

// Mock the createClient function from supabase-js
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
      resetPasswordForEmail: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    })),
  })),
}));

describe('Supabase Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with correct URL and key', () => {
    // Access the mocked createClient function
    const mockCreateClient = createClient as unknown as ReturnType<typeof vi.fn>;
    
    // Re-import the supabase client to trigger initialization
    jest.isolateModules(() => {
      require('@/lib/supabase-client');
    });
    
    // Check that createClient was called with the expected arguments
    expect(mockCreateClient).toHaveBeenCalledWith(
      expect.stringMatching(/^https:\/\/.+$/), // URL should be a valid HTTPS URL
      expect.stringMatching(/^eyJ.+$/), // Key should be a JWT-formatted token
      expect.objectContaining({
        auth: expect.objectContaining({
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: 'caloriecounter-auth'
        })
      })
    );
  });

  it('should fallback to default URL and key if env variables are not set', () => {
    // Save original env
    const originalEnv = { ...process.env };
    
    // Remove env variables
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // Clear mocks to ensure we track the new call
    vi.clearAllMocks();
    
    // Access the mocked createClient function
    const mockCreateClient = createClient as unknown as ReturnType<typeof vi.fn>;
    
    // Re-import the supabase client to trigger initialization with fallback values
    jest.isolateModules(() => {
      require('@/lib/supabase-client');
    });
    
    // Check that createClient was called with the fallback arguments
    expect(mockCreateClient).toHaveBeenCalledWith(
      'https://ptqcwosjurqqxoodjolt.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cWN3b3NqdXJxcXhvb2Rqb2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5NzU3NDUsImV4cCI6MjA2MDU1MTc0NX0.t6Tf8tDLK-zVkslWqXzCEsrbQqxoO6mesaYhlIqEELo',
      expect.any(Object)
    );
    
    // Restore original env
    process.env = originalEnv;
  });

  it('should use custom URL and key from env variables when available', () => {
    // Save original env
    const originalEnv = { ...process.env };
    
    // Set custom env variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://custom-project.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'custom-key-123';
    
    // Clear mocks to ensure we track the new call
    vi.clearAllMocks();
    
    // Access the mocked createClient function
    const mockCreateClient = createClient as unknown as ReturnType<typeof vi.fn>;
    
    // Re-import the supabase client to trigger initialization with custom values
    jest.isolateModules(() => {
      require('@/lib/supabase-client');
    });
    
    // Check that createClient was called with the custom arguments
    expect(mockCreateClient).toHaveBeenCalledWith(
      'https://custom-project.supabase.co',
      'custom-key-123',
      expect.any(Object)
    );
    
    // Restore original env
    process.env = originalEnv;
  });

  it('should configure correct auth settings', () => {
    // Access the mocked createClient function
    const mockCreateClient = createClient as unknown as ReturnType<typeof vi.fn>;
    
    // Re-import the supabase client to trigger initialization
    jest.isolateModules(() => {
      require('@/lib/supabase-client');
    });
    
    // Check auth configuration
    expect(mockCreateClient).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        auth: expect.objectContaining({
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: 'caloriecounter-auth'
        })
      })
    );
  });
});