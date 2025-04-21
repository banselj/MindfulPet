import { jest } from '@jest/globals';
import BehavioralAnalytics from '../../src/systems/BehavioralAnalytics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import * as tf from '@tensorflow/tfjs';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@tensorflow/tfjs');
jest.mock('react-native', () => ({
  DeviceEventEmitter: {
    emit: jest.fn()
  }
}));

describe('BehavioralAnalytics System', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Mock AsyncStorage
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockResolvedValue(undefined);

    // Mock TensorFlow
    tf.ready.mockResolvedValue(undefined);
    tf.sequential.mockReturnValue({
      compile: jest.fn(),
      predict: jest.fn().mockReturnValue({
        data: jest.fn().mockResolvedValue([0.2, 0.3, 0.4, 0.1])
      })
    });
  });

  describe('Initialization', () => {
    it('should initialize TensorFlow successfully', async () => {
      await BehavioralAnalytics.initTensorFlow();
      expect(tf.ready).toHaveBeenCalled();
      expect(BehavioralAnalytics.isModelLoaded).toBe(true);
    });

    it('should handle initialization errors gracefully', async () => {
      tf.ready.mockRejectedValue(new Error('TF Init Error'));
      await BehavioralAnalytics.initTensorFlow();
      expect(BehavioralAnalytics.isModelLoaded).toBe(false);
    });
  });

  describe('Behavioral Data Processing', () => {
    const mockBehavioralData = {
      timestamp: '2025-02-01T17:04:18-06:00',
      activityType: 'exercise',
      duration: 30,
      intensity: 7,
      mood: 'positive',
      energy: 80,
      stress: 30,
      location: 'home',
      weather: 'sunny',
      previousActivity: 'rest'
    };

    it('should process behavioral data and generate predictions', async () => {
      const prediction = await BehavioralAnalytics.processBehavioralData(mockBehavioralData);
      
      expect(prediction).toBeDefined();
      expect(prediction.behavior).toBeDefined();
      expect(prediction.confidence).toBeGreaterThan(0);
      
      // Verify event emission
      expect(DeviceEventEmitter.emit).toHaveBeenCalledWith(
        'behaviorPrediction',
        expect.any(Object)
      );
    });

    it('should generate appropriate interventions based on predictions', async () => {
      const prediction = {
        behavior: 'decline',
        confidence: 0.8
      };

      const interventions = BehavioralAnalytics.generateInterventions(prediction);
      
      expect(interventions).toHaveLength(expect.any(Number));
      expect(interventions[0]).toHaveProperty('type');
      expect(interventions[0]).toHaveProperty('priority');
      expect(interventions[0]).toHaveProperty('suggestion');
    });

    it('should update pattern database with new data', async () => {
      const prediction = {
        behavior: 'improve',
        confidence: 0.9
      };

      await BehavioralAnalytics.updatePatternDatabase(mockBehavioralData, prediction);
      
      // Verify pattern storage
      expect(AsyncStorage.setItem).toHaveBeenCalled();
      
      // Check pattern structure
      const pattern = BehavioralAnalytics.userPatterns.get(
        `${mockBehavioralData.activityType}_${BehavioralAnalytics.getDayPeriod(mockBehavioralData.timestamp)}`
      );
      
      expect(pattern).toBeDefined();
      expect(pattern.occurrences).toBeGreaterThan(0);
      expect(pattern.predictions).toContainEqual(
        expect.objectContaining({
          prediction: 'improve',
          confidence: 0.9
        })
      );
    });
  });

  describe('Data Normalization', () => {
    it('should correctly normalize time values', () => {
      const timestamp = '2025-02-01T12:00:00-06:00';
      const normalized = BehavioralAnalytics.normalizeTime(timestamp);
      
      expect(normalized).toBeGreaterThanOrEqual(0);
      expect(normalized).toBeLessThanOrEqual(1);
    });

    it('should correctly encode activity types', () => {
      const activities = ['exercise', 'work', 'leisure', 'rest', 'social'];
      
      activities.forEach(activity => {
        const encoded = BehavioralAnalytics.encodeActivityType(activity);
        expect(encoded).toBeGreaterThanOrEqual(0);
        expect(encoded).toBeLessThanOrEqual(1);
      });
    });

    it('should correctly encode mood values', () => {
      const moods = ['very_negative', 'negative', 'neutral', 'positive', 'very_positive'];
      
      moods.forEach(mood => {
        const encoded = BehavioralAnalytics.encodeMood(mood);
        expect(encoded).toBeGreaterThanOrEqual(0);
        expect(encoded).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle prediction errors gracefully', async () => {
      tf.sequential().predict.mockImplementation(() => {
        throw new Error('Prediction Error');
      });

      const prediction = await BehavioralAnalytics.predictBehavior(
        tf.tensor2d([[0, 0, 0, 0, 0, 0, 0, 0, 0, 0]])
      );

      expect(prediction).toBeNull();
    });

    it('should handle pattern database update errors', async () => {
      AsyncStorage.setItem.mockRejectedValue(new Error('Storage Error'));

      const mockData = {
        timestamp: '2025-02-01T17:04:18-06:00',
        activityType: 'exercise'
      };

      const mockPrediction = {
        behavior: 'improve',
        confidence: 0.9
      };

      await expect(
        BehavioralAnalytics.updatePatternDatabase(mockData, mockPrediction)
      ).resolves.not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should process behavioral data within acceptable time limits', async () => {
      const startTime = Date.now();
      
      await BehavioralAnalytics.processBehavioralData({
        timestamp: '2025-02-01T17:04:18-06:00',
        activityType: 'exercise',
        duration: 30,
        intensity: 7,
        mood: 'positive',
        energy: 80,
        stress: 30,
        location: 'home',
        weather: 'sunny',
        previousActivity: 'rest'
      });

      const processingTime = Date.now() - startTime;
      expect(processingTime).toBeLessThan(1000); // Should process in under 1 second
    });

    it('should handle rapid successive predictions efficiently', async () => {
      const predictions = await Promise.all(
        Array(10).fill(null).map(() => 
          BehavioralAnalytics.processBehavioralData({
            timestamp: '2025-02-01T17:04:18-06:00',
            activityType: 'exercise',
            duration: 30,
            intensity: 7,
            mood: 'positive',
            energy: 80,
            stress: 30,
            location: 'home',
            weather: 'sunny',
            previousActivity: 'rest'
          })
        )
      );

      expect(predictions).toHaveLength(10);
      predictions.forEach(prediction => {
        expect(prediction).toBeDefined();
        expect(prediction.behavior).toBeDefined();
        expect(prediction.confidence).toBeGreaterThan(0);
      });
    });
  });
});
