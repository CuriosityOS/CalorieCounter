'use client';

// This is a client-side wrapper to ensure proper navigation
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HistoryPage from './page';

export default function HistoryPageWrapper() {
  const router = useRouter();

  useEffect(() => {
    // Ensure we can navigate elsewhere
    router.prefetch('/');
    router.prefetch('/customize');
  }, [router]);

  return <HistoryPage />;
}