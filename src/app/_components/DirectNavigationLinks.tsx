'use client';

// This component provides direct navigation links that bypass Next.js router
// and use the browser's native navigation mechanism

import React from 'react';
import { usePathname } from 'next/navigation';

export default function DirectNavigationLinks() {
  const pathname = usePathname();
  
  // Don't render on landing page, login or signup
  if (pathname === '/' || pathname === '/login' || pathname === '/signup') {
    return null;
  }
  
  return (
    <>
      {/* These links are hidden but provide direct navigation capabilities */}
      <a href="/history" id="direct-history-link" style={{ display: 'none' }}>
        History
      </a>
      <a href="/customize" id="direct-customize-link" style={{ display: 'none' }}>
        Customize
      </a>
      
      {/* Add script to make direct navigation available */}
      <script dangerouslySetInnerHTML={{ __html: `
        // Make direct navigation functions available globally
        window.navigateToHistory = function() {
          document.getElementById('direct-history-link').click();
        };
        
        window.navigateToCustomize = function() {
          document.getElementById('direct-customize-link').click();
        };
      `}} />
    </>
  );
}