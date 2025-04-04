'use client';

import React, { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const darkMode = useAppStore((state) => state.userPreferences.darkMode);

  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  return <>{children}</>;
}