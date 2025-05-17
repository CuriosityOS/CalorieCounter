'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import UserDashboard from "@/components/app/UserDashboard";
import { useAppStore } from '@/store/useAppStore';
import { useUser } from '@/hooks/useUser';
import AuthGuard from '@/components/app/AuthGuard';

export default function DashboardPage() {
  const router = useRouter();
  const checkAndResetDaily = useAppStore((state) => state.checkAndResetDaily);
  const { user, loading } = useUser();
  
  // Check if we need to reset daily nutrition counters
  useEffect(() => {
    // Check for day change and reset if needed
    if (typeof window !== 'undefined') {
      const today = new Date().toISOString().split('T')[0];
      const lastDay = localStorage.getItem('last-active-day');
      
      if (!lastDay || lastDay !== today) {
        console.log('New day detected in Dashboard page, refreshing');
        localStorage.setItem('last-active-day', today);
        window.location.reload();
      }
    }
    
    // Force prefetch other routes to ensure navigation works correctly
    const prefetchRoutes = async () => {
      router?.prefetch('/history');
      router?.prefetch('/customize');
    };
    
    prefetchRoutes().catch(console.error);
  }, [router]);

  return (
    <AuthGuard>
      <div className="container px-4 py-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                {user ? `Welcome, ${user.email?.split('@')[0] || 'User'}` : 'Track your daily nutrition'}
              </p>
            </div>
          </div>
          
          <UserDashboard />
        </motion.div>
      </div>
    </AuthGuard>
  );
}