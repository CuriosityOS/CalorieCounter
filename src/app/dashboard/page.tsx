'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import UserDashboard from "@/components/app/UserDashboard";
import { useAppStore } from '@/store/useAppStore';
import { useUser } from '@/hooks/useUser';
import AuthGuard from '@/components/app/AuthGuard';
import { useQueryClient } from '@tanstack/react-query';

export default function DashboardPage() {
  const router = useRouter();
  const checkAndResetDaily = useAppStore((state) => state.checkAndResetDaily);
  const { user } = useUser();
  const queryClient = useQueryClient();
  
  // Check if we need to reset daily nutrition counters
  useEffect(() => {
    // Check for day change and reset if needed
    if (typeof window !== 'undefined') {
      const today = new Date().toISOString().split('T')[0];
      const lastDay = localStorage.getItem('last-active-day');
      
      if (!lastDay || lastDay !== today) {
        localStorage.setItem('last-active-day', today);
        // Use React Query invalidation instead of full page reload
        const refreshData = async () => {
          try {
            queryClient.invalidateQueries({ queryKey: ['meals'] });
            queryClient.invalidateQueries({ queryKey: ['user'] });
            checkAndResetDaily();
          } catch {
            // Failed to refresh data
          }
        };
        refreshData();
      }
    }

    // Force prefetch other routes to ensure navigation works correctly
    const prefetchRoutes = async () => {
      router?.prefetch('/history');
      router?.prefetch('/customize');
    };

    prefetchRoutes().catch(() => {
      // Prefetch failed
    });
  }, [router, checkAndResetDaily, queryClient]);

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