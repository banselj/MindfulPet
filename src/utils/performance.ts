// TypeScript migration of performance.js. Adds types and documentation.

/**
 * Performance utilities for timing and benchmarking.
 */
export function startTimer(label: string): number {
  // Returns a timestamp (ms)
  return Date.now();
}

export function endTimer(label: string, start: number): number {
  const duration = Date.now() - start;
   
  console.info(`[PERFORMANCE] ${label}: ${duration}ms`);
  return duration;
}

export default {
  startTimer,
  endTimer,
};
