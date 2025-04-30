# Fix: Real-time Updates for Meal Data

## Problem
When users add food items, the changes don't immediately appear in the nutrition dashboard or today's meal section until the page is refreshed.

## Root Causes
1. **Inconsistent Data Fetching Patterns**:
   - The `useMeals` hook was using React Query for data fetching, but components like `NutritionDashboard` and `MealHistory` were fetching data directly from Supabase
   - This meant React Query's cache invalidation wasn't affecting these components

2. **Separate Data Sources**:
   - `NutritionDashboard` used direct Supabase queries
   - `MealHistory` used direct Supabase queries 
   - These components were not connected to the React Query cache that was being invalidated when meals were added

3. **React Query Configuration**:
   - The staleTime was set to 30 seconds, which meant data would not be automatically refreshed for 30 seconds
   - No automatic refetch on window focus or polling was configured

## Solutions Implemented

1. **Unified Data Source**: 
   - Modified `NutritionDashboard` to use the `useMeals` hook instead of direct Supabase queries
   - Changed `MealHistory` to use the meal data from the `useMeals` hook
   - Removed redundant state variables and direct Supabase queries

2. **Enhanced React Query Configuration**:
   - Reduced staleTime from 30 seconds to 1 second for more responsive updates
   - Added refetchOnWindowFocus: true to refresh data when the user returns to the tab
   - Added refetchInterval: 5000 to poll for changes every 5 seconds

3. **Added Integration Test**:
   - Created a new test to verify that adding a meal immediately updates both the nutrition dashboard and meal history

## Files Modified

1. `/src/components/app/NutritionDashboard.tsx`
   - Removed direct Supabase query
   - Now uses `useMeals` hook and the `dailyTotals` for nutrition circles

2. `/src/components/app/MealHistory.tsx`
   - Removed direct Supabase query for fetching meals
   - Now uses the `todayMeals` from the `useMeals` hook

3. `/src/hooks/useMeals.ts`
   - Enhanced React Query configuration for more responsive updates
   - Added polling and window focus refetching

4. `/src/__tests__/meals-integration.test.tsx`
   - Added new test to verify real-time updates

## Benefits

1. **Improved User Experience**:
   - Immediate feedback when adding or modifying meals
   - No need to refresh the page to see changes

2. **More Maintainable Code**:
   - Single source of truth for meal data
   - Consistent data fetching pattern
   - Leverages React Query's caching and invalidation system

3. **Reduced Redundancy**:
   - Removed duplicate data fetching logic
   - Simplified component code