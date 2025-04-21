import { processBehavioralData } from '../systems/BehavioralAnalytics';

describe('BehavioralAnalytics', () => {
  test('processBehavioralData should process valid data', async () => {
    const mockData = {
      action: 'play',
      timestamp: Date.now(),
      duration: 300,
      emotionalState: 'happy'
    };

    const result = await processBehavioralData(mockData);
    expect(result).toBeDefined();
    expect(result.processedAction).toBe('play');
    expect(result.emotionalImpact).toBeGreaterThan(0);
  });

  test('processBehavioralData should throw on invalid data', async () => {
    const mockInvalidData = {
      action: '',
      timestamp: null,
      duration: -1,
      emotionalState: undefined
    };

    await expect(processBehavioralData(mockInvalidData)).rejects.toThrow();
  });
});
