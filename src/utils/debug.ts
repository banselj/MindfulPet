// TypeScript migration of debug.js. Adds types and documentation.

/**
 * Debug utilities for logging and diagnostics.
 */
export function logDebug(message: string, ...args: any[]): void {
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.debug(`[DEBUG] ${message}`, ...args);
  }
}

export function logError(message: string, ...args: any[]): void {
  // eslint-disable-next-line no-console
  console.error(`[ERROR] ${message}`, ...args);
}

export default {
  logDebug,
  logError,
};
