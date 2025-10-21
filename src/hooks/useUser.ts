'use client';

import { useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase-client';
import type { User } from '@/lib/supabase-client';
import { calculateDailyCalories, calculateMacros } from '@/lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export function useUser() {
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();
  const userId = authUser?.id;

  const fetchUserProfile = useCallback(async (): Promise<User | null> => {
    if (!userId) {
      return null;
    }

    // Try to get user profile
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        // Record not found - this is expected for new users
        throw error;
      }
    }

    if (data) {
      return data as User;
    }

    // Create a new user profile if one doesn't exist
    const newUser: Partial<User> = {
      id: userId,
      email: authUser.email || '',
      // Default values
      weight: 70, // 70kg
      height: 170, // 170cm
      age: 30,
      gender: 'male',
      activity_level: 1.375, // Lightly active
      goal_offset: 0, // Maintenance
    };

    // Calculate default target calories and macros
    const targetCalories = calculateDailyCalories(
      newUser.weight!,
      newUser.height!,
      newUser.age!,
      newUser.gender!,
      newUser.activity_level!,
      newUser.goal_offset!
    );

    const { protein, carbs, fat } = calculateMacros(targetCalories);

    const userWithTargets = {
      ...newUser,
      target_calories: targetCalories,
      target_protein: protein,
      target_carbs: carbs,
      target_fat: fat,
    };

    // Use upsert instead of insert to avoid race conditions
    const { data: insertedUser, error: insertError } = await supabase
      .from('users')
      .upsert([userWithTargets], { onConflict: 'id' })
      .select()
      .single();

    if (insertError) {
      // If still failing, let's try one more alternative approach
      if (insertError.code === '23505') { // Duplicate key error
        const { data: existingUser, error: selectError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (selectError) {
          throw insertError; // Throw original error
        }

        return existingUser as User;
      }

      throw insertError;
    }

    return insertedUser as User;
  }, [userId, authUser]);

  const {
    data: user = null,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['user', userId],
    queryFn: fetchUserProfile,
    enabled: !!userId,
    staleTime: 300000, // 5 minutes - user data changes less frequently
    refetchOnWindowFocus: false,
    retry: 2,
  });

  const updateUserProfile = useCallback(async (updates: Partial<User>) => {
    if (!userId) {
      throw new Error("You must be logged in to update your profile");
    }

    try {
      // Get current user from query cache
      const currentUser = queryClient.getQueryData<User>(['user', userId]);

      // If weight, height, age, gender, activity_level, or goal_offset is updated,
      // recalculate target calories and macros
      let updatedData = { ...updates };

      if (
        updates.weight !== undefined ||
        updates.height !== undefined ||
        updates.age !== undefined ||
        updates.gender !== undefined ||
        updates.activity_level !== undefined ||
        updates.goal_offset !== undefined
      ) {
        const weight = updates.weight ?? currentUser?.weight ?? 70;
        const height = updates.height ?? currentUser?.height ?? 170;
        const age = updates.age ?? currentUser?.age ?? 30;
        const gender = updates.gender ?? currentUser?.gender ?? 'male';
        const activityLevel = updates.activity_level ?? currentUser?.activity_level ?? 1.375;
        const goalOffset = updates.goal_offset ?? currentUser?.goal_offset ?? 0;

        // Only recalculate if user hasn't manually set targets
        if (!updates.target_calories && !updates.target_protein &&
            !updates.target_carbs && !updates.target_fat) {
          const targetCalories = calculateDailyCalories(
            weight,
            height,
            age,
            gender,
            activityLevel,
            goalOffset
          );

          const { protein, carbs, fat } = calculateMacros(targetCalories);

          updatedData = {
            ...updatedData,
            target_calories: targetCalories,
            target_protein: protein,
            target_carbs: carbs,
            target_fat: fat,
          };
        }
      }

      // Use upsert to handle potential race conditions
      const { data, error } = await supabase
        .from('users')
        .upsert([{ id: userId, ...updatedData }], { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Invalidate and refetch user query
      queryClient.invalidateQueries({ queryKey: ['user', userId] });

      return data as User;
    } catch (err) {
      throw err;
    }
  }, [userId, queryClient]);

  return {
    user,
    loading: isLoading,
    error: error as Error | null,
    updateUserProfile,
    refreshUserProfile: refetch,
  };
}
