import { create } from 'zustand';

interface Meal {
  id: string;
  mealName: string | string[]; // Added
  ingredients?: string[]; // Added (optional)
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  // Removed 'name' field, replaced by mealName
}

interface DailyNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface UserPreferences {
  darkMode: boolean;
  dailyGoals: Partial<DailyNutrition>;
}

interface AppState {
  meals: Meal[];
  dailyNutrition: DailyNutrition;
  userPreferences: UserPreferences;
  addMeal: (meal: Omit<Meal, 'id'>) => void; // Input type updated implicitly
  toggleDarkMode: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  meals: [],
  dailyNutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
  userPreferences: { darkMode: false, dailyGoals: {} },

  addMeal: (mealData) => set((state) => {
    // Ensure mealName exists, provide fallback if necessary
    const mealName = mealData.mealName || 'Analyzed Meal';
    const newMeal: Meal = {
        ...mealData,
        mealName: mealName, // Use provided or fallback
        id: Date.now().toString()
    };
    const updatedNutrition = {
      calories: state.dailyNutrition.calories + newMeal.calories,
      protein: state.dailyNutrition.protein + newMeal.protein,
      carbs: state.dailyNutrition.carbs + newMeal.carbs,
      fat: state.dailyNutrition.fat + newMeal.fat,
    };
    return {
      meals: [...state.meals, newMeal],
      dailyNutrition: updatedNutrition,
    };
  }),

  toggleDarkMode: () => set((state) => ({
    userPreferences: {
      ...state.userPreferences,
      darkMode: !state.userPreferences.darkMode
    }
  })),

}));