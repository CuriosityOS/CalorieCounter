'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // useEffect only runs on the client, so we can safely access window here
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Wait for component to be mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <button
        className="p-2 rounded-full bg-background hover:bg-accent transition-colors"
        aria-label="Toggle theme"
      >
        <div className="w-5 h-5" />
      </button>
    );
  }
  
  const isDarkMode = theme === 'dark';
  
  const toggleTheme = () => {
    setTheme(isDarkMode ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-background hover:bg-accent transition-colors"
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDarkMode ? (
        <Sun size={20} className="text-yellow-500" />
      ) : (
        <Moon size={20} className="text-indigo-500" />
      )}
    </button>
  );
}