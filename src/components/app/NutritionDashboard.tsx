'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useUser } from '@/hooks/useUser';
// import { formatNumber } from '@/lib/utils'; // Not needed after refactoring
import { Card, CardContent, CardHeader } from '../ui/card';
import NutritionCircles from './NutritionCircles';
import DateNavigation from './DateNavigation';
import { useAuth } from '@/hooks/useAuth';
import { useMeals } from '@/hooks/useMeals';

interface NutritionDashboardProps {
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
}

export default function NutritionDashboard({
  selectedDate: propSelectedDate,
  onDateChange: propOnDateChange
}: NutritionDashboardProps) {
  const { user } = useUser();
  // const { user: authUser } = useAuth(); // Not needed after refactoring
  const nutritionGoals = useAppStore((state) => state.userPreferences.nutritionGoals);
  
  // State for date navigation - use props if provided, otherwise use local state
  const [localSelectedDate, setLocalSelectedDate] = useState(new Date());
  
  // Use either prop or local state
  const selectedDate = propSelectedDate || localSelectedDate;
  const setSelectedDate = (date: Date) => {
    if (propOnDateChange) {
      propOnDateChange(date);
    } else {
      setLocalSelectedDate(date);
    }
  };

  // Using useMeals hook to get real-time nutrition data
  const { dailyTotals, loading: mealsLoading } = useMeals();
  
  // Use user's custom targets if available, otherwise use app's default goals
  const targets = {
    calories: user?.target_calories || nutritionGoals.calories,
    protein: user?.target_protein || nutritionGoals.protein,
    carbs: user?.target_carbs || nutritionGoals.carbs,
    fat: user?.target_fat || nutritionGoals.fat,
  };

  // Check if the user refreshes the app at midnight or later
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const today = new Date().toISOString().split('T')[0];
      const lastDay = localStorage.getItem('last-active-day');
      
      if (!lastDay || lastDay !== today) {
        localStorage.setItem('last-active-day', today);
        // Force refresh meals data when a new day is detected
        window.location.reload();
      }
    }
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center px-4 pt-4 pb-0">
        <DateNavigation 
          currentDate={selectedDate}
          onDateChange={setSelectedDate}
        />
      </CardHeader>
      <CardContent className="pt-6 pb-4">
        {mealsLoading ? (
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
            dailyNutrition={dailyTotals}
            targets={targets}
          />
        )}
      </CardContent>
    </Card>
  );
}