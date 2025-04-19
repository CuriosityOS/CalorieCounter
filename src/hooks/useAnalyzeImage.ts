import { useMutation, useQueryClient } from '@tanstack/react-query';
import { analyzeImage } from '@/services/api';
import { useAppStore } from '@/store/useAppStore';
import { useMeals } from './useMeals';
import { useAuth } from './useAuth';
import { useState } from 'react';
import { supabase } from '@/lib/supabase-client';

type AnalyzeImageInput = string;

interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealName?: string | string[];
  ingredients?: string[];
  rawResponse?: string;
}

class ApiError extends Error {
  status?: number;
  info?: unknown;
}

export function useAnalyzeImage() {
  const { user } = useAuth();
  const { addMeal: addMealToSupabase } = useMeals();
  const refreshAll = useAppStore((state) => state.refreshAll);
  const queryClient = useQueryClient();
  
  // Base64 to store the image
  const [lastUploadedImage, setLastUploadedImage] = useState<string | null>(null);

  return useMutation<NutritionInfo, ApiError, AnalyzeImageInput>({
    mutationFn: (imageBase64) => {
      // Store the base64 image for later use
      setLastUploadedImage(imageBase64);
      return analyzeImage(imageBase64);
    },

    onSuccess: async (data) => {
      console.log('Analysis successful:', data);

      if (typeof data.calories === 'number' &&
          typeof data.protein === 'number' &&
          typeof data.carbs === 'number' &&
          typeof data.fat === 'number') {
        
        try {
          if (!user) {
            console.error('User not authenticated, cannot save meal to database');
            return;
          }
          
          console.log('User is authenticated, saving to Supabase...');
          
          // Convert for Supabase format
          const supabaseMeal = {
            meal_name: Array.isArray(data.mealName) 
              ? data.mealName.join(', ') 
              : (data.mealName || 'Analyzed Meal'),
            ingredients: data.ingredients,
            calories: data.calories,
            protein: data.protein,
            carbs: data.carbs,
            fat: data.fat,
            // Only include image_url for actual images (not text descriptions)
            image_url: lastUploadedImage && !lastUploadedImage.startsWith('TEXTONLY_') 
              ? `data:image/jpeg;base64,${lastUploadedImage}` 
              : undefined,
          };
          
          console.log('Saving meal to Supabase:', supabaseMeal);
          
          // Use a more consistent approach with better error handling
          let mealSaved = false;
          
          // First try using the hook
          try {
            const result = await addMealToSupabase(supabaseMeal);
            console.log('Meal saved to database successfully via hook:', result);
            mealSaved = true;
          } catch (hookError) {
            console.error('Failed to save meal via hook:', hookError);
          }
          
          // If hook approach failed, try direct Supabase call
          if (!mealSaved) {
            try {
              console.log('Attempting direct Supabase save as fallback...');
              const { data: directResult, error: directError } = await supabase
                .from('meals')
                .insert([{
                  ...supabaseMeal,
                  user_id: user.id // Make sure to include user_id
                }])
                .select()
                .single();
                
              if (directError) {
                throw directError;
              }
              
              console.log('Meal saved directly to Supabase:', directResult);
              mealSaved = true;
            } catch (directError) {
              console.error('Direct save also failed:', directError);
              throw directError;
            }
          }
          
          // Only refresh data if meal was saved successfully
          if (mealSaved) {
            // Invalidate React Query cache to refresh meals list
            // Properly invalidate all related queries
            queryClient.invalidateQueries({ queryKey: ['meals'] });
            
            // Directly fetch a fresh copy instead of waiting for automatic refetch
            queryClient.fetchQuery({ queryKey: ['meals', user.id] })
              .catch(error => console.error('Error fetching updated meals:', error));
            
            // Also refresh app store state as a fallback
            try {
              refreshAll();
            } catch (refreshError) {
              console.error('Failed to refresh app state after saving meal:', refreshError);
            }
          }
        } catch (err) {
          console.error('Failed to save meal to database:', err);
          throw err; // Re-throw so the UI can show an error state
        }
      } else {
        console.warn('Analysis successful, but missing nutrition data to add meal:', data);
        throw new Error('Incomplete nutrition data received from analysis');
      }
    },

    onError: (error) => {
      console.error('Analysis failed:', error);
    },
  });
}