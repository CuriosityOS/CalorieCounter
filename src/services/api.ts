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
  const model = 'google/gemini-2.0-flash-001'; // Updated model name

  // Updated prompt to request mealName and ingredients
  const promptText = `Analyze this food image. Identify the main dish(es) shown and list the primary ingredients. Provide estimated nutritional information (calories, protein, carbs, fat) for the entire portion shown. Respond ONLY with a valid JSON object containing keys: "mealName" (string or array of strings for the dish name(s)), "ingredients" (array of strings for primary ingredients), "calories" (number), "protein" (number), "carbs" (number), and "fat" (number). Example: {"mealName": "Cheeseburger", "ingredients": ["Beef Patty", "Bun", "Cheese", "Lettuce", "Tomato"], "calories": 800, "protein": 40, "carbs": 70, "fat": 45}`;


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
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: promptText }, // Use updated prompt
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