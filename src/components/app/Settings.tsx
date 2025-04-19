'use client';

import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Settings: React.FC = () => {
  const { darkMode } = useAppStore((state) => state.userPreferences);
  const nutritionGoals = useAppStore((state) => state.userPreferences.nutritionGoals);
  const { toggleDarkMode } = useAppStore();

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
          <Label htmlFor="dark-mode-toggle" className="font-medium">
            Dark Mode
            <p className="text-sm text-muted-foreground">Adjust the application theme.</p>
          </Label>
          <Switch
            id="dark-mode-toggle"
            checked={darkMode}
            onCheckedChange={toggleDarkMode}
            aria-label="Toggle dark mode"
          />
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="font-medium mb-3">Daily Goals</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
                <Label className="text-xs text-muted-foreground">Calories</Label>
                <p>{nutritionGoals.calories ?? 'Not set'}</p>
            </div>
             <div>
                <Label className="text-xs text-muted-foreground">Protein (g)</Label>
                <p>{nutritionGoals.protein ?? 'Not set'}</p>
            </div>
             <div>
                <Label className="text-xs text-muted-foreground">Carbs (g)</Label>
                <p>{nutritionGoals.carbs ?? 'Not set'}</p>
            </div>
             <div>
                <Label className="text-xs text-muted-foreground">Fat (g)</Label>
                <p>{nutritionGoals.fat ?? 'Not set'}</p>
            </div>
          </div>
          <button className="mt-2 px-3 py-1 border rounded text-sm">Set Goals</button>
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="font-medium mb-3">Account</h3>
          <button className="px-3 py-1 border rounded text-sm text-destructive">Log Out</button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Settings;