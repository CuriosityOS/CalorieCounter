'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface DateNavigationProps {
  onDateChange: (date: Date) => void;
  currentDate: Date;
}

export default function DateNavigation({ onDateChange, currentDate }: DateNavigationProps) {
  // Format the current date for display
  const formattedDate = formatDate(currentDate);
  
  // Navigate to previous day
  const handlePreviousDay = () => {
    const prevDay = new Date(currentDate);
    prevDay.setDate(prevDay.getDate() - 1);
    
    // Don't allow going back more than 30 days (arbitrary limit)
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - 30);
    if (prevDay >= minDate) {
      onDateChange(prevDay);
    }
  };
  
  // Navigate to next day
  const handleNextDay = () => {
    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    // Don't allow navigating to future dates
    const today = new Date();
    if (nextDay.getTime() <= today.setHours(23, 59, 59, 999)) {
      onDateChange(nextDay);
    }
  };
  
  // Reset to today
  const handleToday = () => {
    onDateChange(new Date());
  };
  
  return (
    <div className="flex items-center justify-between bg-card rounded-lg py-2 px-4 shadow-sm border dark:border-gray-800">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handlePreviousDay}
        className="h-8 w-8"
        aria-label="Previous day"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        onClick={handleToday}
        className="h-8 px-2 text-sm font-medium"
      >
        <Calendar className="h-4 w-4 mr-2" />
        {formattedDate}
      </Button>
      
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handleNextDay}
        className="h-8 w-8"
        aria-label="Next day"
        // Disable button if already on today's date
        disabled={new Date(currentDate).setHours(0,0,0,0) >= new Date().setHours(0,0,0,0)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
