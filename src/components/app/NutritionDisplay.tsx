import React from 'react';

// Updated interface to match api.ts
interface NutritionData {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  mealName?: string | string[]; // Added
  ingredients?: string[]; // Added
}

interface NutritionDisplayProps {
  data: NutritionData | null;
  isLoading?: boolean;
  error?: Error | null;
}

const NutritionDisplay: React.FC<NutritionDisplayProps> = ({ data, isLoading, error }) => {
  if (isLoading) {
    return <div className="text-center p-4">Analyzing image...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">Error analyzing image: {error.message}</div>;
  }

  if (!data) {
    return <div className="text-center p-4 text-gray-500">Upload an image to see nutritional info.</div>;
  }

  // Format mealName (handle array case)
  const displayMealName = data.mealName
    ? Array.isArray(data.mealName) ? data.mealName.join(', ') : data.mealName
    : 'Meal Name Not Found';

  return (
    <div className="space-y-3"> {/* Increased spacing */}
      {/* Display Meal Name */}
      <h3 className="font-semibold text-lg">{displayMealName}</h3>

      {/* Display Ingredients */}
      <div>
        <h4 className="font-medium text-sm text-muted-foreground">Ingredients:</h4>
        <p className="text-sm">{data.ingredients?.join(', ') || 'N/A'}</p>
      </div>

      {/* Display Nutrition */}
      <div>
        <h4 className="font-medium text-sm text-muted-foreground">Estimated Nutrition:</h4>
        <ul className="text-sm list-disc list-inside">
          <li>Calories: {data.calories ?? 'N/A'}</li>
          <li>Protein: {data.protein ?? 'N/A'} g</li>
          <li>Carbs: {data.carbs ?? 'N/A'} g</li>
          <li>Fat: {data.fat ?? 'N/A'} g</li>
        </ul>
      </div>
    </div>
  );
};

export default NutritionDisplay;