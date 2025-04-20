// Example service worker for Serwist
import { defaultCache } from '@serwist/next/browser';
import { installSerwist } from '@serwist/sw';

declare const self: ServiceWorkerGlobalScope;

installSerwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});
