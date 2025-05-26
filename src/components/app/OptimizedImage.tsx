'use client';

import React, { useState, useCallback, memo } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

const OptimizedImage = memo<OptimizedImageProps>(({
  src,
  alt,
  width = 400,
  height = 300,
  className,
  priority = false,
  onLoad,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  }, [onError]);

  // For base64 images, we need to handle them differently
  const isBase64 = src.startsWith('data:');

  if (hasError) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-secondary/20 text-muted-foreground",
        className
      )}>
        <span className="text-sm">Failed to load image</span>
      </div>
    );
  }

  if (isBase64) {
    // For base64 images, use regular img tag with lazy loading
    return (
      <div className={cn("relative", className)}>
        {isLoading && (
          <div className="absolute inset-0 animate-pulse bg-secondary/20 rounded-lg" />
        )}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "w-full h-auto object-contain transition-opacity duration-300",
            isLoading ? "opacity-0" : "opacity-100",
            className
          )}
        />
      </div>
    );
  }

  // For regular URLs, use Next.js Image component
  return (
    <div className={cn("relative", className)}>
      {isLoading && (
        <div className="absolute inset-0 animate-pulse bg-secondary/20 rounded-lg" />
      )}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          className
        )}
      />
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;