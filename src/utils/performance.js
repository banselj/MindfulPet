import { InteractionManager } from 'react-native';
import * as Sentry from '@sentry/react-native';

class PerformanceMonitor {
  static metrics = new Map();
  static interactionHandles = new Map();
  static PERFORMANCE_THRESHOLD = {
    NAVIGATION: 700, // ms
    RENDER: 300,     // ms
    INTERACTION: 150, // ms
    API_CALL: 2000,  // ms
  };

  static startMetric(metricName, category = 'default') {
    const metric = {
      startTime: performance.now(),
      category,
      subMetrics: new Map(),
    };
    this.metrics.set(metricName, metric);
    return metricName;
  }

  static endMetric(metricName) {
    const metric = this.metrics.get(metricName);
    if (!metric) return;

    const duration = performance.now() - metric.startTime;
    metric.duration = duration;

    // Check if duration exceeds threshold
    const threshold = this.PERFORMANCE_THRESHOLD[metric.category] || 1000;
    if (duration > threshold) {
      this.reportPerformanceIssue(metricName, metric);
    }

    return duration;
  }

  static addSubMetric(parentMetricName, subMetricName, duration) {
    const parentMetric = this.metrics.get(parentMetricName);
    if (parentMetric) {
      parentMetric.subMetrics.set(subMetricName, duration);
    }
  }

  static trackScreenLoad(screenName) {
    const metricName = `screen_load_${screenName}`;
    this.startMetric(metricName, 'NAVIGATION');

    // Create an interaction handle
    const handle = InteractionManager.createInteractionHandle();
    this.interactionHandles.set(screenName, handle);

    return () => {
      // Complete the interaction
      const interactionHandle = this.interactionHandles.get(screenName);
      if (interactionHandle) {
        InteractionManager.clearInteractionHandle(interactionHandle);
        this.interactionHandles.delete(screenName);
      }

      const duration = this.endMetric(metricName);
      
      // Track screen load time in Sentry
      Sentry.addBreadcrumb({
        category: 'performance',
        message: `Screen Load: ${screenName}`,
        data: { duration },
      });
    };
  }

  static trackApiCall(apiName) {
    const metricName = `api_call_${apiName}`;
    this.startMetric(metricName, 'API_CALL');
    return () => this.endMetric(metricName);
  }

  static trackInteraction(interactionName) {
    const metricName = `interaction_${interactionName}`;
    this.startMetric(metricName, 'INTERACTION');
    return () => this.endMetric(metricName);
  }

  static trackRender(componentName) {
    const metricName = `render_${componentName}`;
    this.startMetric(metricName, 'RENDER');
    return () => this.endMetric(metricName);
  }

  static reportPerformanceIssue(metricName, metric) {
    Sentry.withScope((scope) => {
      scope.setTag('performance_issue', 'true');
      scope.setTag('metric_category', metric.category);
      
      const extraData = {
        duration: metric.duration,
        threshold: this.PERFORMANCE_THRESHOLD[metric.category],
        subMetrics: Object.fromEntries(metric.subMetrics),
      };
      
      scope.setExtras(extraData);
      
      Sentry.captureMessage(
        `Performance threshold exceeded for ${metricName}`,
        'warning'
      );
    });
  }

  static getMetrics() {
    return Array.from(this.metrics.entries()).map(([name, metric]) => ({
      name,
      duration: metric.duration,
      category: metric.category,
      subMetrics: Object.fromEntries(metric.subMetrics),
    }));
  }

  static clearMetrics() {
    this.metrics.clear();
  }
}

export default PerformanceMonitor;
