import { createFamilyGroup, joinCommunityEvent, initiatePlayDate, updateSocialScore } from '../SocialSystem';

describe('SocialSystem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createFamilyGroup', () => {
    it('should create a new family group successfully', async () => {
      const mockFamilyData = {
        name: 'Happy Pets',
        members: ['pet1', 'pet2'],
        preferences: {
          playStyle: 'active',
          schedule: 'flexible'
        }
      };

      const result = await createFamilyGroup(mockFamilyData);
      expect(result.groupId).toBeDefined();
      expect(result.members).toHaveLength(2);
      expect(result.createdAt).toBeDefined();
    });

    it('should validate family group data', async () => {
      const mockInvalidData = {
        name: '',
        members: []
      };

      await expect(createFamilyGroup(mockInvalidData)).rejects.toThrow();
    });
  });

  describe('joinCommunityEvent', () => {
    it('should join a community event successfully', async () => {
      const mockEventData = {
        eventId: 'event123',
        petId: 'pet1',
        role: 'participant'
      };

      const result = await joinCommunityEvent(mockEventData);
      expect(result.success).toBe(true);
      expect(result.eventDetails).toBeDefined();
      expect(result.participationStatus).toBe('confirmed');
    });

    it('should handle event capacity limits', async () => {
      const mockFullEventData = {
        eventId: 'fullEvent',
        petId: 'pet1',
        role: 'participant'
      };

      const result = await joinCommunityEvent(mockFullEventData);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/capacity/i);
    });
  });

  describe('initiatePlayDate', () => {
    it('should initiate a play date between pets', async () => {
      const mockPlayDateData = {
        initiator: 'pet1',
        invitee: 'pet2',
        duration: 30,
        activity: 'fetch'
      };

      const result = await initiatePlayDate(mockPlayDateData);
      expect(result.playDateId).toBeDefined();
      expect(result.status).toBe('scheduled');
      expect(result.scheduledTime).toBeDefined();
    });

    it('should handle incompatible play schedules', async () => {
      const mockIncompatibleData = {
        initiator: 'busyPet',
        invitee: 'pet2',
        duration: 30,
        activity: 'fetch'
      };

      const result = await initiatePlayDate(mockIncompatibleData);
      expect(result.status).toBe('failed');
      expect(result.reason).toMatch(/schedule conflict/i);
    });
  });

  describe('updateSocialScore', () => {
    it('should update social score based on interactions', async () => {
      const mockInteractions = [
        { type: 'playDate', success: true, duration: 30 },
        { type: 'groupActivity', participation: 'active' }
      ];

      const currentScore = 75;
      const newScore = await updateSocialScore(currentScore, mockInteractions);
      expect(newScore).toBeGreaterThan(currentScore);
      expect(newScore).toBeLessThanOrEqual(100);
    });

    it('should handle negative interactions appropriately', async () => {
      const mockNegativeInteractions = [
        { type: 'playDate', success: false, reason: 'noShow' },
        { type: 'groupActivity', participation: 'disruptive' }
      ];

      const currentScore = 75;
      const newScore = await updateSocialScore(currentScore, mockNegativeInteractions);
      expect(newScore).toBeLessThan(currentScore);
      expect(newScore).toBeGreaterThanOrEqual(0);
    });
  });
});
