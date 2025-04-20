'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useUser } from '@/hooks/useUser';
import { formatNumber } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '../ui/card';
import NutritionCircles from './NutritionCircles';
import DateNavigation from './DateNavigation';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/hooks/useAuth';

interface NutritionDashboardProps {
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
}

export default function NutritionDashboard({
  selectedDate: propSelectedDate,
  onDateChange: propOnDateChange
}: NutritionDashboardProps) {
  const { user } = useUser();
  const { user: authUser } = useAuth();
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
  const [dateNutrition, setDateNutrition] = useState({
    calories: 0, protein: 0, carbs: 0, fat: 0
  });
  const [isLoadingDate, setIsLoadingDate] = useState(false);
  
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
  
  // Fetch meals for the selected date - Using the SAME implementation as history page
  useEffect(() => {
    async function fetchMealsForDate() {
      if (!authUser) return;
      
      setIsLoadingDate(true);
      
      try {
        // Get start and end of selected date
        const startDate = new Date(selectedDate);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(selectedDate);
        endDate.setHours(23, 59, 59, 999);
        
        // Query meals for the selected date range - exactly like history page
        const { data, error } = await supabase
          .from('meals')
          .select('*')
          .eq('user_id', authUser.id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Error fetching meals for date:', error);
          throw error;
        }
        
        if (data && data.length > 0) {
          // Calculate nutrition totals for this date - exactly like history page
          const totals = data.reduce((acc, meal) => ({
            calories: acc.calories + (meal.calories || 0),
            protein: acc.protein + (meal.protein || 0),
            carbs: acc.carbs + (meal.carbs || 0),
            fat: acc.fat + (meal.fat || 0),
          }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
          
          setDateNutrition(totals);
        } else {
          // No meals found for this date
          setDateNutrition({ calories: 0, protein: 0, carbs: 0, fat: 0 });
        }
      } catch (err) {
        console.error('Failed to fetch meals for date:', err);
      } finally {
        setIsLoadingDate(false);
      }
    }
    
    fetchMealsForDate();
  }, [selectedDate, authUser]);

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center px-4 pt-4 pb-0">
        <DateNavigation 
          currentDate={selectedDate}
          onDateChange={setSelectedDate}
        />
      </CardHeader>
      <CardContent className="pt-6 pb-4">
        {isLoadingDate ? (
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
            dailyNutrition={dateNutrition}
            targets={targets}
          />
        )}
      </CardContent>
    </Card>
  );
}