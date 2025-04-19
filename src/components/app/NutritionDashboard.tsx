'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useUser } from '@/hooks/useUser';
import { useMeals } from '@/hooks/useMeals';
import { formatNumber } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '../ui/card';
import NutritionCircles from './NutritionCircles';
import DateNavigation from './DateNavigation';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/hooks/useAuth';

export default function NutritionDashboard() {
  const { user } = useUser();
  const { user: authUser } = useAuth();
  // Get daily totals directly from the hook with loading state
  const { dailyTotals, loading: mealsLoading } = useMeals();
  const fallbackDailyNutrition = useAppStore((state) => state.dailyNutrition);
  const nutritionGoals = useAppStore((state) => state.userPreferences.nutritionGoals);
  
  // State for date navigation
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateNutrition, setDateNutrition] = useState({
    calories: 0, protein: 0, carbs: 0, fat: 0
  });
  const [isLoadingDate, setIsLoadingDate] = useState(false);
  
  // Always try to get data from hook first, then fall back to store data if needed
  // The || ensures we have valid defaults even during initial load
  const dailyNutrition = dailyTotals || fallbackDailyNutrition;
  
  // Use user's custom targets if available, otherwise use app's default goals
  const targets = {
    calories: user?.target_calories || nutritionGoals.calories,
    protein: user?.target_protein || nutritionGoals.protein,
    carbs: user?.target_carbs || nutritionGoals.carbs,
    fat: user?.target_fat || nutritionGoals.fat,
  };
  
  // Check if selected date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };
  
  // Fetch meals for the selected date
  useEffect(() => {
    async function fetchMealsForDate() {
      if (!authUser) return;
      
      // Use today's data directly if available (for performance)
      if (isToday(selectedDate) && dailyTotals) {
        setDateNutrition(dailyTotals);
        return;
      }
      
      setIsLoadingDate(true);
      
      try {
        // Get start and end of selected date
        const startDate = new Date(selectedDate);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(selectedDate);
        endDate.setHours(23, 59, 59, 999);
        
        // Query meals for the selected date range
        const { data, error } = await supabase
          .from('meals')
          .select('*')
          .eq('user_id', authUser.id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
          
        if (error) {
          console.error('Error fetching meals for date:', error);
          throw error;
        }
        
        if (data && data.length > 0) {
          // Calculate nutrition totals for this date
          const totals = data.reduce((acc, meal) => ({
            calories: acc.calories + (meal.calories || 0),
            protein: acc.protein + (meal.protein || 0),
            carbs: acc.carbs + (meal.carbs || 0),
            fat: acc.fat + (meal.fat || 0),
          }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
          
          setDateNutrition(totals);
          
          // If we found data for this date, store it
          localStorage.setItem(`has-meals-${selectedDate.toISOString().split('T')[0]}`, 'true');
        } else {
          // No meals found for this date
          setDateNutrition({ calories: 0, protein: 0, carbs: 0, fat: 0 });
          
          // If no data was found for this date and it's not today, go back to today
          if (!isToday(selectedDate)) {
            setTimeout(() => {
              onDateChange(new Date());
            }, 500);
          }
        }
      } catch (err) {
        console.error('Failed to fetch meals for date:', err);
      } finally {
        setIsLoadingDate(false);
      }
    }
    
    fetchMealsForDate();
  }, [selectedDate, authUser, dailyTotals]);
  
  // Show different nutrition data based on selected date
  const displayNutrition = isToday(selectedDate) 
    ? dailyNutrition 
    : dateNutrition;

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center px-4 pt-4 pb-0">
        <DateNavigation 
          currentDate={selectedDate}
          onDateChange={setSelectedDate}
        />
      </CardHeader>
      <CardContent className="pt-6 pb-4">
        {(mealsLoading || isLoadingDate) ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex flex-col items-center animate-pulse">
                <div className="w-[100px] h-[100px] rounded-full bg-secondary/20"></div>
                <div className="mt-4 h-4 w-16 bg-secondary/20 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <NutritionCircles
            dailyNutrition={displayNutrition}
            targets={targets}
          />
        )}
      </CardContent>
    </Card>
  );
}