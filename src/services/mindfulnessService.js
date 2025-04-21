import { db } from './firebase';
import { collection, addDoc, query, where, orderBy, getDocs } from 'firebase/firestore';
import { RewardsService } from './rewardsService';

export class MindfulnessService {
  static async logExercise(userId, exerciseType, duration) {
    const exercise = {
      userId,
      type: exerciseType,
      duration,
      completedAt: new Date(),
    };

    try {
      const docRef = await addDoc(collection(db, 'exercises'), exercise);
      
      // Award Calm Coins for completing exercise
      if (exerciseType === 'breathing') {
        await RewardsService.addCalmCoins(userId, RewardsService.getRewardForAction('complete_breathing'));
      } else if (exerciseType === 'meditation') {
        await RewardsService.addCalmCoins(userId, RewardsService.getRewardForAction('complete_meditation'));
      }
      
      return docRef.id;
    } catch (error) {
      console.error('Error logging exercise:', error);
      throw error;
    }
  }

  static async getExerciseHistory(userId, days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const exercisesQuery = query(
      collection(db, 'exercises'),
      where('userId', '==', userId),
      where('completedAt', '>=', startDate),
      orderBy('completedAt', 'desc'),
    );

    const querySnapshot = await getDocs(exercisesQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      completedAt: doc.data().completedAt.toDate(),
    }));
  }

  static getBreathingExercises() {
    return [
      {
        id: 'box-breathing',
        name: 'Box Breathing',
        description: 'Inhale for 4, hold for 4, exhale for 4, hold for 4',
        duration: 240, // 4 minutes
        pattern: {
          inhale: 4,
          holdIn: 4,
          exhale: 4,
          holdOut: 4,
        },
      },
      {
        id: '478-breathing',
        name: '4-7-8 Breathing',
        description: 'Inhale for 4, hold for 7, exhale for 8',
        duration: 180, // 3 minutes
        pattern: {
          inhale: 4,
          holdIn: 7,
          exhale: 8,
          holdOut: 0,
        },
      },
    ];
  }

  static getMeditationExercises() {
    return [
      {
        id: 'quick-calm',
        name: 'Quick Calm',
        description: 'A brief meditation for instant relaxation',
        duration: 180, // 3 minutes
        type: 'guided',
      },
      {
        id: 'mindful-breathing',
        name: 'Mindful Breathing',
        description: 'Focus on your breath to center yourself',
        duration: 300, // 5 minutes
        type: 'guided',
      },
    ];
  }
}
