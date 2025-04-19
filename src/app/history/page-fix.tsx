'use client';

// This special wrapper prevents server rendering issues
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HistoryPageFix() {
  const router = useRouter();
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // We're on the client, force a navigation to history
      window.location.href = '/history';
    }
  }, []);
  
  return null; // This component doesn't render anything
}