'use client';

import { create } from 'zustand';
import { supabase } from '@/lib/supabase-client';

// Fallback state to use when hooks are not available (during SSR or in components that call the store outside React components)
const defaultState = {
  meals: [],
  dailyNutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
  userPreferences: {
    darkMode: false,
    nutritionGoals: {
      calories: 2000,
      protein: 150,
      carbs: 200,
      fat: 65,
    },
    profile: {},
    weightHistory: [],
    lastDailyReset: new Date().toISOString().split('T')[0],
  },
  addMeal: () => {},
  updateMeal: () => {},
  deleteMeal: () => {},
  toggleDarkMode: () => {},
  updateNutritionGoals: () => {},
  updateUserProfile: () => {},
  addWeightEntry: () => {},
  deleteWeightEntry: () => {},
  checkAndResetDaily: () => {},
};

/**
 * The app store is now just a wrapper around the Supabase hooks.
 * All data is stored in Supabase, not in local storage.
 * This file exists to maintain compatibility with existing code that uses the app store.
 */

export interface Meal {
  id: string;
  mealName: string | string[];
  ingredients?: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  timestamp: number;
  imageUrl?: string;
}

// Additional type definitions for the store state
interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface UserProfileData {
  weight?: number;
  height?: number;
  age?: number;
  gender?: "male" | "female" | undefined; // Adjusted gender type
  activityLevel?: number;
  goalOffset?: number;
}

interface WeightHistoryEntry {
  date: string;
  weight: number;
}

interface UserPreferencesData {
  darkMode: boolean;
  nutritionGoals: NutritionData;
  profile: UserProfileData;
  weightHistory: WeightHistoryEntry[];
  lastDailyReset: string;
}

// Type for new meal data passed to addMeal
type NewMealData = Omit<Meal, 'id' | 'timestamp'>;

// Type for updates to a meal
type MealUpdates = Partial<Omit<Meal, 'id' | 'timestamp'>>;

export interface AppState {
  meals: Meal[];
  dailyNutrition: NutritionData;
  userPreferences: UserPreferencesData;

  refreshAll: () => Promise<void>;
  addMeal: (mealData: NewMealData) => Promise<Meal | void>;
  updateMeal: (id: string, updates: MealUpdates) => Promise<void>;
  deleteMeal: (id: string) => Promise<void>;
  updateNutritionGoals: (goals: Partial<NutritionData>) => Promise<void>;
  updateUserProfile: (profile: Partial<UserProfileData>) => Promise<void>;
  addWeightEntry: (weight: number) => Promise<void>;
  deleteWeightEntry: (date: string) => Promise<void>;
  toggleDarkMode: () => void;
  checkAndResetDaily: () => void;
}

