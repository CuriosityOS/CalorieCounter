/**
 * This file provides utility functions to debug Supabase authentication issues.
 * You can import and use these functions in your browser console or tests.
 */

import { supabase } from '@/lib/supabase-client';

/**
 * Checks the current authentication status and returns detailed information
 */
export async function checkAuthStatus() {
  try {
    // Get the current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    // Check if cookies are being used for session storage
    const cookiesEnabled = navigator.cookieEnabled;
    const hasLocalStorage = typeof localStorage !== 'undefined';
    
    // Check browser storage for auth data
    let storageData = null;
    if (hasLocalStorage) {
      try {
        const storageKey = 'caloriecounter-auth';
        storageData = localStorage.getItem(storageKey);
      } catch (e) {
        console.error('Error accessing localStorage:', e);
      }
    }

    return {
      sessionFromApi: {
        exists: !!sessionData?.session,
        user: sessionData?.session?.user || null,
        expiresAt: sessionData?.session?.expires_at || null,
        error: sessionError ? sessionError.message : null,
      },
      browserEnvironment: {
        cookiesEnabled,
        hasLocalStorage,
        storageData: storageData ? JSON.parse(storageData) : null,
      },
    };
  } catch (err) {
    console.error('Error in checkAuthStatus:', err);
    return {
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Tests the signup process without actually creating a user
 * Helps identify issues with the signup flow
 */
export async function testSignupFlow(email: string, password: string) {
  try {
    // Don't actually create the user, just log what would happen
    console.log('Testing signup flow with:', { email });
    
    // Trace the auth config
    const authConfig = {
      persistSession: supabase.auth.api?.persistSession,
      autoRefreshToken: supabase.auth.api?.autoRefreshToken,
      storageKey: 'caloriecounter-auth', // This should match your config
    };
    
    return {
      flowStatus: 'Would attempt signup',
      authConfig,
    };
  } catch (err) {
    console.error('Error in testSignupFlow:', err);
    return {
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Tests the connection to Supabase
 */
export async function testSupabaseConnection() {
  try {
    const startTime = Date.now();
    
    // Simple ping test by fetching a timestamp from Supabase
    const { data, error } = await supabase.rpc('get_timestamp');
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    return {
      connectionStatus: error ? 'Failed' : 'Success',
      responseTimeMs: responseTime,
      serverTime: data,
      error: error ? error.message : null,
    };
  } catch (err) {
    console.error('Error in testSupabaseConnection:', err);
    return {
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Call this function in your browser console to get a full debug report
 */
export async function printAuthDebugInfo() {
  console.group('🔍 Supabase Auth Debug Info');
  
  console.log('Auth Status:', await checkAuthStatus());
  console.log('Connection Test:', await testSupabaseConnection());
  
  // Check for common configuration issues
  console.log('Using URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'Fallback URL');
  
  console.groupEnd();
}

// Run this in your browser console:
// import { printAuthDebugInfo } from '@/tests/supabase-auth-debug';
// printAuthDebugInfo().then(console.log);