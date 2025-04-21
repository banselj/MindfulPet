import { LogLevel } from './constants.js';
import ErrorReporting from './errorReporting.js';
import { SecurityService } from '../security/securityService.js';
import { Platform } from 'react-native';

class RealTimeMonitoring {
  static metricsBuffer = [];

  static addMetricToBuffer(metric) {
    this.metricsBuffer.push(metric);
    // Keep buffer size in check
    if (this.metricsBuffer.length > this.metrics.bufferSize) {
      this.metricsBuffer.shift();
    }
  }
  static metrics = {
    performance: new Map(),
    errors: new Map(),
    memory: 0,
    cpu: 0,
    fps: 0,
    lastFrameTime: performance.now(),
    frameCount: 0,
    bufferSize: 100, // Maximum number of metrics to keep in buffer
  };

  static subscriptions = new Set();

  static async initialize() {
    try {
      console.log('[MVP] Initializing Real-Time Monitoring');
      
      if (Platform.OS === 'web') {
        // Set up web-specific monitoring
        this.setupWebMonitoring();
      } else {
        // KEEP CORE INIT
        this.setupPerformanceObserver();
        this.startSecurityMonitoring();
      }
      
      // Start periodic metrics collection
      this.startMetricsCollection();
      
    } catch (error) {
      console.error('[MVP] Initialization Error:', error);
      ErrorReporting.captureError(error, { context: 'RealTimeMonitoring.initialize' });
    }
  }

  static setupPerformanceObserver() {
    if (typeof PerformanceObserver !== 'undefined') {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.logPerformanceMetric(entry);
        });
      });

      observer.observe({ entryTypes: ['measure', 'resource'] });
    }
  }

  static startSecurityMonitoring() {
    const unsubscribe = SecurityService.onSecurityEvent((event) => {
      this.logEvent({
        type: 'security',
        ...event,
        timestamp: Date.now()
      });
    });
    this.subscriptions.add(() => unsubscribe());
  }

  static setupWebMonitoring() {
    // Monitor FPS
    let animationFrameId;
    const measureFPS = () => {
      const now = performance.now();
      const elapsed = now - this.metrics.lastFrameTime;
      this.metrics.frameCount++;

      if (elapsed >= 1000) {
        this.metrics.fps = (this.metrics.frameCount * 1000) / elapsed;
        this.metrics.frameCount = 0;
        this.metrics.lastFrameTime = now;
      }

      animationFrameId = requestAnimationFrame(measureFPS);
    };

    animationFrameId = requestAnimationFrame(measureFPS);

    // Cleanup function
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }

  static startMetricsCollection() {
    const interval = setInterval(() => {
      if (Platform.OS === 'web') {
        // Web-specific metrics
        try {
          // Check if performance.memory is available (Chrome only)
          if (performance && 'memory' in performance) {
            this.metrics.memory = Math.round(performance.memory.usedJSHeapSize / (1024 * 1024));
          } else {
            // Fallback for non-Chrome browsers
            this.metrics.memory = 0;
          }

          // Estimate CPU usage based on event loop lag
          const start = performance.now();
          setTimeout(() => {
            const end = performance.now();
            const lag = end - start;
            this.metrics.cpu = Math.min(100, Math.round((lag / 16) * 100));
          }, 0);
        } catch (error) {
          console.error('[MVP] Error collecting web metrics:', error);
          ErrorReporting.captureError(error, { context: 'RealTimeMonitoring.webMetrics' });
        }
      } else {
        this.collectMetrics();
      }

      // Store metrics in buffer with timestamp
      this.addMetricToBuffer({
        ...this.getMetrics(),
        timestamp: Date.now()
      });
    }, 1000);

    // Return cleanup function
    this.subscriptions.add(() => clearInterval(interval));
  }

  static async collectMetrics() {
    try {
      const metrics = {
        memory: await this.getMemoryUsage(),
        cpu: await this.getCPUUsage(),
        network: await this.getNetworkMetrics()
      };

      this.logMetrics(metrics);
    } catch (error) {
      console.error('[MVP] Metrics Collection Error:', error);
    }
  }

  static logEvent(event) {
    console.log('[MVP] Event:', event);
    this.addMetricToBuffer({
      ...event,
      timestamp: Date.now()
    });
  }

  static logPerformanceMetric(entry) {
    this.metrics.performance.set(Date.now(), {
      name: entry.name,
      type: entry.entryType,
      duration: entry.duration,
      startTime: entry.startTime
    });
  }

  static logMetrics(metrics) {
    Object.entries(metrics).forEach(([key, value]) => {
      this.metrics.performance.set(`${key}_${Date.now()}`, value);
    });

    // Cleanup old metrics
    const now = Date.now();
    const threshold = now - (24 * 60 * 60 * 1000); // 24 hours
    
    for (const [timestamp] of this.metrics.performance) {
      if (timestamp < threshold) {
        this.metrics.performance.delete(timestamp);
      }
    }
  }

  static async getMemoryUsage() {
    if (global.performance && global.performance.memory) {
      const { usedJSHeapSize, totalJSHeapSize } = global.performance.memory;
      return {
        used: Math.round(usedJSHeapSize / (1024 * 1024)),
        total: Math.round(totalJSHeapSize / (1024 * 1024))
      };
    }
    return { used: 0, total: 0 };
  }

  static async getCPUUsage() {
    // Basic CPU usage estimation
    return {
      percentage: Math.random() * 100 // Placeholder for actual CPU metrics
    };
  }

  static async getNetworkMetrics() {
    // Basic network metrics
    return {
      bytesReceived: 0,
      bytesSent: 0,
      latency: 0
    };
  }

  static getMetrics() {
    return {
      memoryUsage: this.metrics.memory,
      cpuUsage: this.metrics.cpu,
      fps: this.metrics.fps
    };
  }

  static cleanupAllSubscriptions() {
    try {
      this.subscriptions.forEach(unsubscribe => {
        try {
          unsubscribe();
        } catch (error) {
          console.error('Error unsubscribing:', error);
        }
      });
      this.subscriptions.clear();
    } catch (error) {
      console.error('Error cleaning up subscriptions:', error);
    }
  }

  static cleanup() {
    this.cleanupAllSubscriptions();
  }
}

export default RealTimeMonitoring;
