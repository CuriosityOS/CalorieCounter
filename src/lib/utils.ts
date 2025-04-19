import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(date);
}

// Calculate daily caloric needs based on user data
export function calculateDailyCalories(
  weight: number, // kg
  height: number, // cm
  age: number,
  gender: 'male' | 'female',
  activityLevel: number, // 1.2 (sedentary) to 1.9 (very active)
  goalOffset: number // -1000 (lose 1kg/week) to +1000 (gain 1kg/week)
): number {
  // BMR calculation using Mifflin-St Jeor Equation
  let bmr: number;
  
  if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }
  
  // Calculate TDEE (Total Daily Energy Expenditure)
  const tdee = bmr * activityLevel;
  
  // Adjust for goal (losing/gaining weight)
  return Math.round(tdee + goalOffset);
}

// Calculate macronutrient distribution
export function calculateMacros(
  calories: number,
  proteinRatio: number = 0.3, // 30% of calories from protein
  fatRatio: number = 0.3, // 30% of calories from fat
): { protein: number; carbs: number; fat: number } {
  // Protein: 4 calories per gram
  const protein = Math.round((calories * proteinRatio) / 4);
  
  // Fat: 9 calories per gram
  const fat = Math.round((calories * fatRatio) / 9);
  
  // Carbs: remaining calories, 4 calories per gram
  const carbsRatio = 1 - proteinRatio - fatRatio;
  const carbs = Math.round((calories * carbsRatio) / 4);
  
  return { protein, carbs, fat };
}

// Normalize a number between min and max (for slider ranges)
export function normalize(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// Convert goal offset to weekly weight change label
export function goalToLabel(goalOffset: number): string {
  const absValue = Math.abs(goalOffset);
  const weeklyChange = (absValue / 1000).toFixed(1);
  
  if (goalOffset < 0) {
    return `Lose ${weeklyChange} kg/week`;
  } else if (goalOffset > 0) {
    return `Gain ${weeklyChange} kg/week`;
  } else {
    return 'Maintain weight';
  }
}

// Determine if a date is today using local timezone
export function isToday(date: Date): boolean {
  const now = new Date();
  
  // Get dates in user's local timezone
  return (
    now.getFullYear() === date.getFullYear() &&
    now.getMonth() === date.getMonth() &&
    now.getDate() === date.getDate()
  );
}

// Get the start of current day in local timezone
export function getStartOfDayGmt8(): Date {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
}

// Map activity level value to descriptive string
export function activityLevelToString(level: number): string {
  if (level <= 1.2) return "Sedentary";
  if (level <= 1.375) return "Lightly Active";
  if (level <= 1.55) return "Moderately Active";
  if (level <= 1.725) return "Very Active";
  return "Extremely Active";
}

// Format number with commas for thousands
export function formatNumber(num: number | undefined): string {
  if (num === undefined || isNaN(num)) {
    return "0";
  }
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
