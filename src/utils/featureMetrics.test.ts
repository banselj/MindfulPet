import * as featureMetrics from './featureMetrics';

describe('featureMetrics', () => {
  it('should track a feature usage event', () => {
    const result = featureMetrics.trackFeatureUsage('pet_interaction');
    expect(result).toBe(true);
  });

  it('should return usage count for a feature', () => {
    featureMetrics.trackFeatureUsage('meditation');
    featureMetrics.trackFeatureUsage('meditation');
    const count = featureMetrics.getFeatureUsageCount('meditation');
    expect(count).toBeGreaterThanOrEqual(2);
  });

  it('should return 0 for unused features', () => {
    const count = featureMetrics.getFeatureUsageCount('unused_feature');
    expect(count).toBe(0);
  });
});
