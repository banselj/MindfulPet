// Simple error reporting utility for MVP
class ErrorReporting {
  static captureError(error, context = {}) {
    console.error('[MVP Error]', {
      message: error.message,
      stack: error.stack,
      context
    });
  }

  static captureMessage(message, level = 'info') {
    console.log(`[MVP ${level}]`, message);
  }

  static initialize() {
    // Initialize error handlers
    const errorHandler = (error) => {
      this.captureError(error, { context: 'Global Error Handler' });
    };

    // Set up global error handlers
    if (typeof window !== 'undefined') {
      window.onerror = errorHandler;
      window.onunhandledrejection = (event) => {
        this.captureError(event.reason, { context: 'Unhandled Promise Rejection' });
      };
    }
  }
}

export default ErrorReporting;