'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
}

const publicPaths = new Set(['/login', '/signup', '/']);
const protectedPrefixes = ['/dashboard', '/history', '/customize'];

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

    const isPublicPath = publicPaths.has(pathname);
    const isProtectedPath = protectedPrefixes.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    );

    if (!user) {
      if (isProtectedPath) {
        console.log('Redirecting to login from:', pathname);
        setIsAuthorized(false);
        router.replace('/login');
        return;
      }

      if (!isPublicPath) {
        console.log('Redirecting to landing page from:', pathname);
        setIsAuthorized(false);
        router.replace('/');
        return;
      }

      setIsAuthorized(true);
      return;
    }

    if (isPublicPath && pathname !== '/') {
      console.log('Redirecting to dashboard from:', pathname);
      setIsAuthorized(false);
      router.replace('/dashboard');
      return;
    }

    if (!isProtectedPath && !isPublicPath) {
      console.log('Invalid route, redirecting to dashboard from:', pathname);
      setIsAuthorized(false);
      router.replace('/dashboard');
      return;
    }

    setIsAuthorized(true);
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
