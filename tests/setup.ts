import '@testing-library/jest-dom/vitest';
import React from 'react';
import { vi } from 'vitest';

vi.mock('framer-motion', () => {
  const react = React;

  return {
    __esModule: true,
    motion: new Proxy({}, {
      get: (_target, element: string) => {
        return react.forwardRef<any, Record<string, unknown>>((props, ref) => {
          const Component = element === 'circle' ? 'circle' : 'div';
          return React.createElement(Component, { ref, ...props });
        });
      },
    }),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, {}, children),
  };
});

vi.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) =>
    React.createElement('img', { alt, ...props }),
}));
