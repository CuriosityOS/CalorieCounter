'use client';

// This special wrapper prevents server rendering issues
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function CustomizePageFix() {
  const router = useRouter();
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // We're on the client, force a navigation to customize
      window.location.href = '/customize';
    }
  }, []);
  
  return null; // This component doesn't render anything
}