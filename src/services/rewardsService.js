import { db } from './firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';

export class RewardsService {
  static async getCalmCoins(userId) {
    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      return docSnap.data().calmCoins || 0;
    }
    return 0;
  }

  static async addCalmCoins(userId, amount) {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      calmCoins: increment(amount)
    });
  }

  static getRewardForAction(action) {
    const rewards = {
      'daily_checkin': 10,
      'complete_breathing': 5,
      'complete_meditation': 15,
      'mood_streak_3': 20,
      'mood_streak_7': 50,
      'pet_interaction': 3,
    };
    
    return rewards[action] || 0;
  }

  static async purchaseItem(userId, itemId, cost) {
    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);
    
    if (!docSnap.exists()) {
      throw new Error('User not found');
    }
    
    const currentCoins = docSnap.data().calmCoins || 0;
    
    if (currentCoins < cost) {
      throw new Error('Insufficient Calm Coins');
    }
    
    // Start a transaction to ensure atomic updates
    await updateDoc(userRef, {
      calmCoins: increment(-cost),
      [`inventory.${itemId}`]: increment(1)
    });
    
    return true;
  }
}
