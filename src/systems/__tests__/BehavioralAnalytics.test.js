import { processBehavioralData } from '../BehavioralAnalytics';

describe('BehavioralAnalytics', () => {
  describe('processBehavioralData', () => {
    it('should process behavioral data correctly', async () => {
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
  });
});
