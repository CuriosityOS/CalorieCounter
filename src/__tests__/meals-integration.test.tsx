import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import UserDashboard from '@/components/app/UserDashboard'; // Not needed for this test
import NutritionDashboard from '@/components/app/NutritionDashboard';
import { useMeals } from '@/hooks/useMeals';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import MealHistory from '@/components/app/MealHistory';
import ManualFoodEntry from '@/components/app/ManualFoodEntry';

// Mock the hooks
jest.mock('@/hooks/useMeals');
jest.mock('@/hooks/useAuth');
jest.mock('@/hooks/useUser');
jest.mock('@/store/useAppStore');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    prefetch: jest.fn(),
  }),
}));

describe('Meals Integration Tests', () => {
  // Create a fresh QueryClient for each test
  let queryClient: QueryClient;

  // Setup the mocks for each test
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Mock Auth hook
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'test-user-id', email: 'test@example.com' },
      loading: false,
      error: null,
    });

    // Mock User hook
    (useUser as jest.Mock).mockReturnValue({
      user: { 
        id: 'test-user-id', 
        email: 'test@example.com',
        target_calories: 2000,
        target_protein: 150,
        target_carbs: 200,
        target_fat: 65,
      },
      loading: false,
      error: null,
      updateUserProfile: jest.fn(),
    });
  });

  test('adding a meal updates nutrition dashboard and meal history immediately', async () => {
    // Initial state: empty meals
    const initialMeals: Array<Record<string, unknown>> = [];
    const mockAddMeal = jest.fn().mockImplementation(async (mealData) => {
      const newMeal = {
        id: 'new-meal-id',
        meal_name: mealData.meal_name,
        calories: mealData.calories,
        protein: mealData.protein,
        carbs: mealData.carbs,
        fat: mealData.fat,
        ingredients: mealData.ingredients,
        user_id: 'test-user-id',
        created_at: new Date().toISOString(),
      };
      
      // Update the mocked data for the next useQuery call
      mockMeals.push(newMeal);
      mockTodayMeals.push(newMeal);
      
      // Recalculate totals
      mockDailyTotals = {
        calories: mockTodayMeals.reduce((acc, meal) => acc + meal.calories, 0),
        protein: mockTodayMeals.reduce((acc, meal) => acc + meal.protein, 0),
        carbs: mockTodayMeals.reduce((acc, meal) => acc + meal.carbs, 0),
        fat: mockTodayMeals.reduce((acc, meal) => acc + meal.fat, 0),
      };
      
      return newMeal;
    });

    const mockMeals = [...initialMeals];
    const mockTodayMeals = [...initialMeals];
    let mockDailyTotals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    };

    // Mock the hook with its data
    (useMeals as jest.Mock).mockImplementation(() => ({
      meals: mockMeals,
      todayMeals: mockTodayMeals,
      dailyTotals: mockDailyTotals,
      loading: false,
      error: null,
      addMeal: mockAddMeal,
      updateMeal: jest.fn(),
      deleteMeal: jest.fn(),
      refreshMeals: jest.fn(),
    }));

    render(
      <QueryClientProvider client={queryClient}>
        <NutritionDashboard />
        <MealHistory />
        <ManualFoodEntry />
      </QueryClientProvider>
    );

    // Verify initial state - no meals
    expect(screen.getByText('No meals logged yet. Upload an image to start!')).toBeInTheDocument();
    
    // Assert initial calories (0)
    expect(screen.getAllByText('0')[0]).toBeInTheDocument();

    // Fill and submit the manual food entry form
    fireEvent.change(screen.getByLabelText('Food Name'), {
      target: { value: 'Test Meal' },
    });
    fireEvent.change(screen.getByLabelText('Calories'), {
      target: { value: '500' },
    });
    fireEvent.change(screen.getByLabelText('Protein (g)'), {
      target: { value: '30' },
    });
    fireEvent.change(screen.getByLabelText('Carbs (g)'), {
      target: { value: '40' },
    });
    fireEvent.change(screen.getByLabelText('Fat (g)'), {
      target: { value: '20' },
    });

    // Click the Add Food button
    fireEvent.click(screen.getByText('Add Food'));

    // Verify addMeal was called with the correct data
    await waitFor(() => {
      expect(mockAddMeal).toHaveBeenCalledWith(expect.objectContaining({
        meal_name: 'Test Meal',
        calories: 500,
        protein: 30,
        carbs: 40,
        fat: 20,
      }));
    });

    // Mock the useMeals hook again now that the data has been updated
    (useMeals as jest.Mock).mockImplementation(() => ({
      meals: mockMeals,
      todayMeals: mockTodayMeals,
      dailyTotals: mockDailyTotals,
      loading: false,
      error: null,
      addMeal: mockAddMeal,
      updateMeal: jest.fn(),
      deleteMeal: jest.fn(),
      refreshMeals: jest.fn(),
    }));

    // Re-render to simulate React Query's update
    render(
      <QueryClientProvider client={queryClient}>
        <NutritionDashboard />
        <MealHistory />
      </QueryClientProvider>
    );

    // Verify the meal appears in the meal history
    await waitFor(() => {
      expect(screen.getByText('Test Meal')).toBeInTheDocument();
    });

    // Verify the nutrition dashboard reflects the new meal
    await waitFor(() => {
      expect(screen.getAllByText('500').length).toBeGreaterThan(0);
      expect(screen.getAllByText('30g').length).toBeGreaterThan(0);
      expect(screen.getAllByText('40g').length).toBeGreaterThan(0);
      expect(screen.getAllByText('20g').length).toBeGreaterThan(0);
    });
  });
});