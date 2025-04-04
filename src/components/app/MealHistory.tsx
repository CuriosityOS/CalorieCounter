'use client';

import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";


const MealHistory: React.FC = () => {
  const meals = useAppStore((state) => state.meals);

  return (
    <Card>
      <CardHeader>
        {/* Title is in UserDashboard */}
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-72 w-full rounded-md border p-4">
          {meals.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No meals logged yet. Upload an image to start!</p>
          ) : (
            <div className="space-y-4">
              {meals.slice().reverse().map((meal, index) => {
                // Format mealName (handle array case)
                const displayMealName = meal.mealName
                  ? Array.isArray(meal.mealName) ? meal.mealName.join(', ') : meal.mealName
                  : 'Analyzed Meal';

                return (
                  <React.Fragment key={meal.id}>
                    <div>
                      {/* Display Meal Name prominently */}
                      <p className="font-medium text-sm">{displayMealName}</p>
                      {/* Optional: Display ingredients if needed */}
                      {/* <p className="text-xs text-muted-foreground">Ingredients: {meal.ingredients?.join(', ') || 'N/A'}</p> */}
                      <p className="text-xs text-muted-foreground">
                        Calories: {meal.calories} | Protein: {meal.protein}g | Carbs: {meal.carbs}g | Fat: {meal.fat}g
                      </p>
                    </div>
                    {index < meals.length - 1 && <Separator className="my-2" />}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default MealHistory;