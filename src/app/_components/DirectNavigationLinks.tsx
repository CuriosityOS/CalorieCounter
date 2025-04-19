'use client';

// This component provides direct navigation links that bypass Next.js router
// and use the browser's native navigation mechanism

import React from 'react';

export default function DirectNavigationLinks() {
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