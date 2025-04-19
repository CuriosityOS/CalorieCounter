'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30000, // 30 seconds
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    return makeQueryClient();
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

// Export the query client for direct access
export const queryClient = typeof window !== 'undefined' ? getQueryClient() : undefined;

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const clientToUse = getQueryClient();

  return (
    <QueryClientProvider client={clientToUse}>
      {children}
    </QueryClientProvider>
  );
}