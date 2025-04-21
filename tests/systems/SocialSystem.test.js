import { jest } from '@jest/globals';
import SocialSystem from '../../src/systems/SocialSystem';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import firestore from '@react-native-firebase/firestore';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@react-native-firebase/firestore');
jest.mock('react-native', () => ({
  DeviceEventEmitter: {
    emit: jest.fn(),
    addListener: jest.fn()
  }
}));

describe('SocialSystem', () => {
  let mockFirestore;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Mock AsyncStorage
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockResolvedValue(undefined);

    // Mock Firestore
    mockFirestore = {
      collection: jest.fn().mockReturnThis(),
      doc: jest.fn().mockReturnThis(),
      set: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({})
      }),
      onSnapshot: jest.fn()
    };

    firestore.mockReturnValue(mockFirestore);
  });

  describe('Family Groups', () => {
    const mockFamily = {
      id: 'family1',
      name: 'Test Family',
      members: ['user1', 'user2'],
      pets: ['pet1', 'pet2'],
      sharedAchievements: ['achievement1']
    };

    it('should create a new family group', async () => {
      await SocialSystem.createFamilyGroup(mockFamily);
      
      expect(mockFirestore.collection).toHaveBeenCalledWith('families');
      expect(mockFirestore.set).toHaveBeenCalledWith(
        expect.objectContaining({
          name: mockFamily.name,
          members: mockFamily.members,
          pets: mockFamily.pets
        })
      );
    });

    it('should add member to family group', async () => {
      const newMember = 'user3';
      await SocialSystem.addFamilyMember(mockFamily.id, newMember);
      
      expect(mockFirestore.update).toHaveBeenCalledWith({
        members: expect.arrayContaining([...mockFamily.members, newMember])
      });
    });

    it('should sync family achievements', async () => {
      const newAchievement = 'achievement2';
      await SocialSystem.syncFamilyAchievement(mockFamily.id, newAchievement);
      
      expect(mockFirestore.update).toHaveBeenCalledWith({
        sharedAchievements: expect.arrayContaining([...mockFamily.sharedAchievements, newAchievement])
      });
    });
  });

  describe('Community Events', () => {
    const mockEvent = {
      id: 'event1',
      title: 'Global Pet Day',
      description: 'Celebrate with your pets!',
      startTime: '2025-02-01T17:04:18-06:00',
      endTime: '2025-02-02T17:04:18-06:00',
      participants: [],
      rewards: ['special_accessory']
    };

    it('should create community event', async () => {
      await SocialSystem.createCommunityEvent(mockEvent);
      
      expect(mockFirestore.collection).toHaveBeenCalledWith('events');
      expect(mockFirestore.set).toHaveBeenCalledWith(mockEvent);
    });

    it('should join community event', async () => {
      const userId = 'user1';
      await SocialSystem.joinEvent(mockEvent.id, userId);
      
      expect(mockFirestore.update).toHaveBeenCalledWith({
        participants: expect.arrayContaining([userId])
      });
    });

    it('should track event progress', async () => {
      const userId = 'user1';
      const progress = 0.5;
      
      await SocialSystem.updateEventProgress(mockEvent.id, userId, progress);
      
      expect(mockFirestore.collection).toHaveBeenCalledWith('eventProgress');
      expect(mockFirestore.set).toHaveBeenCalledWith({
        eventId: mockEvent.id,
        userId,
        progress,
        timestamp: expect.any(String)
      });
    });
  });

  describe('Leaderboards', () => {
    const mockLeaderboardEntry = {
      userId: 'user1',
      score: 1000,
      category: 'pet_care',
      timestamp: '2025-02-01T17:04:18-06:00'
    };

    it('should update leaderboard', async () => {
      await SocialSystem.updateLeaderboard(mockLeaderboardEntry);
      
      expect(mockFirestore.collection).toHaveBeenCalledWith('leaderboards');
      expect(mockFirestore.set).toHaveBeenCalledWith(mockLeaderboardEntry);
    });

    it('should fetch leaderboard', async () => {
      mockFirestore.get.mockResolvedValue({
        docs: [
          { data: () => mockLeaderboardEntry },
          { data: () => ({ ...mockLeaderboardEntry, userId: 'user2', score: 900 }) }
        ]
      });

      const leaderboard = await SocialSystem.getLeaderboard('pet_care');
      
      expect(leaderboard).toHaveLength(2);
      expect(leaderboard[0].score).toBeGreaterThan(leaderboard[1].score);
    });
  });

  describe('Social Interactions', () => {
    const mockInteraction = {
      type: 'like',
      sourceUserId: 'user1',
      targetUserId: 'user2',
      petId: 'pet1',
      timestamp: '2025-02-01T17:04:18-06:00'
    };

    it('should record social interaction', async () => {
      await SocialSystem.recordInteraction(mockInteraction);
      
      expect(mockFirestore.collection).toHaveBeenCalledWith('interactions');
      expect(mockFirestore.set).toHaveBeenCalledWith(mockInteraction);
    });

    it('should fetch user interactions', async () => {
      mockFirestore.get.mockResolvedValue({
        docs: [
          { data: () => mockInteraction },
          { data: () => ({ ...mockInteraction, type: 'comment' }) }
        ]
      });

      const interactions = await SocialSystem.getUserInteractions('user1');
      
      expect(interactions).toHaveLength(2);
      expect(interactions[0].sourceUserId).toBe('user1');
    });
  });

  describe('Notifications', () => {
    const mockNotification = {
      userId: 'user1',
      type: 'achievement',
      content: 'New family achievement unlocked!',
      timestamp: '2025-02-01T17:04:18-06:00',
      read: false
    };

    it('should send notification', async () => {
      await SocialSystem.sendNotification(mockNotification);
      
      expect(mockFirestore.collection).toHaveBeenCalledWith('notifications');
      expect(mockFirestore.set).toHaveBeenCalledWith(mockNotification);
    });

    it('should mark notification as read', async () => {
      await SocialSystem.markNotificationRead(mockNotification.userId, 'notif1');
      
      expect(mockFirestore.update).toHaveBeenCalledWith({
        read: true,
        readAt: expect.any(String)
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle family group creation errors', async () => {
      mockFirestore.set.mockRejectedValue(new Error('Firestore Error'));

      await expect(
        SocialSystem.createFamilyGroup({
          name: 'Test Family',
          members: ['user1']
        })
      ).rejects.toThrow('Failed to create family group');
    });

    it('should handle event joining errors gracefully', async () => {
      mockFirestore.update.mockRejectedValue(new Error('Firestore Error'));

      await expect(
        SocialSystem.joinEvent('event1', 'user1')
      ).rejects.toThrow('Failed to join event');
    });
  });

  describe('Performance', () => {
    it('should handle multiple simultaneous interactions', async () => {
      const interactions = Array(10).fill(null).map((_, i) => ({
        type: 'like',
        sourceUserId: `user${i}`,
        targetUserId: 'user1',
        petId: 'pet1',
        timestamp: '2025-02-01T17:04:18-06:00'
      }));

      await Promise.all(
        interactions.map(interaction => 
          SocialSystem.recordInteraction(interaction)
        )
      );

      expect(mockFirestore.set).toHaveBeenCalledTimes(10);
    });

    it('should efficiently batch update leaderboard', async () => {
      const entries = Array(10).fill(null).map((_, i) => ({
        userId: `user${i}`,
        score: 1000 - i,
        category: 'pet_care',
        timestamp: '2025-02-01T17:04:18-06:00'
      }));

      await SocialSystem.batchUpdateLeaderboard(entries);
      
      expect(mockFirestore.set).toHaveBeenCalledTimes(1);
    });
  });
});
