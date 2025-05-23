// Simple service worker for PWA functionality
const CACHE_NAME = 'calorie-counter-cache-v1';

// Add list of URLs to cache
const urlsToCache = [
  '/',
  '/history',
  '/customize',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/offline.html',
  '/food-scale.svg',
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME;
          })
          .map((cacheName) => {
            return caches.delete(cacheName);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - use network-first strategy to avoid false offline states
self.addEventListener('fetch', (event) => {
  // Skip service worker for API calls and external domains
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('supabase.co') ||
      event.request.url.includes('openrouter.ai') ||
      !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    // Try network first
    fetch(event.request.clone())
      .then((response) => {
        // Check if we received a valid response
        if (response && response.status === 200 && response.type === 'basic') {
          // Clone the response for caching
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // If it's a navigation request and no cache, show offline page
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
          
          // For other requests, let them fail naturally
          throw new Error('Network failed and no cache available');
        });
      })
  );
});