// Example next.config.ts for PWA setup
import withPWA from '@ducanh2912/next-pwa';

const nextConfig = {
  // Your Next.js config
};

export default withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
})(nextConfig);
