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
  console.log("[PARSER V4] Raw content received:", originalRawResponse);

  let jsonString = null;
  const firstBraceIndex = originalRawResponse.indexOf('{');
  const lastBraceIndex = originalRawResponse.lastIndexOf('}');

  if (firstBraceIndex !== -1 && lastBraceIndex !== -1 && lastBraceIndex > firstBraceIndex) {
    jsonString = originalRawResponse.substring(firstBraceIndex, lastBraceIndex + 1);
    console.log("[PARSER V4] Extracted potential JSON between first '{' and last '}':", jsonString);
  } else {
    console.warn("[PARSER V4] Could not find opening and closing braces '{...}' in the response.");
  }

  if (jsonString) {
    console.log("[PARSER V4] Attempting JSON.parse on extracted string.");
    try {
      const data = JSON.parse(jsonString);
      console.log("[PARSER V4] JSON.parse successful:", data);

      // Validate required fields + new mealName (optional but check type if present)
      if (typeof data.calories !== 'number' || typeof data.protein !== 'number' ||
          typeof data.carbs !== 'number' || typeof data.fat !== 'number' ||
          (data.mealName && typeof data.mealName !== 'string' && !Array.isArray(data.mealName)) || // Check mealName type
          (data.ingredients && !Array.isArray(data.ingredients)) // Check ingredients type
         ) {
        console.warn("[PARSER V4] Parsed JSON missing required fields or has incorrect types:", data);
        throw new Error('Parsed JSON missing required fields or has incorrect types.');
      }
      // Ensure ingredients is always an array if present
      if (data.ingredients && !Array.isArray(data.ingredients)) {
          data.ingredients = [String(data.ingredients)];
      }
      return { ...data, rawResponse: originalRawResponse };

    } catch (jsonError) {
      console.error(`[PARSER V4] JSON.parse failed:`, jsonError);
      console.error(`[PARSER V4] Content that failed JSON.parse:`, jsonString);
      console.warn("[PARSER V4] Falling back to text extraction due to JSON parse error.");
    }
  } else {
      console.warn("[PARSER V4] Skipping JSON.parse because extraction failed. Proceeding to fallback.");
  }

  // Fallback logic (less likely to work for structured data like mealName/ingredients)
  try {
    console.warn("[PARSER V4] Attempting fallback text extraction on raw content (may be less accurate)...");
    const caloriesMatch = originalRawResponse.match(/calories":?\s*(\d+)/i);
    const proteinMatch = originalRawResponse.match(/protein":?\s*(\d+)/i);
    const carbsMatch = originalRawResponse.match(/carbs":?\s*(\d+)/i);
    const fatMatch = originalRawResponse.match(/fat":?\s*(\d+)/i);
    // Basic fallback for mealName (less reliable)
    const mealNameMatch = originalRawResponse.match(/mealName":?\s*"([^"]+)"/i);

    if (caloriesMatch && proteinMatch && carbsMatch && fatMatch) {
       console.log("[PARSER V4] Fallback extraction successful (basic fields).");
      return {
        calories: parseInt(caloriesMatch[1], 10),
        protein: parseInt(proteinMatch[1], 10),
        carbs: parseInt(carbsMatch[1], 10),
        fat: parseInt(fatMatch[1], 10),
        mealName: mealNameMatch ? mealNameMatch[1] : undefined, // Add extracted mealName if found
        // Ingredients fallback is too complex/unreliable via regex
        rawResponse: originalRawResponse,
      };
    } else {
        console.warn("[PARSER V4] Fallback extraction failed.");
        throw new Error('Fallback text extraction failed.');
    }
  } catch { // Removed unused var
    console.error("[PARSER V4] Could not extract nutrition info via JSON or fallback:", originalRawResponse);
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
  const model = 'google/gemini-2.5-flash-preview'; // Updated to new model

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
      console.error("OpenRouter API Error:", response.status, errorInfo);
      throw new ApiError(`API request failed with status ${response.status}`, response.status, errorInfo);
    }

    const data: OpenRouterResponse = await response.json();

    if (!data.choices || data.choices.length === 0 || !data.choices[0].message?.content) {
      console.error("Invalid response structure from OpenRouter:", data);
      throw new ApiError('Invalid response structure from API.', 500, data);
    }

    const content = data.choices[0].message.content;
    return parseNutritionResponse(content);

  } catch (error) {
    console.error('Error calling OpenRouter API:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(`An unexpected error occurred: ${(error as Error).message}`, undefined, error);
  }
};