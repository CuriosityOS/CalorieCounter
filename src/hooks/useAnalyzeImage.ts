import { useMutation } from '@tanstack/react-query'; // Removed unused useQueryClient
import { analyzeImage } from '@/services/api';
import { useAppStore } from '@/store/useAppStore';

type AnalyzeImageInput = string;

interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealName?: string | string[]; // Added
  ingredients?: string[]; // Added
  rawResponse?: string;
}

class ApiError extends Error {
  status?: number;
  info?: unknown; // Use unknown instead of any
}


export function useAnalyzeImage() {
  // const queryClient = useQueryClient(); // Removed unused variable
  const addMeal = useAppStore((state) => state.addMeal);

  return useMutation<NutritionInfo, ApiError, AnalyzeImageInput>({
    mutationFn: analyzeImage,

    onSuccess: (data) => { // Removed unused args
      console.log('Analysis successful:', data);

      if (typeof data.calories === 'number' &&
          typeof data.protein === 'number' &&
          typeof data.carbs === 'number' &&
          typeof data.fat === 'number') {
        // Ensure mealName and ingredients are passed to the store action
        addMeal({
          mealName: data.mealName || 'Analyzed Meal', // Use API mealName or fallback
          ingredients: data.ingredients, // Pass ingredients array (optional)
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fat: data.fat,
        });
        console.log('Meal added to store.');
      } else {
        console.warn('Analysis successful, but missing nutrition data to add meal:', data);
      }

    },

    onError: (error) => { // Removed unused args
      console.error('Analysis failed:', error);
    },

    onSettled: () => { // Removed unused args
      console.log('Analysis mutation settled.');
    },
  });
}