'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
}

const publicPaths = ['/login', '/signup', '/']; // Add home page to public paths
const appPaths = ['/dashboard', '/history', '/customize'];

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    // Set initial load to false after first auth check
    if (!loading && isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [loading, isInitialLoad]);

  useEffect(() => {
    // Skip auth check during initial loading
    if (loading) return;

    const isPublicPath = publicPaths.includes(pathname);
    const isAppPath = appPaths.includes(pathname);
    
    if (!user && !isPublicPath) {
      // Not logged in and trying to access a protected route
      console.log('Redirecting to login from:', pathname);
      router.replace('/login');
    } else if (user && isPublicPath && pathname !== '/') {
      // Already logged in and trying to access login/signup
      console.log('Redirecting to dashboard from:', pathname);
      router.replace('/dashboard');
    } else if (!isAppPath && !isPublicPath) {
      // Handle invalid routes - redirect to dashboard if logged in, otherwise to landing page
      console.log('Invalid route, redirecting from:', pathname);
      if (user) {
        router.replace('/dashboard');
      } else {
        router.replace('/');
      }
    } else {
      // Either logged in and accessing protected route, or not logged in and accessing public route
      setIsAuthorized(true);
    }
  }, [user, loading, pathname, router]);

  // Show loading state only during initial auth check
  if ((loading && isInitialLoad) || (!isInitialLoad && !isAuthorized)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="ml-3 text-sm text-muted-foreground">Checking authentication...</p>
      </div>
    );
  }

  return <>{children}</>;
}