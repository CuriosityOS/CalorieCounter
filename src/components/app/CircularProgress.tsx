'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CircularProgressProps {
  value: number; // Value between 0-100
  size?: number; // Size of the circle in pixels
  strokeWidth?: number; // Width of the progress stroke
  color?: string; // Color of the progress stroke
  backgroundColor?: string; // Color of the background circle
  children?: React.ReactNode; // Content to display inside the circle
  label?: string; // Optional label text
  valueText?: string; // Value to display (formatted)
  maxValueText?: string; // Max value to display (formatted)
}

export default function CircularProgress({
  value,
  size = 120,
  strokeWidth = 8,
  color = 'var(--primary)',
  backgroundColor = 'var(--secondary)',
  children,
  label,
  valueText,
  maxValueText
}: CircularProgressProps) {
  // Calculate circle properties
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (value / 100) * circumference;
  
  // Center position
  const center = size / 2;
  
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        {/* SVG for the circle progress */}
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke={backgroundColor}
            strokeWidth={strokeWidth}
            className="opacity-30"
          />
          
          {/* Progress circle with animation */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: progressOffset }}
            transition={{ duration: 1, type: 'spring' }}
            transform={`rotate(-90 ${center} ${center})`}
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {children || (
            <div className="text-center">
              {valueText && (
                <div className="text-xl font-bold">{valueText}</div>
              )}
              {maxValueText && (
                <div className="text-xs text-muted-foreground">
                  of {maxValueText}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Optional label below the circle */}
      {label && (
        <div className="mt-2 text-sm font-medium text-center">{label}</div>
      )}
    </div>
  );
}
