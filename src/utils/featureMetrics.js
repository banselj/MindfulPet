import { DeviceEventEmitter } from 'react-native';
import PerformanceMonitor from './performance';
import ErrorReporting from './errorReporting';
import RealTimeMonitoring from './realTimeMonitoring';

class FeatureMetrics {
  static featureUsage = new Map();
  static interactionMetrics = new Map();
  static INTERACTION_THRESHOLD = 100; // ms

  static initializeFeature(featureName) {
    if (!this.featureUsage.has(featureName)) {
      this.featureUsage.set(featureName, {
        usageCount: 0,
        totalDuration: 0,
        errors: 0,
        lastUsed: null,
        performanceMetrics: [],
        interactionMetrics: [],
      });
    }
  }

  static trackFeatureUsage(featureName, duration) {
    try {
      this.initializeFeature(featureName);
      const metrics = this.featureUsage.get(featureName);
      
      metrics.usageCount++;
      metrics.totalDuration += duration;
      metrics.lastUsed = Date.now();

      // Track in Sentry
      ErrorReporting.addBreadcrumb({
        category: 'feature_usage',
        message: `Feature used: ${featureName}`,
        data: {
          duration,
          usageCount: metrics.usageCount,
        },
      });

      // Emit real-time update
      DeviceEventEmitter.emit('FEATURE_USAGE', {
        feature: featureName,
        metrics,
      });
    } catch (error) {
      ErrorReporting.captureError(error, {
        context: 'FeatureMetrics.trackFeatureUsage',
        featureName,
      });
    }
  }

  static startFeatureTracking(featureName) {
    const startTime = performance.now();
    const metricId = `${featureName}_${Date.now()}`;

    // Start performance monitoring
    PerformanceMonitor.startMetric(metricId, 'FEATURE_USAGE');

    // Start real-time monitoring for this feature
    RealTimeMonitoring.addMetricToBuffer({
      timestamp: Date.now(),
      type: 'feature_start',
      data: { feature: featureName },
    });

    return () => {
      const duration = performance.now() - startTime;
      this.trackFeatureUsage(featureName, duration);
      PerformanceMonitor.endMetric(metricId);

      // End real-time monitoring for this feature
      RealTimeMonitoring.addMetricToBuffer({
        timestamp: Date.now(),
        type: 'feature_end',
        data: { feature: featureName, duration },
      });
    };
  }

  static trackInteraction(featureName, interactionType, duration) {
    try {
      const key = `${featureName}_${interactionType}`;
      if (!this.interactionMetrics.has(key)) {
        this.interactionMetrics.set(key, {
          count: 0,
          totalDuration: 0,
          averageDuration: 0,
          slowInteractions: 0,
        });
      }

      const metrics = this.interactionMetrics.get(key);
      metrics.count++;
      metrics.totalDuration += duration;
      metrics.averageDuration = metrics.totalDuration / metrics.count;

      if (duration > this.INTERACTION_THRESHOLD) {
        metrics.slowInteractions++;
        this.reportSlowInteraction(featureName, interactionType, duration);
      }

      // Real-time update
      DeviceEventEmitter.emit('INTERACTION_METRIC', {
        feature: featureName,
        interaction: interactionType,
        metrics,
      });
    } catch (error) {
      ErrorReporting.captureError(error, {
        context: 'FeatureMetrics.trackInteraction',
        featureName,
        interactionType,
      });
    }
  }

  static reportSlowInteraction(featureName, interactionType, duration) {
    ErrorReporting.withScope(scope => {
      scope.setTag('slow_interaction', 'true');
      scope.setExtra('feature', featureName);
      scope.setExtra('interaction', interactionType);
      scope.setExtra('duration', duration);
      scope.setExtra('threshold', this.INTERACTION_THRESHOLD);

      ErrorReporting.captureMessage(
        `Slow interaction detected in ${featureName}`,
        'warning'
      );
    });
  }

  static trackCustomMetric(featureName, metricName, value, metadata = {}) {
    try {
      this.initializeFeature(featureName);
      const metrics = this.featureUsage.get(featureName);
      
      metrics.performanceMetrics.push({
        name: metricName,
        value,
        timestamp: Date.now(),
        metadata,
      });

      // Keep only last 100 metrics
      if (metrics.performanceMetrics.length > 100) {
        metrics.performanceMetrics.shift();
      }

      // Real-time update
      DeviceEventEmitter.emit('CUSTOM_METRIC', {
        feature: featureName,
        metric: metricName,
        value,
        metadata,
      });
    } catch (error) {
      ErrorReporting.captureError(error, {
        context: 'FeatureMetrics.trackCustomMetric',
        featureName,
        metricName,
      });
    }
  }

  static getFeatureMetrics(featureName) {
    return this.featureUsage.get(featureName) || null;
  }

  static getInteractionMetrics(featureName, interactionType) {
    const key = `${featureName}_${interactionType}`;
    return this.interactionMetrics.get(key) || null;
  }

  static getAllMetrics() {
    return {
      featureUsage: Object.fromEntries(this.featureUsage),
      interactionMetrics: Object.fromEntries(this.interactionMetrics),
    };
  }

  static clearMetrics() {
    this.featureUsage.clear();
    this.interactionMetrics.clear();
  }
}

export default FeatureMetrics;
