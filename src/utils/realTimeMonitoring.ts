// TypeScript migration of realTimeMonitoring.js. Adds types, interfaces, and documentation.

export interface Metric {
  memoryUsage: number;
  cpuUsage: number;
  fps: number;
  timestamp: number;
}

/**
 * RealTimeMonitoring provides utilities for tracking app performance and resource metrics.
 */
export class RealTimeMonitoring {
  static metricsBuffer: Metric[] = [];
  static metrics = {
    bufferSize: 100,
  };

  /**
   * Adds a metric to the buffer, enforcing buffer size limits.
   */
  static addMetricToBuffer(metric: Metric): void {
    this.metricsBuffer.push(metric);
    if (this.metricsBuffer.length > this.metrics.bufferSize) {
      this.metricsBuffer.shift();
    }
  }

  /**
   * Returns the current buffer of metrics.
   */
  static getMetricsBuffer(): Metric[] {
    return this.metricsBuffer;
  }

  /**
   * Clears the metrics buffer.
   */
  static clearMetricsBuffer(): void {
    this.metricsBuffer = [];
  }
}

export default RealTimeMonitoring;
