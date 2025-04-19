'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { formatDate } from '@/lib/utils';
import { Filter, Calendar, X, UtensilsCrossed } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DateNavigation from '@/components/app/DateNavigation';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/hooks/useAuth';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import NutritionCircles from '@/components/app/NutritionCircles';

export default function HistoryPage() {
  // Make this an explicit client component
  if (typeof window === 'undefined') {
    return null; // Will never render this on server
  }
  const { user } = useAuth();
  const nutritionGoals = useAppStore((state) => state.userPreferences.nutritionGoals);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterType, setFilterType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dateNutrition, setDateNutrition] = useState({
    calories: 0, protein: 0, carbs: 0, fat: 0
  });
  const [dateMeals, setDateMeals] = useState<any[]>([]);
  
  // Use user's custom targets if available, otherwise use app's default goals
  const targets = {
    calories: user?.target_calories || nutritionGoals.calories,
    protein: user?.target_protein || nutritionGoals.protein,
    carbs: user?.target_carbs || nutritionGoals.carbs,
    fat: user?.target_fat || nutritionGoals.fat,
  };
  
  // Fetch meals for the selected date
  useEffect(() => {
    async function fetchMealsForDate() {
      if (!user) return;
      
      setIsLoading(true);
      
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
          .eq('user_id', user.id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Error fetching meals for date:', error);
          throw error;
        }
        
        if (data && data.length > 0) {
          // Apply type filter if set
          const filteredMeals = filterType 
            ? data.filter(meal => {
                const mealName = meal.meal_name;
                return mealName && mealName.toLowerCase().includes(filterType.toLowerCase());
              })
            : data;
            
          setDateMeals(filteredMeals);
          
          // Calculate nutrition totals for this date
          const totals = filteredMeals.reduce((acc, meal) => ({
            calories: acc.calories + (meal.calories || 0),
            protein: acc.protein + (meal.protein || 0),
            carbs: acc.carbs + (meal.carbs || 0),
            fat: acc.fat + (meal.fat || 0),
          }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
          
          setDateNutrition(totals);
        } else {
          // No meals found for this date
          setDateMeals([]);
          setDateNutrition({ calories: 0, protein: 0, carbs: 0, fat: 0 });
        }
      } catch (err) {
        console.error('Failed to fetch meals for date:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchMealsForDate();
  }, [selectedDate, user, filterType]);
  
  // Get unique meal types from all meals
  const getMealTypes = () => {
    const types = new Set<string>();
    dateMeals.forEach(meal => {
      const mealName = meal.meal_name;
      if (mealName) {
        types.add(mealName);
      }
    });
    return Array.from(types);
  };
  
  const mealTypes = getMealTypes();
  
  const handleClearFilters = () => {
    setFilterType(null);
  };
  
  // Format timestamp for display
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  return (
    <div className="container px-4 py-6 max-w-7xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Meal History</h1>
            <p className="text-muted-foreground mt-1">
              View your nutrition and meals by date
            </p>
          </div>
        </div>
        
        {/* Date Navigation */}
        <DateNavigation 
          currentDate={selectedDate}
          onDateChange={setSelectedDate}
        />
        
        {/* Nutrition Summary */}
        <Card className="mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Nutrition Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
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
        
        {/* Filters */}
        {mealTypes.length > 0 && (
          <div className="flex flex-wrap gap-2 my-4">
            <div className="flex items-center mr-2">
              <Filter className="h-4 w-4 mr-1 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filter by meal:</span>
            </div>
            
            {mealTypes.map(type => (
              <Button
                key={type}
                variant={filterType === type ? "default" : "outline"}
                size="sm"
                className="h-8"
                onClick={() => setFilterType(filterType === type ? null : type)}
              >
                {type}
              </Button>
            ))}
            
            {filterType && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={handleClearFilters}
              >
                <X className="mr-1 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        )}
        
        {/* Meals for Selected Date */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <UtensilsCrossed className="w-5 h-5 mr-2 text-primary" />
              Meals for {formatDate(selectedDate)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px] w-full p-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex flex-col animate-pulse space-y-2">
                      <div className="h-5 w-1/3 bg-secondary/20 rounded"></div>
                      <div className="h-4 w-full bg-secondary/20 rounded"></div>
                      <div className="h-4 w-2/3 bg-secondary/20 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : dateMeals.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No meals found for this date.</p>
              ) : (
                <div className="space-y-4">
                  {dateMeals.map((meal, index) => (
                    <div key={meal.id}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <p className="font-medium text-sm">{meal.meal_name || 'Unnamed Meal'}</p>
                            <span className="text-xs text-muted-foreground ml-2">
                              {formatTime(meal.created_at)}
                            </span>
                          </div>
                          
                          <p className="text-xs text-muted-foreground mt-1">
                            Calories: {meal.calories} | Protein: {meal.protein}g | Carbs: {meal.carbs}g | Fat: {meal.fat}g
                          </p>
                          
                          {meal.ingredients && meal.ingredients.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Ingredients: {meal.ingredients.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                      {index < dateMeals.length - 1 && <Separator className="my-3" />}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}