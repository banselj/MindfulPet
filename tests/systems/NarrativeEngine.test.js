import { jest } from '@jest/globals';
import NarrativeEngine from '../../src/systems/NarrativeEngine';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('react-native', () => ({
  DeviceEventEmitter: {
    emit: jest.fn(),
    addListener: jest.fn()
  }
}));

describe('NarrativeEngine System', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Mock AsyncStorage
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockResolvedValue(undefined);
  });

  describe('Initialization', () => {
    it('should initialize with default state', async () => {
      await NarrativeEngine.initialize();
      
      expect(NarrativeEngine.currentArc).toBeNull();
      expect(NarrativeEngine.unlockedChapters).toBeDefined();
      expect(NarrativeEngine.narrativeState).toEqual(expect.objectContaining({
        mainProgress: 0,
        sideQuests: expect.any(Map),
        achievements: expect.any(Set),
        personalityTraits: expect.any(Map),
        emotionalMemory: expect.any(Array)
      }));
    });

    it('should load saved state if available', async () => {
      const mockSavedState = {
        mainProgress: 0.5,
        sideQuests: [['quest1', { progress: 1 }]],
        achievements: ['achievement1'],
        personalityTraits: [['optimism', 0.8]],
        emotionalMemory: []
      };

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockSavedState));
      
      await NarrativeEngine.initialize();
      
      expect(NarrativeEngine.narrativeState.mainProgress).toBe(0.5);
      expect(NarrativeEngine.narrativeState.sideQuests.get('quest1')).toEqual({ progress: 1 });
      expect(NarrativeEngine.narrativeState.achievements.has('achievement1')).toBe(true);
      expect(NarrativeEngine.narrativeState.personalityTraits.get('optimism')).toBe(0.8);
    });
  });

  describe('Behavior Prediction Handling', () => {
    const mockPrediction = {
      behavior: 'improve',
      confidence: 0.8
    };

    it('should update emotional memory with new predictions', () => {
      NarrativeEngine.handleBehaviorPrediction(mockPrediction);
      
      expect(NarrativeEngine.narrativeState.emotionalMemory).toHaveLength(1);
      expect(NarrativeEngine.narrativeState.emotionalMemory[0]).toEqual(
        expect.objectContaining({
          behavior: 'improve',
          confidence: 0.8,
          timestamp: expect.any(String)
        })
      );
    });

    it('should limit emotional memory to 30 days', () => {
      // Add 31 predictions
      for (let i = 0; i < 31; i++) {
        NarrativeEngine.handleBehaviorPrediction(mockPrediction);
      }

      expect(NarrativeEngine.narrativeState.emotionalMemory).toHaveLength(30);
    });

    it('should generate appropriate narrative events', () => {
      const events = NarrativeEngine.generateNarrativeEvents(mockPrediction);
      
      expect(events).toBeInstanceOf(Array);
      expect(events[0]).toEqual(
        expect.objectContaining({
          type: expect.any(String),
          content: expect.any(String),
          timestamp: expect.any(String)
        })
      );
    });
  });

  describe('Achievement System', () => {
    const mockAchievement = {
      id: 'achievement1',
      type: 'major',
      title: 'First Steps',
      description: 'Complete your first quest'
    };

    it('should handle new achievements', async () => {
      await NarrativeEngine.handleAchievement(mockAchievement);
      
      expect(NarrativeEngine.narrativeState.achievements.has('achievement1')).toBe(true);
      expect(NarrativeEngine.narrativeState.mainProgress).toBeGreaterThan(0);
    });

    it('should generate achievement-specific narrative', async () => {
      const narrativeEvent = NarrativeEngine.generateAchievementNarrative(mockAchievement);
      
      expect(narrativeEvent).toEqual(
        expect.objectContaining({
          type: 'achievement',
          achievement: mockAchievement,
          content: expect.any(String),
          timestamp: expect.any(String)
        })
      );
    });
  });

  describe('Personality System', () => {
    beforeEach(() => {
      NarrativeEngine.narrativeState.emotionalMemory = [];
      NarrativeEngine.narrativeState.personalityTraits = new Map();
    });

    it('should update personality traits based on emotional memory', () => {
      // Add a week of positive behavior
      for (let i = 0; i < 7; i++) {
        NarrativeEngine.narrativeState.emotionalMemory.push({
          behavior: 'improve',
          confidence: 0.8,
          timestamp: new Date().toISOString()
        });
      }

      NarrativeEngine.updatePersonalityTraits();
      
      expect(NarrativeEngine.narrativeState.personalityTraits.get('optimism')).toBeGreaterThan(0);
    });

    it('should generate personality-appropriate narratives', () => {
      // Set dominant personality trait
      NarrativeEngine.narrativeState.personalityTraits.set('resilience', 0.8);

      const narrative = NarrativeEngine.generateGrowthNarrative(['resilience']);
      expect(narrative).toContain('determination') || expect(narrative).toContain('strength');
    });
  });

  describe('Chapter System', () => {
    it('should unlock new chapters at appropriate thresholds', async () => {
      NarrativeEngine.narrativeState.mainProgress = 0.19;
      
      // Trigger progress update that crosses threshold
      await NarrativeEngine.handleAchievement({
        id: 'major_achievement',
        type: 'major',
        title: 'Major Achievement'
      });

      expect(NarrativeEngine.unlockedChapters.size).toBeGreaterThan(0);
      expect(DeviceEventEmitter.emit).toHaveBeenCalledWith(
        'narrativeUpdate',
        expect.arrayContaining([
          expect.objectContaining({
            type: 'chapter_unlock'
          })
        ])
      );
    });

    it('should generate appropriate chapter introductions', () => {
      const chapter = {
        id: 'growth',
        title: 'Growing Together',
        theme: 'nurture'
      };

      // Set personality trait
      NarrativeEngine.narrativeState.personalityTraits.set('optimism', 0.9);

      const intro = NarrativeEngine.generateChapterIntro(chapter);
      
      expect(intro).toEqual(
        expect.objectContaining({
          title: chapter.title,
          introduction: expect.any(String),
          unlockAnimation: expect.objectContaining({
            type: 'chapter_unlock',
            theme: chapter.theme
          })
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle AsyncStorage errors gracefully', async () => {
      AsyncStorage.setItem.mockRejectedValue(new Error('Storage Error'));

      await expect(
        NarrativeEngine.updateNarrativeState({ mainProgress: 0.5 })
      ).resolves.not.toThrow();
    });

    it('should handle missing personality traits gracefully', () => {
      NarrativeEngine.narrativeState.personalityTraits.clear();
      
      const narrative = NarrativeEngine.generateGrowthNarrative([]);
      expect(narrative).toBeDefined();
      expect(typeof narrative).toBe('string');
    });
  });

  describe('Performance', () => {
    it('should handle rapid narrative updates efficiently', async () => {
      const startTime = Date.now();
      
      // Generate 100 narrative updates
      for (let i = 0; i < 100; i++) {
        await NarrativeEngine.handleBehaviorPrediction({
          behavior: 'improve',
          confidence: 0.8
        });
      }

      const processingTime = Date.now() - startTime;
      expect(processingTime).toBeLessThan(1000); // Should process in under 1 second
    });

    it('should maintain reasonable memory usage', () => {
      // Fill emotional memory
      for (let i = 0; i < 1000; i++) {
        NarrativeEngine.narrativeState.emotionalMemory.push({
          behavior: 'improve',
          confidence: 0.8,
          timestamp: new Date().toISOString()
        });
      }

      // Memory should be pruned to 30 days
      expect(NarrativeEngine.narrativeState.emotionalMemory).toHaveLength(30);
    });
  });
});
