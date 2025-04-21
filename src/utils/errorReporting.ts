// TypeScript migration of errorReporting.js. Adds types and documentation.

/**
 * Error reporting utility for production and development error tracking.
 */
export function reportError(error: Error, context?: string): void {
  // In production, hook this to a real error reporting service (e.g., Sentry)
  if (process.env.NODE_ENV === 'production') {
    // sendErrorToService(error, context);
  } else {
    // eslint-disable-next-line no-console
    console.error(`[ERROR REPORT]${context ? ` [${context}]` : ''}`, error);
  }
}

export default {
  reportError,
};
