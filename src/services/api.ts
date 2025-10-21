interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealName?: string | string[]; // Added: Name of the dish(es)
  ingredients?: string[]; // Renamed from identifiedItems
  rawResponse?: string;
}

interface OpenRouterChoice {
  message: {
    role: string;
    content: string;
  };
}

interface OpenRouterResponse {
  id: string;
  model: string;
  choices: OpenRouterChoice[];
}

class ApiError extends Error {
  status?: number;
  info?: unknown; // Use unknown instead of any

  constructor(message: string, status?: number, info?: unknown) { // Use unknown instead of any
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.info = info;
  }
}

const parseNutritionResponse = (rawContent: string): NutritionInfo => {
  const originalRawResponse = rawContent;

  let jsonString = null;
  const firstBraceIndex = originalRawResponse.indexOf('{');
  const lastBraceIndex = originalRawResponse.lastIndexOf('}');

  if (firstBraceIndex !== -1 && lastBraceIndex !== -1 && lastBraceIndex > firstBraceIndex) {
    jsonString = originalRawResponse.substring(firstBraceIndex, lastBraceIndex + 1);
  }

  if (jsonString) {
    try {
      const data = JSON.parse(jsonString);

      // Validate required fields + new mealName (optional but check type if present)
      if (typeof data.calories !== 'number' || typeof data.protein !== 'number' ||
          typeof data.carbs !== 'number' || typeof data.fat !== 'number' ||
          (data.mealName && typeof data.mealName !== 'string' && !Array.isArray(data.mealName)) || // Check mealName type
          (data.ingredients && !Array.isArray(data.ingredients)) // Check ingredients type
         ) {
        throw new Error('Parsed JSON missing required fields or has incorrect types.');
      }
      // Ensure ingredients is always an array if present
      if (data.ingredients && !Array.isArray(data.ingredients)) {
          data.ingredients = [String(data.ingredients)];
      }
      return { ...data, rawResponse: originalRawResponse };

    } catch {
      // JSON parsing failed, fall through to regex extraction
    }
  }

  // Fallback logic (less likely to work for structured data like mealName/ingredients)
  try {
    const caloriesMatch = originalRawResponse.match(/calories":?\s*(\d+(?:\.\d+)?)/i);
    const proteinMatch = originalRawResponse.match(/protein":?\s*(\d+(?:\.\d+)?)/i);
    const carbsMatch = originalRawResponse.match(/carbs":?\s*(\d+(?:\.\d+)?)/i);
    const fatMatch = originalRawResponse.match(/fat":?\s*(\d+(?:\.\d+)?)/i);
    // Basic fallback for mealName (less reliable)
    const mealNameMatch = originalRawResponse.match(/mealName":?\s*"([^"]+)"/i);

    if (caloriesMatch && proteinMatch && carbsMatch && fatMatch) {
      return {
        calories: parseFloat(caloriesMatch[1]),
        protein: parseFloat(proteinMatch[1]),
        carbs: parseFloat(carbsMatch[1]),
        fat: parseFloat(fatMatch[1]),
        mealName: mealNameMatch ? mealNameMatch[1] : undefined, // Add extracted mealName if found
        // Ingredients fallback is too complex/unreliable via regex
        rawResponse: originalRawResponse,
      };
    } else {
        throw new Error('Fallback text extraction failed.');
    }
  } catch { // Removed unused var
    throw new Error(`Failed to parse nutrition information from AI response. Raw: ${originalRawResponse}`);
  }
};


export const analyzeImage = async (imageBase64: string): Promise<NutritionInfo> => {
  const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5000';
  const appTitle = process.env.NEXT_PUBLIC_APP_TITLE || 'Cal AI Clone';

  if (!apiKey) {
    throw new ApiError('OpenRouter API key is not configured in environment variables.', 500);
  }

  const apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
  const model = 'google/gemini-2.5-flash'; // Fixed model name - removed preview suffix

  // Check if this is a text-only analysis request
  const isTextAnalysis = imageBase64.startsWith('TEXTONLY_');
  
  // Prepare prompt based on the type of analysis
  let promptText;
  if (isTextAnalysis) {
    // Extract the actual text from the Base64 string
    const encodedText = imageBase64.substring('TEXTONLY_'.length);
    const decodedText = Buffer.from(encodedText, 'base64').toString('utf-8');
    
    // Improved prompt for text description analysis with portion considerations
    promptText = `Based on this food description: "${decodedText}", analyze the meal carefully.

TASKS:
1. Identify the main dish(es) and estimate the portion size based on the description.
2. List all mentioned ingredients and infer likely ingredients if not explicitly stated.
3. If the description mentions any sizing (small, medium, large) or quantities, use that information.
4. Provide realistic nutritional information for the described portion.

If the text includes any corrections or updates to a previous analysis, prioritize those changes.

Respond ONLY with a valid JSON object containing:
- "mealName": string or array of strings for dish name(s)
- "ingredients": array of strings listing primary ingredients 
- "portionSize": estimated portion size (small/medium/large)
- "calories": number (total calories)
- "protein": number (grams)
- "carbs": number (grams) 
- "fat": number (grams)

Example: {"mealName": "Salmon with Rice and Vegetables", "ingredients": ["Salmon Fillet", "Brown Rice", "Broccoli", "Carrots", "Olive Oil"], "portionSize": "medium", "calories": 550, "protein": 35, "carbs": 45, "fat": 25}`;
  } else {
    // Improved prompt for image analysis with portion size and scale considerations
    promptText = `Analyze this food image carefully. 

TASKS:
1. Identify the main dish(es) shown and estimate the portion size (small, medium, large).
2. List all visible primary ingredients.
3. Consider the scale/size of the food relative to plate or utensils if visible.
4. Provide realistic nutritional information for the exact portion shown.

Considerations for accurate estimates:
- Look for size references (plates, utensils, hands) to gauge portion size
- Consider standard serving sizes for similar dishes
- Account for visible oils, sauces, and toppings
- Be conservative with estimates if uncertain

Respond ONLY with a valid JSON object containing:
- "mealName": string or array of strings for dish name(s)
- "ingredients": array of strings listing primary ingredients
- "portionSize": estimated portion size (small/medium/large)
- "calories": number (total calories)
- "protein": number (grams)
- "carbs": number (grams)
- "fat": number (grams)

Example: {"mealName": "Cheeseburger with Fries", "ingredients": ["Beef Patty", "Burger Bun", "Cheese", "Lettuce", "Tomato", "French Fries"], "portionSize": "large", "calories": 950, "protein": 35, "carbs": 80, "fat": 55}`;
  }


  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': siteUrl,
        'X-Title': appTitle,
      },
      body: JSON.stringify({
        model: model,
        temperature: 0, // Set temperature to 0 for maximum determinism/precision
        messages: [
          {
            role: 'user',
            content: isTextAnalysis 
              ? [{ type: 'text', text: promptText }]  // Text-only analysis
              : [  // Image analysis
                  { type: 'text', text: promptText },
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:image/jpeg;base64,${imageBase64}`
                    }
                  }
                ]
          }
        ],
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let errorInfo = {};
      try {
        errorInfo = JSON.parse(errorBody);
      } catch { // Removed unused var
        errorInfo = { rawError: errorBody };
      }
      throw new ApiError(`API request failed with status ${response.status}`, response.status, errorInfo);
    }

    const data: OpenRouterResponse = await response.json();

    if (!data.choices || data.choices.length === 0 || !data.choices[0].message?.content) {
      throw new ApiError('Invalid response structure from API.', 500, data);
    }

    const content = data.choices[0].message.content;
    return parseNutritionResponse(content);

  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(`An unexpected error occurred: ${(error as Error).message}`, undefined, error);
  }
};