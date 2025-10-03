import { describe, expect, it } from 'vitest';

import {
  activityLevelToString,
  calculateDailyCalories,
  calculateMacros,
  formatDate,
  formatNumber,
  formatTime,
  goalToLabel,
  normalize,
} from '@/lib/utils';

describe('utils', () => {
  it('calculates daily calories for male and female profiles', () => {
    const maleCalories = calculateDailyCalories(80, 180, 30, 'male', 1.55, -250);
    const femaleCalories = calculateDailyCalories(65, 165, 28, 'female', 1.375, 200);

    expect(maleCalories).toBe(2509);
    expect(femaleCalories).toBe(2098);
  });

  it('calculates macronutrients with default ratios', () => {
    const macros = calculateMacros(2000);
    expect(macros).toEqual({ protein: 150, carbs: 200, fat: 67 });
  });

  it('calculates macronutrients with custom ratios', () => {
    const macros = calculateMacros(1800, 0.35, 0.25);
    expect(macros).toEqual({ protein: 158, carbs: 180, fat: 50 });
  });

  it('returns descriptive goal labels', () => {
    expect(goalToLabel(-750)).toBe('Lose 0.8 kg/week');
    expect(goalToLabel(500)).toBe('Gain 0.5 kg/week');
    expect(goalToLabel(0)).toBe('Maintain weight');
  });

  it('normalizes values within range boundaries', () => {
    expect(normalize(5, 0, 10)).toBe(5);
    expect(normalize(-2, 0, 10)).toBe(0);
    expect(normalize(20, 0, 10)).toBe(10);
  });

  it('formats numbers, dates, and times consistently', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
    expect(formatNumber(undefined)).toBe('0');

    const sampleDate = new Date('2024-03-15T12:30:00');
    expect(formatDate(sampleDate)).toContain('Mar');
    expect(formatDate(sampleDate)).toContain('2024');
    expect(formatTime(sampleDate)).toMatch(/\d{1,2}:\d{2} [AP]M/);
  });

  it('maps activity level to a readable label', () => {
    expect(activityLevelToString(1.1)).toBe('Sedentary');
    expect(activityLevelToString(1.3)).toBe('Lightly Active');
    expect(activityLevelToString(1.5)).toBe('Moderately Active');
    expect(activityLevelToString(1.6)).toBe('Very Active');
    expect(activityLevelToString(1.9)).toBe('Extremely Active');
  });
});
