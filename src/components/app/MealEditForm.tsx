'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, X, Info } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface MealEditFormProps {
  meal: {
    id: string;
    mealName: string | string[];
    ingredients?: string[];
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    imageUrl?: string;
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
  onAiUpdate: (description: string) => void;
}

export default function MealEditForm({ meal, onCancel, onSave, onAiUpdate }: MealEditFormProps) {
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
    if (aiDescription.trim()) {
      onAiUpdate(aiDescription);
    }
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
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-2 py-1 text-sm rounded border bg-background"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Calories</label>
            <Input
              type="number"
              value={calories}
              onChange={(e) => setCalories(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-2 py-1 text-sm rounded border bg-background"
            />
          </div>
          
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Protein (g)</label>
            <Input
              type="number"
              value={protein}
              onChange={(e) => setProtein(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-2 py-1 text-sm rounded border bg-background"
            />
          </div>
          
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Carbs (g)</label>
            <Input
              type="number"
              value={carbs}
              onChange={(e) => setCarbs(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-2 py-1 text-sm rounded border bg-background"
            />
          </div>
          
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Fat (g)</label>
            <Input
              type="number"
              value={fat}
              onChange={(e) => setFat(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-2 py-1 text-sm rounded border bg-background"
            />
          </div>
        </div>
        
        <div className="pt-2">
          <label className="text-xs text-muted-foreground mb-1 block flex items-center">
            <Info className="h-3 w-3 mr-1" />
            AI Description Update
          </label>
          <div className="flex flex-col space-y-2">
            <Textarea
              value={aiDescription}
              onChange={(e) => setAiDescription(e.target.value)}
              placeholder="Describe corrections or details about this meal. Example: 'This is actually chicken, not pork' or 'Add broccoli, remove tomatoes'"
              className="flex-1 px-2 py-1 text-sm rounded border bg-background h-20"
            />
            <Button
              size="sm"
              onClick={handleAiUpdate}
              variant="outline"
              className="text-xs h-7 self-end"
              disabled={!aiDescription.trim()}
            >
              Update with AI
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}