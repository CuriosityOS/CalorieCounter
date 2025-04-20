'use client';

import { useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';
import type { Meal } from '@/lib/supabase-client';
import { useAuth } from './useAuth';
import { getStartOfDayGmt8, isToday } from '@/lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export function useMeals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Define query function
  const fetchMeals = useCallback(async () => {
    if (!user) {
      return {
        allMeals: [],
        todayMeals: []
      };
    }
    
    try {
      // Get the start of the current day
      getStartOfDayGmt8(); // For timezone calculation
      
      console.log('Fetching meals for user:', user.id);
      
      // Fetch all meals for this user
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error in Supabase query:', error);
        throw error;
      }
      
      if (data) {
        console.log(`Retrieved ${data.length} meals from Supabase`);
        const allMeals = data as Meal[];
        
        // Filter for today's meals using start and end of day timestamps
        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);
        
        const today = allMeals.filter(meal => {
          const mealDate = new Date(meal.created_at);
          const isInToday = mealDate >= startOfDay && mealDate <= endOfDay;
          console.log(`Checking meal: ${meal.meal_name}, date: ${mealDate.toISOString()}, isInToday: ${isInToday}`);
          return isInToday;
        });
        console.log(`Found ${today.length} meals for today`);
        
        return {
          allMeals,
          todayMeals: today
        };
      } else {
        console.log('No meals found for user');
        return {
          allMeals: [],
          todayMeals: []
        };
      }
    } catch (err) {
      console.error('Error fetching meals:', err);
      throw err;
    }
  }, [user]);
  
  // Create React Query for meals
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['meals', user?.id],
    queryFn: fetchMeals,
    enabled: !!user,
    staleTime: 30000, // 30 seconds
    refetchOnMount: true, // Always refetch on mount
    retry: 3, // Retry failed queries 3 times
  });
  
  // Extract meals from query data or use empty arrays as fallback
  const meals = data?.allMeals || [];
  const todayMeals = data?.todayMeals || [];

  const addMeal = useCallback(async (mealData: Omit<Meal, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    try {
      console.log('Adding meal to Supabase for user:', user.id);
      
      const newMeal = {
        ...mealData,
        user_id: user.id,
      };
      
      console.log('Meal data to insert:', newMeal);
      
      const { data, error } = await supabase
        .from('meals')
        .insert([newMeal])
        .select()
        .single();
        
      if (error) {
        console.error('Error inserting meal into Supabase:', error);
        throw error;
      }
      
      console.log('Meal added successfully, invalidating query cache');
      // Invalidate queries to trigger a refresh
      queryClient.invalidateQueries({ queryKey: ['meals'] });
      
      return data as Meal;
    } catch (err) {
      console.error('Error adding meal:', err);
      throw err;
    }
  }, [user, queryClient]);

  const updateMeal = useCallback(async (mealId: string, updates: Partial<Meal>) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    try {
      const { data, error } = await supabase
        .from('meals')
        .update(updates)
        .eq('id', mealId)
        .eq('user_id', user.id) // Ensure the meal belongs to this user
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      // Invalidate queries to trigger a refresh
      queryClient.invalidateQueries({ queryKey: ['meals'] });
      
      return data as Meal;
    } catch (err) {
      console.error('Error updating meal:', err);
      throw err;
    }
  }, [user, queryClient]);

  const deleteMeal = useCallback(async (mealId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    try {
      const { error } = await supabase
        .from('meals')
        .delete()
        .eq('id', mealId)
        .eq('user_id', user.id); // Ensure the meal belongs to this user
        
      if (error) {
        throw error;
      }
      
      // Invalidate queries to trigger a refresh
      queryClient.invalidateQueries({ queryKey: ['meals'] });
    } catch (err) {
      console.error('Error deleting meal:', err);
      throw err;
    }
  }, [user, queryClient]);

  // Calculate daily totals
  const dailyTotals = todayMeals.reduce((acc, meal) => {
    return {
      calories: acc.calories + (meal.calories || 0),
      protein: acc.protein + (meal.protein || 0),
      carbs: acc.carbs + (meal.carbs || 0),
      fat: acc.fat + (meal.fat || 0),
    };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  return {
    meals,
    todayMeals,
    dailyTotals,
    loading: isLoading,
    error,
    addMeal,
    updateMeal,
    deleteMeal,
    refreshMeals: refetch,
  };
}