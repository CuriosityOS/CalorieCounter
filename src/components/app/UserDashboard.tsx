'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import NutritionDashboard from './NutritionDashboard';
import { useAnalyzeImage } from '@/hooks/useAnalyzeImage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UtensilsCrossed, Camera } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils';

// Lazy load heavy components
const ImageUploader = dynamic(() => import('./ImageUploader'), {
  loading: () => <div className="h-48 animate-pulse bg-secondary/20 rounded-lg" />,
});

const NutritionDisplay = dynamic(() => import('./NutritionDisplay'), {
  loading: () => <div className="h-32 animate-pulse bg-secondary/20 rounded-lg" />,
});

const MealHistory = dynamic(() => import('./MealHistory'), {
  loading: () => <div className="h-96 animate-pulse bg-secondary/20 rounded-lg" />,
});

const FoodDescriptionAnalyzer = dynamic(() => import('./FoodDescriptionAnalyzer'), {
  loading: () => <div className="h-48 animate-pulse bg-secondary/20 rounded-lg" />,
});

const ManualFoodEntry = dynamic(() => import('./ManualFoodEntry'), {
  loading: () => <div className="h-48 animate-pulse bg-secondary/20 rounded-lg" />,
});

export default function UserDashboard() {
  const analyzeImageMutation = useAnalyzeImage();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Force prefetch of key pages
  useEffect(() => {
    router.prefetch('/history');
    router.prefetch('/customize');
  }, [router]);

  const {
    data: analysisResult,
    isPending: isAnalyzing,
    error: analysisError,
    mutate: triggerAnalysis,
  } = analyzeImageMutation;

  const handleImageUpload = useCallback((base64Image: string) => {
    triggerAnalysis(base64Image);
  }, [triggerAnalysis]);

  const containerAnimation = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemAnimation = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerAnimation}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Nutrition overview */}
      <motion.div variants={itemAnimation}>
        <NutritionDashboard
          onDateChange={setSelectedDate}
          selectedDate={selectedDate}
        />
      </motion.div>
      
      {/* Debug components removed */}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Food Tracking Methods */}
        <motion.div variants={itemAnimation} className="space-y-6">
          {/* Image Analysis */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <Camera className="w-5 h-5 mr-2 text-primary" />
                Analyze Food Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUploader onUpload={handleImageUpload} isAnalyzing={isAnalyzing} />
              
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-3">Analysis Result</h3>
                <NutritionDisplay
                  data={analysisResult ?? null}
                  isLoading={isAnalyzing}
                  error={analysisError}
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Text Description Analysis */}
          <FoodDescriptionAnalyzer />
          
          {/* Manual Food Entry */}
          <ManualFoodEntry />
        </motion.div>
        
        {/* Today's Meals */}
        <motion.div variants={itemAnimation}>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <UtensilsCrossed className="w-5 h-5 mr-2 text-primary" />
                Meals for {formatDate(selectedDate)}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <MealHistory 
                limit={5} 
                showTitle={false} 
                className="border-0 shadow-none"
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}