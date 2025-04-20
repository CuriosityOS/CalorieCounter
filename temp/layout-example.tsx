// Example layout.tsx modifications for PWA
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CalorieCounter',
  description: 'AI-powered calorie tracking',
  manifest: '/manifest.json',
  themeColor: '#000000',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CalorieCounter',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
};
