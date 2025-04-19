import { supabase } from '@/lib/supabase-client';
import { createClient } from '@supabase/supabase-js';

// Mock the createClient function from @supabase/supabase-js
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
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
  }))
}));

describe('Supabase Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset any environment variables that might be set
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  test('should initialize with environment variables when available', () => {
    // Set environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://custom-project.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'custom-key';
    
    // Force re-import of supabase client
    jest.resetModules();
    require('@/lib/supabase-client');
    
    expect(createClient).toHaveBeenCalledWith(
      'https://custom-project.supabase.co',
      'custom-key',
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

  test('should fall back to default values when environment variables are not set', () => {
    // Force re-import of supabase client
    jest.resetModules();
    require('@/lib/supabase-client');
    
    expect(createClient).toHaveBeenCalledWith(
      'https://ptqcwosjurqqxoodjolt.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cWN3b3NqdXJxcXhvb2Rqb2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5NzU3NDUsImV4cCI6MjA2MDU1MTc0NX0.t6Tf8tDLK-zVkslWqXzCEsrbQqxoO6mesaYhlIqEELo',
      expect.any(Object)
    );
  });

  test('should configure auth with correct options', () => {
    expect(createClient).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: 'caloriecounter-auth'
        }
      }
    );
  });

  test('should export the supabase client with the auth property', () => {
    expect(supabase).toBeDefined();
    expect(supabase.auth).toBeDefined();
    expect(typeof supabase.auth.getSession).toBe('function');
    expect(typeof supabase.auth.signUp).toBe('function');
    expect(typeof supabase.auth.signInWithPassword).toBe('function');
    expect(typeof supabase.auth.signOut).toBe('function');
  });
});