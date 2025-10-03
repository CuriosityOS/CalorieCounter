'use client';

import { useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase-client';
import type { Meal } from '@/lib/supabase-client';
import { useAuth } from './useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface UseMealsOptions {
  skip?: boolean;
}

const getDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function useMeals(selectedDate?: Date, options?: UseMealsOptions) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const skip = options?.skip ?? false;
  const userId = user?.id;
  const selectedDateTime = selectedDate?.getTime();

  const dateInfo = useMemo(() => {
    const base = selectedDateTime ? new Date(selectedDateTime) : new Date();
    const start = new Date(base);
    start.setHours(0, 0, 0, 0);

    const end = new Date(base);
    end.setHours(23, 59, 59, 999);

    return {
      start,
      end,
      key: getDateKey(start),
    };
  }, [selectedDateTime]);

  const fetchMeals = useCallback(async () => {
    if (!userId) {
      return [] as Meal[];
    }

    const { data, error } = await supabase
      .from('meals')
      .select('id, user_id, meal_name, ingredients, calories, protein, carbs, fat, created_at, image_url')
      .eq('user_id', userId)
      .gte('created_at', dateInfo.start.toISOString())
      .lte('created_at', dateInfo.end.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []) as Meal[];
  }, [userId, dateInfo]);

  const {
    data: mealsForDay = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['meals', userId, dateInfo.key],
    queryFn: fetchMeals,
    enabled: !!userId && !skip,
    staleTime: 60000,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  const dailyTotals = useMemo(() => {
    return mealsForDay.reduce(
      (acc, meal) => ({
        calories: acc.calories + (meal.calories || 0),
        protein: acc.protein + (meal.protein || 0),
        carbs: acc.carbs + (meal.carbs || 0),
        fat: acc.fat + (meal.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }, [mealsForDay]);

  const addMeal = useCallback(async (mealData: Omit<Meal, 'id' | 'user_id' | 'created_at'>) => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      const newMeal = {
        ...mealData,
        user_id: userId,
      };

      const { data, error } = await supabase
        .from('meals')
        .insert([newMeal])
        .select()
        .single();

      if (error) {
        throw error;
      }

      queryClient.invalidateQueries({ queryKey: ['meals', userId] });

      return data as Meal;
    } catch (err) {
      throw err;
    }
  }, [userId, queryClient]);

  const updateMeal = useCallback(async (mealId: string, updates: Partial<Meal>) => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error } = await supabase
        .from('meals')
        .update(updates)
        .eq('id', mealId)
        .eq('user_id', userId) // Ensure the meal belongs to this user
        .select()
        .single();

      if (error) {
        throw error;
      }

      queryClient.invalidateQueries({ queryKey: ['meals', userId] });

      return data as Meal;
    } catch (err) {
      throw err;
    }
  }, [userId, queryClient]);

  const deleteMeal = useCallback(async (mealId: string) => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      const { error } = await supabase
        .from('meals')
        .delete()
        .eq('id', mealId)
        .eq('user_id', userId); // Ensure the meal belongs to this user

      if (error) {
        throw error;
      }

      queryClient.invalidateQueries({ queryKey: ['meals', userId] });
    } catch (err) {
      throw err;
    }
  }, [userId, queryClient]);

  return {
    todayMeals: mealsForDay,
    dailyTotals,
    loading: !!userId && !skip ? isLoading : false,
    error,
    addMeal,
    updateMeal,
    deleteMeal,
    refreshMeals: refetch,
  };
}