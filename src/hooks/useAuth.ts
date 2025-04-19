'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface UseAuthReturn {
  user: SupabaseUser | null;
  loading: boolean;
  error: Error | null;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (session?.user) {
          setUser(session.user);
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const signUp = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Use emailConfirm=false to disable confirmation
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined,
          data: { 
            email_confirmed: true 
          },
          // Disable email confirmation explicitly
          emailConfirm: false
        }
      });
      
      if (error) {
        throw error;
      }
      
      if (data?.user?.identities?.length === 0) {
        throw new Error('This email is already registered. Please log in instead.');
      }
      
      console.log('Sign up successful, user:', data?.user);
      
      // Auto-sign in after signup - force it
      try {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (signInError) {
          console.warn('Auto sign-in failed:', signInError);
        } else {
          console.log('Auto sign-in successful, user:', signInData?.user);
        }
      } catch (signInErr) {
        console.error('Error in auto sign-in:', signInErr);
      }
      
      router.push('/');
    } catch (err) {
      console.error('Error signing up:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [router]);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        throw error;
      }
      
      console.log('Sign in successful, user:', data?.user);
      router.push('/');
      return data;
    } catch (err) {
      console.error('Error signing in:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [router]);

  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      router.push('/login');
    } catch (err) {
      console.error('Error signing out:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [router]);

  const resetPassword = useCallback(async (email: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) {
        throw error;
      }
      
      setError(new Error('Password reset functionality has been disabled in this version.'));
    } catch (err) {
      console.error('Error resetting password:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [router]);

  return {
    user,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };
}