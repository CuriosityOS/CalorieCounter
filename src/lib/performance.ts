export const measurePerformance = (name: string, fn: () => void) => {
  if (typeof window !== 'undefined' && window.performance) {
    const startTime = performance.now();
    fn();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    }
    
    // Report to analytics if needed
    return duration;
  }
  
  // Fallback if performance API not available
  fn();
  return 0;
};

export const measureAsyncPerformance = async <T>(name: string, fn: () => Promise<T>) => {
  if (typeof window !== 'undefined' && window.performance) {
    const startTime = performance.now();
    const result = await fn();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    }
    
    return result;
  }
  
  // Fallback if performance API not available
  return await fn();
};