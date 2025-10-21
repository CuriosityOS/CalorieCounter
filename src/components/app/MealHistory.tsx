'use client';

import React, { useState, useMemo, useCallback, memo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { formatTime } from '@/lib/utils';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { 
  Edit, 
  Trash2, 
  Check, 
  X,
  Info,
  Image as ImageIcon,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnalyzeImage } from '@/hooks/useAnalyzeImage';
import { useMeals } from '@/hooks/useMeals';
import { useAuth } from '@/hooks/useAuth';
import OptimizedImage from './OptimizedImage';
// import { supabase } from '@/lib/supabase-client'; // Not needed after refactoring

interface MealEditFormProps {
  meal: {
    id: string;
    mealName: string | string[];
    ingredients?: string[];
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  onCancel: () => void;
  onSave: (updatedMeal: {
    mealName: string;
    ingredients?: string[];
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }) => void;
  onAiUpdate: () => void;
}

const MealEditForm = memo<MealEditFormProps>(({ meal, onCancel, onSave, onAiUpdate }) => {
  const displayMealName = typeof meal.mealName === 'string' 
    ? meal.mealName 
    : meal.mealName.join(', ');
    
  const [name, setName] = useState(displayMealName);
  const [calories, setCalories] = useState(meal.calories);
  const [protein, setProtein] = useState(meal.protein);
  const [carbs, setCarbs] = useState(meal.carbs);
  const [fat, setFat] = useState(meal.fat);
  const [aiDescription, setAiDescription] = useState('');
  
  const handleSave = () => {
    onSave({
      mealName: name,
      ingredients: meal.ingredients,
      calories,
      protein,
      carbs,
      fat,
    });
  };
  
  const handleAiUpdate = () => {
    onAiUpdate();
  };

  return (
    <div className="p-3 space-y-3 bg-accent/30 rounded-md">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-sm">Edit Meal</h4>
        <div className="flex space-x-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onCancel} 
            className="h-7 w-7 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleSave} 
            className="h-7 w-7 rounded-full text-primary"
          >
            <Check className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-2">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-2 py-1 text-sm rounded border bg-background"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Calories</label>
            <input
              type="number"
              step="0.1"
              value={calories}
              onChange={(e) => setCalories(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full px-2 py-1 text-sm rounded border bg-background"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Protein (g)</label>
            <input
              type="number"
              step="0.1"
              value={protein}
              onChange={(e) => setProtein(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full px-2 py-1 text-sm rounded border bg-background"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Carbs (g)</label>
            <input
              type="number"
              step="0.1"
              value={carbs}
              onChange={(e) => setCarbs(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full px-2 py-1 text-sm rounded border bg-background"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Fat (g)</label>
            <input
              type="number"
              step="0.1"
              value={fat}
              onChange={(e) => setFat(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full px-2 py-1 text-sm rounded border bg-background"
            />
          </div>
        </div>
        
        <div className="pt-2">
          <label className="text-xs text-muted-foreground mb-1 block flex items-center">
            <Info className="h-3 w-3 mr-1" />
            AI Description Update
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={aiDescription}
              onChange={(e) => setAiDescription(e.target.value)}
              placeholder="e.g., 'This is chicken, not pork' or 'Add broccoli'"
              className="flex-1 px-2 py-1 text-sm rounded border bg-background"
            />
            <Button
              size="sm"
              onClick={handleAiUpdate}
              variant="outline"
              className="text-xs h-7"
              disabled={!aiDescription.trim()}
            >
              Update
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

MealEditForm.displayName = 'MealEditForm';

interface MealHistoryProps { 
  limit?: number; 
  showTitle?: boolean; 
  className?: string;
  selectedDate?: Date;
}

export default function MealHistory({ limit, showTitle = true, className = "" }: Omit<MealHistoryProps, 'selectedDate'>) {
  // Get hook functions
  const { todayMeals, updateMeal: updateMealInSupabase, deleteMeal: deleteMealFromSupabase } = useMeals();
  const { user: authUser } = useAuth();
  const updateMeal = useAppStore((state) => state.updateMeal);
  const deleteMeal = useAppStore((state) => state.deleteMeal);
  const refreshAll = useAppStore((state) => state.refreshAll);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [showImageId, setShowImageId] = useState<string | null>(null);
  const analyzeMutation = useAnalyzeImage();

  // Optimize: Combine all three data transformations into a single memoization
  const displayMeals = useMemo(() => {
    if (!authUser) {
      return [];
    }

    const formattedMeals = todayMeals.map(meal => ({
      id: meal.id,
      mealName: meal.meal_name || 'Unknown Meal',
      ingredients: meal.ingredients || [],
      calories: meal.calories || 0,
      protein: meal.protein || 0,
      carbs: meal.carbs || 0,
      fat: meal.fat || 0,
      timestamp: new Date(meal.created_at).getTime(),
      imageUrl: meal.image_url || undefined,
      // Keep original fields for compatibility
      meal_name: meal.meal_name || 'Unknown Meal',
      created_at: meal.created_at,
      image_url: meal.image_url || undefined,
    }));

    return limit ? formattedMeals.slice(0, limit) : formattedMeals;
  }, [todayMeals, authUser, limit]);

  const handleEdit = useCallback((mealId: string) => {
    setEditingMealId(mealId);
    setShowImageId(null); // Close image preview if open
  }, []);
  
  const handleDelete = useCallback(async (mealId: string) => {
    if (window.confirm('Are you sure you want to delete this meal?')) {
      try {
        // Try both approaches - direct and store
        try {
          // Direct Supabase approach
          await deleteMealFromSupabase(mealId);
        } catch {
          // Fallback to store method
          await deleteMeal(mealId);
        }

        // Refresh everything
        refreshAll();
      } catch {
        alert('Failed to delete meal. Please try again.');
      }
    }
  }, [deleteMealFromSupabase, deleteMeal, refreshAll]);
  
  const handleSaveEdit = useCallback(async (mealId: string, updatedMeal: Omit<MealEditFormProps['meal'], 'id'>) => {
    try {
      // Convert app format to Supabase format
      const supabaseMeal = {
        meal_name: Array.isArray(updatedMeal.mealName)
          ? updatedMeal.mealName[0]
          : updatedMeal.mealName,
        ingredients: updatedMeal.ingredients,
        calories: updatedMeal.calories,
        protein: updatedMeal.protein,
        carbs: updatedMeal.carbs,
        fat: updatedMeal.fat,
      };

      try {
        // Direct Supabase approach
        await updateMealInSupabase(mealId, supabaseMeal);
      } catch {
        // Fallback to store method
        await updateMeal(mealId, updatedMeal);
      }

      // Refresh everything
      refreshAll();
      setEditingMealId(null);
    } catch {
      alert('Failed to update meal. Please try again.');
    }
  }, [updateMealInSupabase, updateMeal, refreshAll]);
  
  const handleAiUpdate = useCallback(async (description: string) => {
    // Get the currently edited meal
    const mealId = editingMealId;
    if (!mealId) return;

    const meal = displayMeals.find(m => m.id === mealId);
    if (!meal) return;

    try {
      // Create a special base64 encoding that indicates this is a text description
      const textBase64 = 'TEXTONLY_' + Buffer.from(description).toString('base64');

      // Begin the text-based analysis with the user's correction
      analyzeMutation.mutate(textBase64, {
        onSuccess: async (result) => {
          // Create the update object
          const updateData = {
            meal_name: (Array.isArray(result.mealName) ? result.mealName[0] : result.mealName) || meal.meal_name,
            ingredients: result.ingredients || meal.ingredients,
            calories: result.calories || meal.calories,
            protein: result.protein || meal.protein,
            carbs: result.carbs || meal.carbs,
            fat: result.fat || meal.fat,
          };

          // Update the meal with the new info
          try {
            await updateMealInSupabase(mealId, updateData);
            refreshAll();
          } catch {
            alert('Failed to update meal with AI results. Please try manually.');
          }
        },
        onError: () => {
          alert('AI analysis failed. Please try again or update manually.');
        }
      });

      // Close the edit form
      setEditingMealId(null);
    } catch {
      alert('Failed to update meal with AI. Please try again or update manually.');
    }
  }, [editingMealId, displayMeals, analyzeMutation, updateMealInSupabase, refreshAll]);
  
  const handleToggleImage = useCallback((mealId: string) => {
    if (showImageId === mealId) {
      setShowImageId(null);
    } else {
      setShowImageId(mealId);
      setEditingMealId(null); // Close editing if open
    }
  }, [showImageId]);

  return (
    <Card className={className}>
      {showTitle && (
        <CardHeader>
          <CardTitle className="text-xl">Meal History</CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] md:h-[500px] w-full p-4">
          {displayMeals.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No meals logged yet. Upload an image to start!</p>
          ) : (
            <div className="space-y-4">
              {displayMeals.map((meal: {
                id: string;
                mealName: string | string[];
                ingredients: string[];
                calories: number;
                protein: number;
                carbs: number;
                fat: number;
                timestamp: number;
                imageUrl?: string;
              }, index: number) => {
                // Format mealName (handle array case)
                const displayMealName = meal.mealName
                  ? Array.isArray(meal.mealName) ? meal.mealName.join(', ') : meal.mealName
                  : 'Analyzed Meal';
                  
                const timestamp = new Date(meal.timestamp || Date.now());

                return (
                  <React.Fragment key={meal.id}>
                    <div>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          {/* Meal Name and Time */}
                          <div className="flex items-center">
                            <p className="font-medium text-sm">{displayMealName}</p>
                            <span className="text-xs text-muted-foreground ml-2 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatTime(timestamp)}
                            </span>
                          </div>
                          
                          {/* Nutrition Info */}
                          <p className="text-xs text-muted-foreground mt-1">
                            Calories: {meal.calories} | Protein: {meal.protein}g | Carbs: {meal.carbs}g | Fat: {meal.fat}g
                          </p>
                          
                          {/* Ingredients (if available) */}
                          {meal.ingredients && meal.ingredients.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Ingredients: {meal.ingredients.join(', ')}
                            </p>
                          )}
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex space-x-1 ml-2">
                          {meal.imageUrl && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleImage(meal.id)}
                              className="h-7 w-7 rounded-full hover:bg-accent"
                            >
                              <ImageIcon className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(meal.id)}
                            className="h-7 w-7 rounded-full hover:bg-accent"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(meal.id)}
                            className="h-7 w-7 rounded-full hover:bg-accent text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Edit form - shown when editing */}
                      <AnimatePresence>
                        {editingMealId === meal.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden mt-2"
                          >
                            <MealEditForm
                              meal={meal}
                              onCancel={() => setEditingMealId(null)}
                              onSave={(updatedMeal) => handleSaveEdit(meal.id, updatedMeal)}
                              onAiUpdate={() => handleAiUpdate(meal.id)}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                      
                      {/* Image preview - shown when clicked */}
                      <AnimatePresence>
                        {showImageId === meal.id && meal.imageUrl && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden mt-2"
                          >
                            <div className="relative rounded-md overflow-hidden bg-black/5 dark:bg-white/5">
                              <OptimizedImage
                                src={meal.imageUrl}
                                alt={displayMealName}
                                width={400}
                                height={300}
                                className="w-full h-auto object-contain max-h-[250px]"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowImageId(null)}
                                className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/30 text-white hover:bg-black/50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    {index < displayMeals.length - 1 && <Separator className="my-3" />}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}