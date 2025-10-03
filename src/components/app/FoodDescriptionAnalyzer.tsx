'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Send } from 'lucide-react';
import { useAnalyzeImage } from '@/hooks/useAnalyzeImage';
import NutritionDisplay from './NutritionDisplay';
import { useQueryClient } from '@tanstack/react-query';

export default function FoodDescriptionAnalyzer() {
  const [description, setDescription] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  // We'll use the error state from the mutation
  const setError = useState<Error | null>(null)[1];
  const analyzeImageMutation = useAnalyzeImage();
  const queryClient = useQueryClient();
  
  const analyzeDescription = async () => {
    if (!description.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // We'll reuse the image analysis API but pass a special flag to indicate it's a text description
      // This is a hack, but it allows us to reuse the existing code for saving meals
      const mockBase64Image = 'TEXTONLY_' + Buffer.from(description).toString('base64');
      
      // Use the existing mutation to handle the analysis and meal saving
      analyzeImageMutation.mutate(mockBase64Image, {
        onSuccess: async () => {
          // Invalidate any queries that fetch meals to force a refresh
          queryClient.invalidateQueries({ queryKey: ['meals'] });
        }
      });
    } catch (err) {
      console.error('Error analyzing food description:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Food Description Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="food-description">
            Describe the food you ate
          </Label>
          <div className="mt-1">
            <Textarea
              id="food-description"
              placeholder="Example: I had a large chicken sandwich with cheese, lettuce, mayonnaise, and a side of french fries"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px] w-full"
            />
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button 
            onClick={analyzeDescription} 
            disabled={isAnalyzing || !description.trim()}
            className="flex items-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Analyze
              </>
            )}
          </Button>
        </div>
        
        <div className="mt-4">
          <NutritionDisplay
            data={analyzeImageMutation.data ?? null}
            isLoading={analyzeImageMutation.isPending}
            error={analyzeImageMutation.error}
          />
        </div>
      </CardContent>
    </Card>
  );
}