// Example next.config.ts for PWA setup with Serwist
import withSerwistInit from '@serwist/next';

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  // Your Next.js config
};

export default withSerwist(nextConfig);