// Create a Zustand store with the default state that wraps Supabase operations
export const useAppStore = create<AppState>((set) => {
  let _meals: Meal[] = []; // Add type
  let _dailyTotals: NutritionData = { calories: 0, protein: 0, carbs: 0, fat: 0 }; // Add type
  let _userData: {
    id?: string;
    weight?: number;
    height?: number;
    age?: number;
    gender?: string;
    activity_level?: number;
    goal_offset?: number;
    target_calories?: number;
    target_protein?: number;
    target_carbs?: number;
    target_fat?: number;
  } | null = null; // Add type for _userData
  let _weightEntries: Array<{
    id: string;
    weight: number;
    created_at: string;
  }> = [];
  
  // Helper function to convert Supabase meal to app store meal format
  const formatMeal = (meal: {
    id: string;
    meal_name: string;
    ingredients?: string[];
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    created_at: string;
    image_url?: string;
  }): Meal => ({
    id: meal.id,
    mealName: meal.meal_name || 'Unknown Meal',
    ingredients: meal.ingredients || [],
    calories: meal.calories || 0,
    protein: meal.protein || 0,
    carbs: meal.carbs || 0,
    fat: meal.fat || 0,
    timestamp: new Date(meal.created_at).getTime(),
    imageUrl: meal.image_url || undefined,
  });

  // Function to verify database tables exist
  const verifyDatabaseSetup = async () => {
    try {
      const { supabase } = await import('@/lib/supabase-client');

      // Check if tables exist
      const tablesResponse = await supabase.from('users').select('id').limit(1);
      const mealsResponse = await supabase.from('meals').select('id').limit(1);
      const weightResponse = await supabase.from('weight_entries').select('id').limit(1);

      const hasTableIssues = tablesResponse.error || mealsResponse.error || weightResponse.error;

      if (hasTableIssues) {
        return false;
      }

      return true;
    } catch (err) {
      return false;
    }
  };

  // Function to load all data from Supabase
  const loadAllData = async () => {
    if (typeof window === 'undefined') return; // Skip on server

    try {
      // Use direct Supabase queries instead of hooks to avoid circular dependencies
      const { supabase } = await import('@/lib/supabase-client');

      // Get auth session directly
      const { data: { session } } = await supabase.auth.getSession();
      const authUser = session?.user;

      if (!authUser) {
        return;
      }

      // Verify database setup
      const isDbReady = await verifyDatabaseSetup();
      if (!isDbReady) {
        // Database setup verification failed, will try to continue anyway
      }
      
      // Load data directly from Supabase, not via hooks
      const [mealsResponse, userResponse, weightResponse] = await Promise.all([
        supabase
          .from('meals')
          .select('*')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single(),
        supabase
          .from('weight_entries')
          .select('*')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false })
      ]);
      
      // Filter for today's meals to calculate daily totals
      const meals = mealsResponse.data || [];
      // Ensure proper date conversion
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);
      
      const todayMeals = meals.filter(meal => {
        const mealDate = new Date(meal.created_at);
        return mealDate >= startOfDay && mealDate <= endOfDay;
      });
      
      // Calculate daily totals
      const dailyTotals = todayMeals.reduce((acc, meal) => ({
        calories: acc.calories + (meal.calories || 0),
        protein: acc.protein + (meal.protein || 0),
        carbs: acc.carbs + (meal.carbs || 0),
        fat: acc.fat + (meal.fat || 0),
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
      
      // Format data
      _meals = meals.map(formatMeal);
      _dailyTotals = dailyTotals;
      _userData = userResponse.data;
      _weightEntries = weightResponse.data || [];

      // Update Zustand store state
      set({
        meals: _meals,
        dailyNutrition: _dailyTotals,
        userPreferences: {
          darkMode: false,
          nutritionGoals: {
            calories: _userData?.target_calories || 2000,
            protein: _userData?.target_protein || 150,
            carbs: _userData?.target_carbs || 200,
            fat: _userData?.target_fat || 65,
          },
          profile: {
            weight: _userData?.weight,
            height: _userData?.height,
            age: _userData?.age,
            gender: _userData?.gender as 'male' | 'female' | undefined,
            activityLevel: _userData?.activity_level,
            goalOffset: _userData?.goal_offset,
          },
          weightHistory: _weightEntries?.map(entry => ({
            date: new Date(entry.created_at).toISOString().split('T')[0],
            weight: entry.weight,
          })) || [],
          lastDailyReset: new Date().toISOString().split('T')[0],
        }
      });
    } catch (err) {
      // Failed to load data from Supabase
    }
  };

  // Initial data load - use requestIdleCallback for better performance
  if (typeof window !== 'undefined') {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        loadAllData();
      });
    } else {
      // Fallback for Safari
      Promise.resolve().then(() => {
        loadAllData();
      });
    }
  }

  return {
    ...defaultState,
    
    // Method to fetch all data from Supabase and update the store
    refreshAll: async () => {
      await loadAllData();
    },
    
    // Add meal directly to Supabase
    addMeal: async (mealData) => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const authUser = session?.user;
        
        if (!authUser) {
          throw new Error('User not authenticated');
        }
        
        // Convert from app format to Supabase format
        const supabaseMeal = {
          meal_name: Array.isArray(mealData.mealName) 
            ? mealData.mealName[0] 
            : mealData.mealName,
          ingredients: mealData.ingredients,
          calories: mealData.calories,
          protein: mealData.protein,
          carbs: mealData.carbs,
          fat: mealData.fat,
          image_url: mealData.imageUrl,
          user_id: authUser.id
        };
        
        const { data, error } = await supabase
          .from('meals')
          .insert([supabaseMeal])
          .select()
          .single();
          
        if (error) {
          throw error;
        }
        
        // Refresh app state data
        await loadAllData();

        return formatMeal(data);
      } catch (err) {
        throw err;
      }
    },
    
    updateMeal: async (id, updates) => {
      try {
        // Convert from app format to Supabase format
        const supabaseUpdates: Partial<{
          meal_name?: string;
          ingredients?: string[];
          calories?: number;
          protein?: number;
          carbs?: number;
          fat?: number;
          image_url?: string;
        }> = {};
        
        if ('mealName' in updates && updates.mealName !== undefined) {
          supabaseUpdates.meal_name = Array.isArray(updates.mealName)
            ? updates.mealName[0]
            : updates.mealName;
        }
        if ('ingredients' in updates) supabaseUpdates.ingredients = updates.ingredients;
        if ('calories' in updates) supabaseUpdates.calories = updates.calories;
        if ('protein' in updates) supabaseUpdates.protein = updates.protein;
        if ('carbs' in updates) supabaseUpdates.carbs = updates.carbs;
        if ('fat' in updates) supabaseUpdates.fat = updates.fat;
        if ('imageUrl' in updates) supabaseUpdates.image_url = updates.imageUrl;
        
        const { error } = await supabase
          .from('meals')
          .update(supabaseUpdates)
          .eq('id', id);
          
        if (error) {
          throw error;
        }
        
        // Refresh all data to update the UI
        await loadAllData();

      } catch (err) {
        throw err;
      }
    },
    
    deleteMeal: async (id) => {
      try {
        const { error } = await supabase
          .from('meals')
          .delete()
          .eq('id', id);
          
        if (error) {
          throw error;
        }
        
        // Refresh all data to update the UI
        await loadAllData();

      } catch (err) {
        throw err;
      }
    },
    
    updateNutritionGoals: async (goals) => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const authUser = session?.user;
        
        if (!authUser) {
          throw new Error('User not authenticated');
        }
        
        // Convert from app format to Supabase format
        const supabaseUserUpdates: Partial<{
          target_calories?: number;
          target_protein?: number;
          target_carbs?: number;
          target_fat?: number;
        }> = {};
        
        if ('calories' in goals) supabaseUserUpdates.target_calories = goals.calories;
        if ('protein' in goals) supabaseUserUpdates.target_protein = goals.protein;
        if ('carbs' in goals) supabaseUserUpdates.target_carbs = goals.carbs;
        if ('fat' in goals) supabaseUserUpdates.target_fat = goals.fat;
        
        const { error } = await supabase
          .from('users')
          .update(supabaseUserUpdates)
          .eq('id', authUser.id);
          
        if (error) {
          throw error;
        }
        
        // Refresh all data to update the UI
        await loadAllData();

      } catch (err) {
        throw err;
      }
    },
    
    updateUserProfile: async (profile) => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const authUser = session?.user;
        
        if (!authUser) {
          throw new Error('User not authenticated');
        }
        
        const { error } = await supabase
          .from('users')
          .update(profile)
          .eq('id', authUser.id);
          
        if (error) {
          throw error;
        }
        
        // Refresh all data to update the UI
        await loadAllData();

      } catch (err) {
        throw err;
      }
    },
    
    addWeightEntry: async (weight) => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const authUser = session?.user;
        
        if (!authUser) {
          throw new Error('User not authenticated');
        }
        
        // Add weight entry
        const { error: weightError } = await supabase
          .from('weight_entries')
          .insert([{ user_id: authUser.id, weight }]);
          
        if (weightError) {
          throw weightError;
        }
        
        // Also update the current weight in the user profile
        const { error: userError } = await supabase
          .from('users')
          .update({ weight })
          .eq('id', authUser.id);
          
        if (userError) {
          throw userError;
        }
        
        // Refresh all data to update the UI
        await loadAllData();
        
      } catch (err) {
        console.error('Failed to add weight entry to Supabase:', err);
        throw err;
      }
    },
    
    deleteWeightEntry: async (date) => {
      try {
        // Find the entry with this date
        const entry = _weightEntries.find(e => 
          new Date(e.created_at).toISOString().split('T')[0] === date
        ) || _weightEntries.find(e => 
          new Date(e.created_at).toDateString() === new Date(date).toDateString()
        );
        
        if (entry) {
          const { error } = await supabase
            .from('weight_entries')
            .delete()
            .eq('id', entry.id);
            
          if (error) {
            throw error;
          }
          
          // Refresh all data to update the UI
          await loadAllData();
        }
      } catch (err) {
        throw err;
      }
    },

    // No-op function for compatibility
    toggleDarkMode: () => {
      // Dark mode toggle is now handled by the theme provider
    },

    // Simple function to check and reset at midnight
    checkAndResetDaily: () => {
      if (typeof window === 'undefined') return;

      const today = new Date().toISOString().split('T')[0];
      const lastReset = window.localStorage.getItem('last-nutrition-reset') || '';

      if (today !== lastReset) {
        window.localStorage.setItem('last-nutrition-reset', today);
        // Don't use window.location.reload() since it's handled in the component
        loadAllData();
      }
    },
  };
});