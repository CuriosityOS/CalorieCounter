'use client';

import React, { memo, useMemo } from 'react';
import CircularProgress from './CircularProgress';
import { formatNumber } from '@/lib/utils';
import { Pizza, Wheat, Beef, Droplet } from 'lucide-react';

interface NutritionCirclesProps {
  dailyNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  targets: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

const NutritionCircles = memo(function NutritionCircles({ dailyNutrition, targets }: NutritionCirclesProps) {
  // Calculate progress percentages
  const progress = useMemo(() => ({
    calories: Math.min(100, (dailyNutrition.calories / targets.calories) * 100),
    protein: Math.min(100, (dailyNutrition.protein / targets.protein) * 100),
    carbs: Math.min(100, (dailyNutrition.carbs / targets.carbs) * 100),
    fat: Math.min(100, (dailyNutrition.fat / targets.fat) * 100),
  }), [dailyNutrition, targets]);
  
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
      {/* Calories Circle */}
      <div className="flex flex-col items-center">
        <CircularProgress
          value={progress.calories}
          color="var(--primary)"
          valueText={formatNumber(dailyNutrition.calories)}
          maxValueText={formatNumber(targets.calories)}
          size={100}
          strokeWidth={6}
        />
        <div className="mt-2 flex items-center">
          <Pizza className="w-4 h-4 mr-1 text-primary" />
          <span className="text-sm font-medium">Calories</span>
        </div>
      </div>
      
      {/* Protein Circle */}
      <div className="flex flex-col items-center">
        <CircularProgress
          value={progress.protein}
          color="var(--chart-5)"
          valueText={`${formatNumber(dailyNutrition.protein)}g`}
          maxValueText={`${formatNumber(targets.protein)}g`}
          size={100}
          strokeWidth={6}
        />
        <div className="mt-2 flex items-center">
          <Beef className="w-4 h-4 mr-1 text-chart-5" />
          <span className="text-sm font-medium">Protein</span>
        </div>
      </div>
      
      {/* Carbs Circle */}
      <div className="flex flex-col items-center">
        <CircularProgress
          value={progress.carbs}
          color="var(--chart-3)"
          valueText={`${formatNumber(dailyNutrition.carbs)}g`}
          maxValueText={`${formatNumber(targets.carbs)}g`}
          size={100}
          strokeWidth={6}
        />
        <div className="mt-2 flex items-center">
          <Wheat className="w-4 h-4 mr-1 text-chart-3" />
          <span className="text-sm font-medium">Carbs</span>
        </div>
      </div>
      
      {/* Fat Circle */}
      <div className="flex flex-col items-center">
        <CircularProgress
          value={progress.fat}
          color="var(--chart-2)"
          valueText={`${formatNumber(dailyNutrition.fat)}g`}
          maxValueText={`${formatNumber(targets.fat)}g`}
          size={100}
          strokeWidth={6}
        />
        <div className="mt-2 flex items-center">
          <Droplet className="w-4 h-4 mr-1 text-chart-2" />
          <span className="text-sm font-medium">Fat</span>
        </div>
      </div>
    </div>
  );
});

export default NutritionCircles;
