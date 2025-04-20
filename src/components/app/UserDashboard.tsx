'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import ImageUploader from './ImageUploader';
import NutritionDisplay from './NutritionDisplay';
import MealHistory from './MealHistory';
import NutritionDashboard from './NutritionDashboard';
import FoodDescriptionAnalyzer from './FoodDescriptionAnalyzer';
import ManualFoodEntry from './ManualFoodEntry';
import { useAnalyzeImage } from '@/hooks/useAnalyzeImage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UtensilsCrossed, Camera } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils';

export default function UserDashboard() {
  const analyzeImageMutation = useAnalyzeImage();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Force prefetch of key pages
  useEffect(() => {
    router.prefetch('/history');
    router.prefetch('/customize');
    console.log('Prefetching history and customize routes');
  }, [router]);

  const {
    data: analysisResult,
    isPending: isAnalyzing,
    error: analysisError,
    mutate: triggerAnalysis,
  } = analyzeImageMutation;

  const handleImageUpload = (base64Image: string) => {
    console.log("Image ready for analysis, triggering mutation...");
    triggerAnalysis(base64Image);
  };

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
                selectedDate={selectedDate}
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}