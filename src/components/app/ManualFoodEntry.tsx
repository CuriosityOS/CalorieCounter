'use client';

import React, { useState, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useMeals } from '@/hooks/useMeals';
import { useAppStore } from '@/store/useAppStore';
import { useQueryClient } from '@tanstack/react-query';

const ManualFoodEntry = memo(function ManualFoodEntry() {
  const { addMeal } = useMeals(undefined, { skip: true });
  const refreshAll = useAppStore((state) => state.refreshAll);
  const queryClient = useQueryClient();
  
  const [mealName, setMealName] = useState<string>('');
  const [calories, setCalories] = useState<string>('');
  const [protein, setProtein] = useState<string>('');
  const [carbs, setCarbs] = useState<string>('');
  const [fat, setFat] = useState<string>('');
  const [ingredients, setIngredients] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  
  const isValid = () => {
    return (
      mealName.trim() !== '' && 
      !isNaN(parseFloat(calories)) && 
      !isNaN(parseFloat(protein)) && 
      !isNaN(parseFloat(carbs)) && 
      !isNaN(parseFloat(fat))
    );
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValid()) {
      setError('Please fill in all fields with valid numbers.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Extract ingredients from comma-separated list
      const ingredientsArray = ingredients.split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);
      
      const mealData = {
        meal_name: mealName,
        calories: parseInt(calories),
        protein: parseInt(protein),
        carbs: parseInt(carbs),
        fat: parseInt(fat),
        ingredients: ingredientsArray,
      };
      
      await addMeal(mealData);
      
      // Invalidate any queries that fetch meals to force a refresh
      queryClient.invalidateQueries({ queryKey: ['meals'] });
      
      // Refresh the app state as a fallback
      await refreshAll();
      
      // Show success message
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      // Reset form
      setMealName('');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFat('');
      setIngredients('');
    } catch (err) {
      console.error('Error adding meal manually:', err);
      setError('Failed to add meal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Manual Food Entry</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="meal-name">Food Name</Label>
            <Input
              id="meal-name"
              placeholder="e.g., Chicken Salad"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="calories">Calories</Label>
              <Input
                id="calories"
                type="number"
                placeholder="e.g., 350"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="protein">Protein (g)</Label>
              <Input
                id="protein"
                type="number"
                placeholder="e.g., 25"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="carbs">Carbs (g)</Label>
              <Input
                id="carbs"
                type="number"
                placeholder="e.g., 30"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="fat">Fat (g)</Label>
              <Input
                id="fat"
                type="number"
                placeholder="e.g., 15"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="ingredients">
              Ingredients (comma-separated, optional)
            </Label>
            <Input
              id="ingredients"
              placeholder="e.g., Chicken, Lettuce, Tomato, Dressing"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              className="mt-1"
            />
          </div>
          
          {error && (
            <div className="text-sm text-destructive p-2 bg-destructive/10 rounded">
              {error}
            </div>
          )}
          
          {success && (
            <div className="text-sm text-green-600 p-2 bg-green-100 dark:bg-green-900/10 rounded">
              Food added successfully!
            </div>
          )}
          
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isSubmitting || !isValid()}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4" />
                  Add Food
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
});

export default ManualFoodEntry;