import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://caloriecounter.lol';

// Check for required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Authentication will not work properly.');
}

// Create client with debug logging
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // Disable URL detection to prevent redirection issues
    storageKey: 'caloriecounter-auth',
    flowType: 'pkce', // Use PKCE flow for better security
    // Set debug to true in non-production environment
    debug: process.env.NODE_ENV !== 'production'
  }
});

// Log client initialization for debugging
if (process.env.NODE_ENV !== 'production') {
  console.log('Supabase client initialized with URL:', supabaseUrl ? 'URL provided' : 'URL missing');
}

export type Tables = {
  users: {
    id: string;
    email: string;
    created_at: string;
    username?: string;
    weight?: number;
    height?: number;
    age?: number;
    gender?: 'male' | 'female';
    activity_level?: number;
    goal_offset?: number;
    target_calories?: number;
    target_protein?: number;
    target_carbs?: number;
    target_fat?: number;
  };
  meals: {
    id: string;
    user_id: string;
    meal_name: string;
    ingredients?: string[];
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    created_at: string;
    image_url?: string;
  };
  weight_entries: {
    id: string;
    user_id: string;
    weight: number;
    created_at: string;
  };
};

export type User = Tables['users'];
export type Meal = Tables['meals'];
export type WeightEntry = Tables['weight_entries'];