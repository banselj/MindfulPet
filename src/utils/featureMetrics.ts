// TypeScript migration of featureMetrics.js. Adds types and documentation.

/**
 * Feature usage metrics for analytics and A/B testing.
 */
export interface FeatureMetric {
  feature: string;
  usageCount: number;
  lastUsed: number;
}

export class FeatureMetrics {
  private static metrics: Record<string, FeatureMetric> = {};

  static recordFeatureUse(feature: string): void {
    const now = Date.now();
    if (!this.metrics[feature]) {
      this.metrics[feature] = { feature, usageCount: 1, lastUsed: now };
    } else {
      this.metrics[feature].usageCount++;
      this.metrics[feature].lastUsed = now;
    }
  }

  static getFeatureMetric(feature: string): FeatureMetric | undefined {
    return this.metrics[feature];
  }

  static getAllMetrics(): FeatureMetric[] {
    return Object.values(this.metrics);
  }
}

export default FeatureMetrics;
