'use client';

import { create } from 'zustand';
// DO NOT directly import hooks at the top level to avoid circular dependencies
// Hooks will be dynamically imported when needed

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

// Create a Zustand store with the default state that wraps Supabase operations
export const useAppStore = create((set, get) => {
  let _meals = [];
  let _dailyTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  let _userData = null;
  let _weightEntries = [];
  let _initialized = false;
  
  // Helper function to convert Supabase meal to app store meal format
  const formatMeal = (meal: any): Meal => ({
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
      console.log('Verifying database tables...');
      
      // Check if tables exist
      const tablesResponse = await supabase.from('users').select('id').limit(1);
      const mealsResponse = await supabase.from('meals').select('id').limit(1);
      const weightResponse = await supabase.from('weight_entries').select('id').limit(1);
      
      const hasTableIssues = tablesResponse.error || mealsResponse.error || weightResponse.error;
      
      if (hasTableIssues) {
        console.error('Database tables might not be set up correctly. Check supabase_setup.sql');
        console.error('Table check errors:', {
          users: tablesResponse.error,
          meals: mealsResponse.error,
          weight_entries: weightResponse.error
        });
        return false;
      }
      
      console.log('Database tables verified successfully');
      return true;
    } catch (err) {
      console.error('Error verifying database tables:', err);
      return false;
    }
  };

  // Function to load all data from Supabase
  const loadAllData = async () => {
    if (typeof window === 'undefined') return; // Skip on server

    try {
      console.log('Loading all data from Supabase...');
      
      // Use direct Supabase queries instead of hooks to avoid circular dependencies
      const { supabase } = await import('@/lib/supabase-client');
      
      // Get auth session directly
      const { data: { session } } = await supabase.auth.getSession();
      const authUser = session?.user;
      
      if (!authUser) {
        console.log('User not authenticated, using default state');
        return;
      }
      
      // Verify database setup
      const isDbReady = await verifyDatabaseSetup();
      if (!isDbReady) {
        console.warn('Database setup verification failed, will try to continue anyway');
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
      const today = new Date();
      const { isToday } = await import('@/lib/utils');
      
      const meals = mealsResponse.data || [];
      // Ensure proper date conversion and add debug logging
      const todayMeals = meals.filter(meal => {
        const mealDate = new Date(meal.created_at);
        console.log(`Store filtering: meal ${meal.meal_name}, date: ${mealDate.toISOString()}, isToday: ${isToday(mealDate)}`);
        return isToday(mealDate);
      });
      
      // Calculate daily totals
      const dailyTotals = todayMeals.reduce((acc, meal) => ({
        calories: acc.calories + meal.calories,
        protein: acc.protein + meal.protein,
        carbs: acc.carbs + meal.carbs,
        fat: acc.fat + meal.fat,
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
      
      // Format data
      _meals = meals.map(formatMeal);
      _dailyTotals = dailyTotals;
      _userData = userResponse.data;
      _weightEntries = weightResponse.data || [];
      
      console.log('Data loaded successfully:', { 
        meals: _meals.length, 
        userData: _userData ? 'found' : 'not found',
        weightEntries: _weightEntries.length 
      });
      
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
            gender: _userData?.gender,
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
      
      _initialized = true;
    } catch (err) {
      console.error('Failed to load data from Supabase:', err);
    }
  };

  // Initial data load
  if (typeof window !== 'undefined') {
    // Delay initial load to ensure all React components are mounted
    setTimeout(() => {
      loadAllData();
    }, 100);
  }

  return {
    ...defaultState,
    
    // Method to fetch all data from Supabase and update the store
    refreshAll: async () => {
      // Try to import queryClient and invalidate relevant queries first
      try {
        // Dynamically import queryClient
        const { default: queryClient } = await import('@/providers/QueryProvider').then(module => ({
          default: module.queryClient
        })).catch(() => ({ default: null }));
        
        if (queryClient) {
          console.log('Invalidating React Query caches...');
          queryClient.invalidateQueries({ queryKey: ['meals'] });
          queryClient.invalidateQueries({ queryKey: ['user'] });
          queryClient.invalidateQueries({ queryKey: ['weight'] });
        } else {
          console.log('Query client not available, falling back to direct data load');
        }
      } catch (err) {
        console.error('Error invalidating queries:', err);
      }
      
      // Always load data directly as fallback
      await loadAllData();
    },
    
    // Override methods to call Supabase operations
    addMeal: async (mealData) => {
      try {
        // Use direct Supabase query to avoid hook issues
        const { supabase } = await import('@/lib/supabase-client');
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
        
        // Try to invalidate React Query cache
        try {
          const { queryClient } = await import('@/providers/QueryProvider');
          if (queryClient) {
            console.log('Invalidating meals queries...');
            queryClient.invalidateQueries({ queryKey: ['meals'] });
            queryClient.fetchQuery({ queryKey: ['meals', authUser.id] })
              .catch(err => console.error('Error fetching meals after invalidation:', err));
          }
        } catch (invalidateErr) {
          console.error('Error invalidating queries:', invalidateErr);
        }
        
        // Refresh app state data
        await loadAllData();
        
        return formatMeal(data);
      } catch (err) {
        console.error('Failed to add meal to Supabase:', err);
        throw err;
      }
    },
    
    updateMeal: async (id, updates) => {
      try {
        // Import dynamically to avoid SSR issues
        const { useMeals } = await import('@/hooks/useMeals');
        const mealsHook = useMeals();
        
        // Convert from app format to Supabase format
        const supabaseUpdates = {};
        if ('mealName' in updates) {
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
        
        await mealsHook.updateMeal(id, supabaseUpdates);
        
        // Refresh all data to update the UI
        await loadAllData();
        
      } catch (err) {
        console.error('Failed to update meal in Supabase:', err);
      }
    },
    
    deleteMeal: async (id) => {
      try {
        // Import dynamically to avoid SSR issues
        const { useMeals } = await import('@/hooks/useMeals');
        const mealsHook = useMeals();
        
        await mealsHook.deleteMeal(id);
        
        // Refresh all data to update the UI
        await loadAllData();
        
      } catch (err) {
        console.error('Failed to delete meal from Supabase:', err);
      }
    },
    
    updateNutritionGoals: async (goals) => {
      try {
        // Import dynamically to avoid SSR issues
        const { useUser } = await import('@/hooks/useUser');
        const userHook = useUser();
        
        // Convert from app format to Supabase format
        const updates = {};
        if ('calories' in goals) updates.target_calories = goals.calories;
        if ('protein' in goals) updates.target_protein = goals.protein;
        if ('carbs' in goals) updates.target_carbs = goals.carbs;
        if ('fat' in goals) updates.target_fat = goals.fat;
        
        await userHook.updateUserProfile(updates);
        
        // Refresh all data to update the UI
        await loadAllData();
        
      } catch (err) {
        console.error('Failed to update nutrition goals in Supabase:', err);
      }
    },
    
    updateUserProfile: async (profile) => {
      try {
        // Import dynamically to avoid SSR issues
        const { useUser } = await import('@/hooks/useUser');
        const userHook = useUser();
        
        await userHook.updateUserProfile(profile);
        
        // Refresh all data to update the UI
        await loadAllData();
        
      } catch (err) {
        console.error('Failed to update user profile in Supabase:', err);
      }
    },
    
    addWeightEntry: async (weight) => {
      try {
        // Import dynamically to avoid SSR issues
        const { useWeightHistory } = await import('@/hooks/useWeightHistory');
        const { useUser } = await import('@/hooks/useUser');
        
        const weightHook = useWeightHistory();
        const userHook = useUser();
        
        await weightHook.addWeightEntry(weight);
        
        // Also update the current weight in the user profile
        await userHook.updateUserProfile({ weight });
        
        // Refresh all data to update the UI
        await loadAllData();
        
      } catch (err) {
        console.error('Failed to add weight entry to Supabase:', err);
      }
    },
    
    deleteWeightEntry: async (date) => {
      try {
        // Import dynamically to avoid SSR issues
        const { useWeightHistory } = await import('@/hooks/useWeightHistory');
        const weightHook = useWeightHistory();
        
        // Find the entry with this date
        const entry = _weightEntries.find(e => 
          new Date(e.created_at).toISOString().split('T')[0] === date
        ) || _weightEntries.find(e => 
          new Date(e.created_at).toDateString() === new Date(date).toDateString()
        );
        
        if (entry) {
          await weightHook.deleteWeightEntry(entry.id);
          
          // Refresh all data to update the UI
          await loadAllData();
        }
      } catch (err) {
        console.error('Failed to delete weight entry from Supabase:', err);
      }
    },
    
    // No-op function for compatibility
    toggleDarkMode: () => {
      console.log('Dark mode toggle is now handled by the theme provider');
    },
    
    // No-op function for compatibility
    checkAndResetDaily: () => {
      // No longer needed as daily totals are calculated from today's meals
    },
  };
});