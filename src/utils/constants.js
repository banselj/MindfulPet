export const LogLevel = {
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  DEBUG: 'debug'
};

export const MetricsConfig = {
  UPDATE_INTERVAL: 1000, // Update metrics every second
  BUFFER_SIZE: 100,     // Keep last 100 measurements
  PERFORMANCE_THRESHOLDS: {
    MEMORY_WARNING: 500,  // MB
    CPU_WARNING: 80,      // %
    FPS_WARNING: 30       // frames per second
  }
};
