'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import UserDashboard from "@/components/app/UserDashboard";
import { useAppStore } from '@/store/useAppStore';
import { useUser } from '@/hooks/useUser';

export default function Home() {
  const checkAndResetDaily = useAppStore((state) => state.checkAndResetDaily);
  const { user } = useUser();
  
  // Check if we need to reset daily nutrition counters
  useEffect(() => {
    checkAndResetDaily();
    
    // Force prefetch other routes to ensure navigation works correctly
    const prefetchRoutes = async () => {
      const { default: router } = await import('next/navigation').then(
        module => ({ default: module.useRouter() })
      );
      
      router?.prefetch('/history');
      router?.prefetch('/customize');
    };
    
    prefetchRoutes().catch(console.error);
  }, [checkAndResetDaily]);

  return (
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
  );
}
