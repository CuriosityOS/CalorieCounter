'use client';

// This is a client-side wrapper to ensure proper navigation
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CustomizePage from './page';

export default function CustomizePageWrapper() {
  const router = useRouter();

  useEffect(() => {
    // Ensure we can navigate elsewhere
    router.prefetch('/');
    router.prefetch('/history');
  }, [router]);

  return <CustomizePage />;
}