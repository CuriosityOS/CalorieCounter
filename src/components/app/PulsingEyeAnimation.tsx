'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface PulsingEyeAnimationProps {
  size?: number;
}

export default function PulsingEyeAnimation({ 
  size = 100 
}: PulsingEyeAnimationProps) {
  const [blink, setBlink] = useState(false);
  
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, Math.random() * 3000 + 2000); // Random blink between 2-5 seconds
    
    return () => clearInterval(blinkInterval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size, marginBottom: 10 }}>
        {/* SVG Eye */}
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Eye outline */}
          <motion.ellipse
            cx="50"
            cy="50"
            rx="45"
            ry={blink ? "3" : "28"}
            fill="white"
            stroke="#3B82F6" // Blue
            strokeWidth="3"
            animate={{
              filter: ["drop-shadow(0 0 4px #3B82F6)", "drop-shadow(0 0 8px #3B82F6)", "drop-shadow(0 0 4px #3B82F6)"],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          
          {/* Iris */}
          {!blink && (
            <motion.circle
              cx="50"
              cy="50"
              r="20"
              fill="#3B82F6" // Blue
              animate={{
                r: [20, 15, 20],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
          
          {/* Pupil */}
          {!blink && (
            <motion.circle
              cx="50"
              cy="50"
              r="10"
              fill="#1E3A8A" // Dark blue
              animate={{
                r: [10, 5, 10],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
          
          {/* Light reflection */}
          {!blink && (
            <circle
              cx="42"
              cy="40"
              r="5"
              fill="white"
              fillOpacity="0.8"
            />
          )}
        </svg>
        
        {/* Neon glow effect using box-shadow */}
        <motion.div
          className="absolute inset-0 rounded-full z-[-1]"
          animate={{
            boxShadow: [
              "0 0 10px 2px rgba(59, 130, 246, 0.3)",
              "0 0 20px 5px rgba(59, 130, 246, 0.5)",
              "0 0 10px 2px rgba(59, 130, 246, 0.3)"
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
      
      {/* Text */}
      <motion.p 
        className="text-sm font-medium text-center text-blue-500"
        animate={{
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        Analyzing...
      </motion.p>
    </div>
  );
}