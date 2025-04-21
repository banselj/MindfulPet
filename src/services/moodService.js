import { db } from './firebase';
import { collection, addDoc, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

export class MoodService {
  static async logMood(userId, mood, note = '') {
    const moodEntry = {
      userId,
      mood,
      note,
      timestamp: new Date(),
    };

    try {
      const docRef = await addDoc(collection(db, 'moods'), moodEntry);
      return docRef.id;
    } catch (error) {
      console.error('Error logging mood:', error);
      throw error;
    }
  }

  static async getMoodHistory(userId, days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const moodsQuery = query(
      collection(db, 'moods'),
      where('userId', '==', userId),
      where('timestamp', '>=', startDate),
      orderBy('timestamp', 'desc'),
    );

    const querySnapshot = await getDocs(moodsQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate(),
    }));
  }

  static async getDailyMoodSummary(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const moodsQuery = query(
      collection(db, 'moods'),
      where('userId', '==', userId),
      where('timestamp', '>=', today),
      orderBy('timestamp', 'desc'),
    );

    const querySnapshot = await getDocs(moodsQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate(),
    }));
  }
}
