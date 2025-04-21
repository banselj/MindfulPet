import { generateStoryArc, updateNarrative, processAchievement } from '../NarrativeEngine';

describe('NarrativeEngine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateStoryArc', () => {
    it('should generate a story arc based on pet state', async () => {
      const mockPetState = {
        level: 5,
        achievements: ['firstPlay', 'firstMeal'],
        emotionalState: 'happy',
        socialConnections: ['friend1', 'friend2']
      };

      const storyArc = await generateStoryArc(mockPetState);
      expect(storyArc).toBeDefined();
      expect(storyArc.mainPlot).toBeDefined();
      expect(storyArc.subplots).toBeInstanceOf(Array);
      expect(storyArc.characters).toBeInstanceOf(Array);
    });

    it('should handle new pets with minimal history', async () => {
      const mockNewPetState = {
        level: 1,
        achievements: [],
        emotionalState: 'neutral',
        socialConnections: []
      };

      const storyArc = await generateStoryArc(mockNewPetState);
      expect(storyArc.mainPlot).toBeDefined();
      expect(storyArc.difficulty).toBe('beginner');
    });
  });

  describe('updateNarrative', () => {
    it('should update narrative based on new events', async () => {
      const mockCurrentNarrative = {
        mainPlot: 'Learning to Play',
        progress: 0.5,
        activeQuests: ['makeNewFriend']
      };

      const mockEvent = {
        type: 'socialInteraction',
        details: { type: 'playDate', friend: 'friend1' }
      };

      const updatedNarrative = await updateNarrative(mockCurrentNarrative, mockEvent);
      expect(updatedNarrative.progress).toBeGreaterThan(mockCurrentNarrative.progress);
      expect(updatedNarrative.activeQuests).toBeInstanceOf(Array);
    });

    it('should handle completion of story arcs', async () => {
      const mockCurrentNarrative = {
        mainPlot: 'Learning to Play',
        progress: 0.95,
        activeQuests: ['finalPlaySession']
      };

      const mockEvent = {
        type: 'achievement',
        details: { id: 'masterPlayer', type: 'major' }
      };

      const updatedNarrative = await updateNarrative(mockCurrentNarrative, mockEvent);
      expect(updatedNarrative.progress).toBe(1);
      expect(updatedNarrative.completed).toBe(true);
    });
  });

  describe('processAchievement', () => {
    it('should process achievement and update story accordingly', async () => {
      const mockAchievement = {
        id: 'firstFriend',
        type: 'social',
        significance: 'major'
      };

      const mockCurrentStory = {
        mainPlot: 'Social Butterfly',
        progress: 0.3,
        achievements: []
      };

      const result = await processAchievement(mockAchievement, mockCurrentStory);
      expect(result.storyUpdate).toBeDefined();
      expect(result.newQuests).toBeInstanceOf(Array);
      expect(result.achievements).toContain('firstFriend');
    });

    it('should handle minor achievements appropriately', async () => {
      const mockMinorAchievement = {
        id: 'quickSnack',
        type: 'care',
        significance: 'minor'
      };

      const mockCurrentStory = {
        mainPlot: 'Daily Life',
        progress: 0.7,
        achievements: ['breakfast', 'lunch']
      };

      const result = await processAchievement(mockMinorAchievement, mockCurrentStory);
      expect(result.storyUpdate).toBeDefined();
      expect(result.progressIncrease).toBeLessThan(0.1);
    });
  });
});
