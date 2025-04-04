'use client';

import React from 'react';
import ImageUploader from './ImageUploader';
import NutritionDisplay from './NutritionDisplay';
import MealHistory from './MealHistory';
import { useAnalyzeImage } from '@/hooks/useAnalyzeImage';


const UserDashboard: React.FC = () => {
  const analyzeImageMutation = useAnalyzeImage();

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

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Your Nutrition Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section>
          <ImageUploader onUpload={handleImageUpload} isAnalyzing={isAnalyzing} />
        </section>
        <section className="bg-card p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Analysis Result</h2>
          <NutritionDisplay
            data={analysisResult ?? null}
            isLoading={isAnalyzing}
            error={analysisError}
          />
        </section>
        <section className="md:col-span-2 bg-card p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Meal History</h2>
          <MealHistory />
        </section>
      </div>
      <div className="mt-8 text-center">
        <p>Settings Placeholder</p>
      </div>
    </div>
  );
};

export default UserDashboard;