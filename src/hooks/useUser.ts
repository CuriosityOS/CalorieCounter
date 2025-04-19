'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase-client';
import type { User } from '@/lib/supabase-client';
import { calculateDailyCalories, calculateMacros } from '@/lib/utils';

export function useUser() {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUserProfile = useCallback(async () => {
    if (!authUser) {
      console.log("No auth user, clearing user profile");
      setUser(null);
      setLoading(false);
      return;
    }

    console.log("Auth user found, fetching profile:", authUser.id);
    setLoading(true);
    setError(null); // Clear any previous errors
    
    try {
      // Check if table exists first
      const { error: tableCheckError } = await supabase
        .from('users')
        .select('id')
        .limit(1);
        
      if (tableCheckError) {
        console.error("Error checking users table:", tableCheckError);
        console.warn("Database tables might not be set up correctly. Check supabase_setup.sql");
      }
        
      // Try to get user profile
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
        
      if (error) {
        if (error.code === 'PGRST116') {
          // Record not found - this is expected for new users
          console.log("User profile not found, will create new one");
        } else {
          console.error("Error fetching user profile:", error);
          throw error;
        }
      }
      
      if (data) {
        console.log("User profile found:", data);
        setUser(data as User);
      } else {
        // Create a new user profile if one doesn't exist
        console.log("Creating new user profile for:", authUser.id);
        const newUser: Partial<User> = {
          id: authUser.id,
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
        
        console.log("Inserting new user profile:", userWithTargets);
        
        // Use upsert instead of insert to avoid race conditions
        const { data: insertedUser, error: insertError } = await supabase
          .from('users')
          .upsert([userWithTargets], { onConflict: 'id' })
          .select()
          .single();
          
        if (insertError) {
          console.error("Failed to insert user profile:", insertError);
          
          // If still failing, let's try one more alternative approach
          if (insertError.code === '23505') { // Duplicate key error
            console.log("Conflict detected, trying to select existing user");
            const { data: existingUser, error: selectError } = await supabase
              .from('users')
              .select('*')
              .eq('id', authUser.id)
              .single();
              
            if (selectError) {
              console.error("Failed to select existing user after conflict:", selectError);
              throw insertError; // Throw original error
            }
            
            console.log("Found existing user:", existingUser);
            return existingUser;
          }
          
          throw insertError;
        }
        
        console.log("New user profile created:", insertedUser);
        setUser(insertedUser as User);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    console.log("useUser effect triggered, authUser:", authUser?.id);
    if (authUser) {
      console.log("Attempting to fetch user profile for:", authUser.id);
      fetchUserProfile();
    }
  }, [fetchUserProfile, authUser?.id]);

  const updateUserProfile = useCallback(async (updates: Partial<User>) => {
    if (!authUser) {
      console.error("Cannot update user profile: No auth user");
      throw new Error("You must be logged in to update your profile");
    }
    
    console.log("Updating user profile:", updates);
    
    try {
      // First check if user profile exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
        
      if (checkError && checkError.code !== 'PGRST116') {
        console.error("Error checking for existing user:", checkError);
        throw checkError;
      }
      
      // If no user profile exists, create one first
      if (!existingUser) {
        console.log("User profile doesn't exist, creating it first");
        await fetchUserProfile();
        // Re-fetch the user after creation
        const { data: newUser, error: refetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();
          
        if (refetchError) {
          console.error("Error fetching newly created user:", refetchError);
          throw refetchError;
        }
        
        if (!newUser) {
          throw new Error("Failed to create user profile");
        }
        
        setUser(newUser as User);
      }
      
      const currentUser = existingUser || user;
      
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
      
      console.log("Sending update to database:", updatedData);
      
      // Use upsert to handle potential race conditions
      const { data, error } = await supabase
        .from('users')
        .upsert([{ id: authUser.id, ...updatedData }], { onConflict: 'id' })
        .select()
        .single();
        
      if (error) {
        console.error("Database update error:", error);
        throw error;
      }
      
      if (data) {
        console.log("Profile updated successfully:", data);
        setUser(data as User);
      }
      
      return data as User;
    } catch (err) {
      console.error('Error updating user profile:', err);
      throw err;
    }
  }, [authUser, user, fetchUserProfile]);

  return {
    user,
    loading,
    error,
    updateUserProfile,
    refreshUserProfile: fetchUserProfile,
  };
}