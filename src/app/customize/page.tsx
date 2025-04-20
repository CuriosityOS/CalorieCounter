'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { useAppStore } from '@/store/useAppStore';
import { 
  calculateDailyCalories, 
  activityLevelToString, 
  goalToLabel, 
} from '@/lib/utils';
import { useWeightHistory } from '@/hooks/useWeightHistory';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronRight, Scale, Dumbbell, Calculator, Send, BarChart4 } from 'lucide-react';
// Emergency form removed

export default function CustomizePage() {
  // Make this an explicit client component
  if (typeof window === 'undefined') {
    return null; // Will never render this on server
  }
  
  const { user: authUser } = useAuth();
  const updateNutritionGoals = useAppStore((state) => state.updateNutritionGoals);
  const updateUserProfile = useAppStore((state) => state.updateUserProfile);
  const refreshAll = useAppStore((state) => state.refreshAll);
  const userPreferences = useAppStore((state) => state.userPreferences);
  const { chartData, addWeightEntry } = useWeightHistory();
  
  // Use data from user profile directly
  const { user: userProfile, refreshUserProfile } = useUser();
  
  // UI states - declare these first to avoid reference errors
  const [manualMacros, setManualMacros] = useState<boolean>(false);
  const [formChanged, setFormChanged] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Weight tracking
  const [newWeight, setNewWeight] = useState<string>('');
  
  // Form states - sync with user profile
  const [weight, setWeight] = useState<number>(70);
  const [height, setHeight] = useState<number>(170);
  const [age, setAge] = useState<number>(30);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [activityLevel, setActivityLevel] = useState<number>(1.375);
  const [goalOffset, setGoalOffset] = useState<number>(0);
  
  // Calculated targets
  const [targetCalories, setTargetCalories] = useState<number>(2000);
  const [targetProtein, setTargetProtein] = useState<number>(150);
  const [targetCarbs, setTargetCarbs] = useState<number>(200);
  const [targetFat, setTargetFat] = useState<number>(65);
  
  // Sync form state with user profile when it loads or changes
  useEffect(() => {
    if (userProfile) {
      console.log("Loading values from user profile:", userProfile);
      
      // Update form values from user profile
      setWeight(userProfile.weight || 70);
      setHeight(userProfile.height || 170);
      setAge(userProfile.age || 30);
      setGender(userProfile.gender || 'male');
      setActivityLevel(userProfile.activity_level || 1.375);
      setGoalOffset(userProfile.goal_offset || 0);
      
      // Update targets
      if (!manualMacros) {
        setTargetCalories(userProfile.target_calories || 2000);
        setTargetProtein(userProfile.target_protein || 150);
        setTargetCarbs(userProfile.target_carbs || 200);
        setTargetFat(userProfile.target_fat || 65);
      }
      
      // Reset form changed flag since we're syncing with DB values
      setFormChanged(false);
    }
  }, [userProfile, manualMacros]);
  
  // Debug logs for component state
  useEffect(() => {
    console.log("Customize Page - Current State:", {
      authUser: authUser?.id,
      userProfile: userProfile ? "found" : "not found",
      userProfileDetails: userProfile,
      formState: {
        weight,
        height,
        age,
        gender,
        activityLevel,
        goalOffset,
        targetCalories,
        targetProtein,
        targetCarbs,
        targetFat
      }
    });
  }, [
    authUser, 
    userProfile, 
    weight, 
    height, 
    age, 
    gender, 
    activityLevel, 
    goalOffset, 
    targetCalories, 
    targetProtein, 
    targetCarbs, 
    targetFat
  ]);
  
  // Calculate targets when inputs change
  useEffect(() => {
    if (!manualMacros) {
      const calories = calculateDailyCalories(weight, height, age, gender, activityLevel, goalOffset);
      const protein = Math.round(weight * 1.6); // ~1.6g protein per kg bodyweight
      const fat = Math.round(weight * 0.8); // ~0.8g fat per kg bodyweight
      const carbsCalories = calories - (protein * 4) - (fat * 9);
      const carbs = Math.max(50, Math.round(carbsCalories / 4)); // Min 50g carbs, rest from calculation
      
      setTargetCalories(calories);
      setTargetProtein(protein);
      setTargetCarbs(carbs);
      setTargetFat(fat);
    }
    
    setFormChanged(true);
  }, [weight, height, age, gender, activityLevel, goalOffset, manualMacros]);
  
  // Handle manual changes to calorie/macro targets
  const handleManualChange = (type: string, value: number) => {
    setManualMacros(true);
    switch (type) {
      case 'calories':
        setTargetCalories(value);
        break;
      case 'protein':
        setTargetProtein(value);
        break;
      case 'carbs':
        setTargetCarbs(value);
        break;
      case 'fat':
        setTargetFat(value);
        break;
    }
    setFormChanged(true);
  };
  
  // Save profile to Supabase
  const handleSaveProfile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Saving profile to Supabase");
      
      // Combine updates into a single call for better performance
      const profileData = {
        weight,
        height,
        age,
        gender,
        activity_level: activityLevel,
        goal_offset: goalOffset,
        target_calories: targetCalories,
        target_protein: targetProtein,
        target_carbs: targetCarbs,
        target_fat: targetFat
      };
      
      console.log("Saving profile data:", profileData);
      
      // Use Supabase directly - this is the most reliable method
      const { supabase } = await import('@/lib/supabase-client');
      if (!authUser) {
        throw new Error("No authenticated user");
      }
      
      // Direct update
      const { data, error } = await supabase
        .from('users')
        .update(profileData)
        .eq('id', authUser.id)
        .select()
        .single();
        
      if (error) {
        console.error("Supabase update failed:", error);
        throw error;
      }
      
      console.log("Profile updated successfully:", data);
      
      // Force-refresh the user profile and all data
      try {
        await refreshUserProfile();
        await refreshAll();
      } catch (refreshError) {
        console.error("Error refreshing data:", refreshError);
        // Continue even if refresh fails - the data was saved successfully
      }
      
      console.log("Data refreshed. Profile saved successfully.");
      setSaveSuccess(true);
      setFormChanged(false);
      
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Failed to save profile:', err);
      setError(`Failed to save profile: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Add new weight entry
  const handleAddWeight = () => {
    const weightValue = parseFloat(newWeight);
    if (isNaN(weightValue) || weightValue <= 0) {
      return;
    }
    
    addWeightEntry(weightValue);
    setNewWeight('');
    
    // Also update current weight
    setWeight(weightValue);
    setFormChanged(true);
  };
  
  return (
    <div className="container px-4 py-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Customize</h1>
            <p className="text-muted-foreground mt-1">
              Personalize your nutrition goals and track your progress
            </p>
          </div>
        </div>
        
        <Tabs defaultValue="calculator">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="calculator" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              <span>Calculator</span>
            </TabsTrigger>
            <TabsTrigger value="weight" className="flex items-center gap-2">
              <Scale className="h-4 w-4" />
              <span>Weight Tracker</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="calculator" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Dumbbell className="w-5 h-5 mr-2 text-primary" />
                  Your Information
                </CardTitle>
                <CardDescription>
                  Provide your details to calculate your recommended intake
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="weight">Weight (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        value={weight || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || val === null) {
                            setWeight(0); 
                          } else {
                            const num = parseFloat(val);
                            setWeight(isNaN(num) ? 0 : Math.max(0, Math.min(300, num)));
                          }
                        }}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="height">Height (cm)</Label>
                      <Input
                        id="height"
                        type="number"
                        value={height || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || val === null) {
                            setHeight(0);
                          } else {
                            const num = parseFloat(val);
                            setHeight(isNaN(num) ? 0 : Math.max(0, Math.min(250, num)));
                          }
                        }}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="age">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        value={age || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || val === null) {
                            setAge(0);
                          } else {
                            const num = parseInt(val);
                            setAge(isNaN(num) ? 0 : Math.max(0, Math.min(120, num)));
                          }
                        }}
                      />
                    </div>
                    
                    <div>
                      <Label>Gender</Label>
                      <div className="flex space-x-4 mt-2">
                        <Button
                          type="button"
                          variant={gender === 'male' ? "default" : "outline"}
                          onClick={() => setGender('male')}
                        >
                          Male
                        </Button>
                        <Button
                          type="button"
                          variant={gender === 'female' ? "default" : "outline"}
                          onClick={() => setGender('female')}
                        >
                          Female
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Activity Level</Label>
                        <span className="text-sm font-medium text-primary">
                          {activityLevelToString(activityLevel)}
                        </span>
                      </div>
                      <Slider
                        value={[activityLevel]}
                        min={1.2}
                        max={1.9}
                        step={0.05}
                        onValueChange={(values) => setActivityLevel(values[0])}
                        className="py-4"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Sedentary</span>
                        <span>Extremely Active</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Goal</Label>
                        <span className="text-sm font-medium text-primary">
                          {goalToLabel(goalOffset)}
                        </span>
                      </div>
                      <Slider
                        value={[goalOffset]}
                        min={-1000}
                        max={1000}
                        step={50}
                        onValueChange={(values) => setGoalOffset(values[0])}
                        className="py-4"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Lose 1kg/week</span>
                        <span>Maintain</span>
                        <span>Gain 1kg/week</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Nutrition Targets</h3>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="manual-targets"
                        checked={manualMacros}
                        onCheckedChange={setManualMacros}
                      />
                      <Label htmlFor="manual-targets" className="cursor-pointer">
                        Manual
                      </Label>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="target-calories">Daily Calories</Label>
                      <Input
                        id="target-calories"
                        type="number"
                        value={targetCalories || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || val === null) {
                            handleManualChange('calories', 0);
                          } else {
                            const num = parseInt(val);
                            handleManualChange('calories', isNaN(num) ? 0 : Math.max(500, Math.min(10000, num)));
                          }
                        }}
                        disabled={!manualMacros}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="target-protein">Protein (g)</Label>
                      <Input
                        id="target-protein"
                        type="number"
                        value={targetProtein || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || val === null) {
                            handleManualChange('protein', 0);
                          } else {
                            const num = parseInt(val);
                            handleManualChange('protein', isNaN(num) ? 0 : Math.max(20, Math.min(500, num)));
                          }
                        }}
                        disabled={!manualMacros}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="target-carbs">Carbs (g)</Label>
                      <Input
                        id="target-carbs"
                        type="number"
                        value={targetCarbs || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || val === null) {
                            handleManualChange('carbs', 0);
                          } else {
                            const num = parseInt(val);
                            handleManualChange('carbs', isNaN(num) ? 0 : Math.max(20, Math.min(1000, num)));
                          }
                        }}
                        disabled={!manualMacros}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="target-fat">Fat (g)</Label>
                      <Input
                        id="target-fat"
                        type="number"
                        value={targetFat || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || val === null) {
                            handleManualChange('fat', 0);
                          } else {
                            const num = parseInt(val);
                            handleManualChange('fat', isNaN(num) ? 0 : Math.max(10, Math.min(300, num)));
                          }
                        }}
                        disabled={!manualMacros}
                      />
                    </div>
                  </div>
                </div>
                
                {error && (
                  <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                    {error}
                  </div>
                )}
                
                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={!formChanged || loading}
                    className="flex items-center"
                  >
                    {loading ? (
                      <>Loading...</>
                    ) : saveSuccess ? (
                      <>Saved!</>
                    ) : (
                      <>
                        Save Changes
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="weight" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart4 className="w-5 h-5 mr-2 text-primary" />
                  Weight History
                </CardTitle>
                <CardDescription>
                  Track your weight over time
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-end gap-4">
                  <div className="flex-1">
                    <Label htmlFor="new-weight">Add New Weight Entry (kg)</Label>
                    <div className="flex mt-1">
                      <Input
                        id="new-weight"
                        type="number"
                        placeholder="Enter weight"
                        value={newWeight}
                        onChange={(e) => setNewWeight(e.target.value)}
                        className="mr-2"
                      />
                      <Button
                        onClick={handleAddWeight}
                        disabled={!newWeight || isNaN(parseFloat(newWeight)) || parseFloat(newWeight) <= 0}
                      >
                        <Send className="h-4 w-4" />
                        <span className="sr-only md:not-sr-only md:ml-2">Add</span>
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-muted/40 p-4 rounded-lg flex flex-col items-center md:items-start">
                    <span className="text-sm text-muted-foreground">Current Weight</span>
                    <span className="text-2xl font-bold">{weight || 0} kg</span>
                  </div>
                </div>
                
                <div className="h-[300px] w-full">
                  {chartData && chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData}
                        margin={{ top: 5, right: 50, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(date) => {
                            const d = new Date(date);
                            return `${d.getDate()}/${d.getMonth() + 1}`;
                          }}
                        />
                        <YAxis
                          domain={[
                            (dataMin) => {
                              // Handle empty data case
                              if (!chartData.length) return 0;
                              
                              // If only one entry, create a reasonable range around it
                              if (chartData.length === 1) {
                                const weight = chartData[0]?.weight || 70;
                                // Set min to 90% of value, rounded down to nearest 5
                                return Math.floor((weight * 0.9) / 5) * 5;
                              }
                              
                              // For multiple entries, find min and round down to nearest 5
                              const minWeight = Math.min(...chartData.map(entry => entry.weight));
                              // Subtract a buffer and round down to nearest 5
                              return Math.floor((minWeight - 2) / 5) * 5;
                            },
                            (dataMax) => {
                              // Handle empty data case
                              if (!chartData.length) return 100;
                              
                              // If only one entry, create a reasonable range around it
                              if (chartData.length === 1) {
                                const weight = chartData[0]?.weight || 70;
                                // Set max to 110% of value, rounded up to nearest 5
                                return Math.ceil((weight * 1.1) / 5) * 5;
                              }
                              
                              // For multiple entries, find max and round up to nearest 5
                              const maxWeight = Math.max(...chartData.map(entry => entry.weight));
                              // Add a buffer and round up to nearest 5
                              return Math.ceil((maxWeight + 2) / 5) * 5;
                            }
                          ]}
                          tickCount={5}
                          tickFormatter={(value) => `${value}kg`}
                        />
                        <Tooltip
                          formatter={(value) => [`${value} kg`, 'Weight']}
                          labelFormatter={(date) => {
                            const d = new Date(date);
                            return d.toLocaleDateString();
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="weight"
                          stroke="var(--primary)"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center border border-dashed rounded-lg">
                      <p className="text-muted-foreground">No weight entries yet. Add your first entry above.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        {/* Emergency form removed */}
      </motion.div>
    </div>
  );
}