import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '../services/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const AchievementsContext = createContext();

const ACHIEVEMENTS = {
  mood_tracker: {
    title: 'Mood Master',
    levels: [
      { count: 1, name: 'Mood Novice', description: 'Track your first mood' },
      { count: 5, name: 'Mood Explorer', description: 'Track 5 different moods' },
      { count: 10, name: 'Mood Enthusiast', description: 'Track 10 different moods' },
      { count: 30, name: 'Mood Expert', description: 'Track 30 different moods' },
      { count: 100, name: 'Mood Master', description: 'Track 100 different moods' },
    ],
  },
  breathing_exercises: {
    title: 'Breath Master',
    levels: [
      { count: 1, name: 'Deep Breather', description: 'Complete your first breathing exercise' },
      { count: 5, name: 'Breath Seeker', description: 'Complete 5 breathing exercises' },
      { count: 15, name: 'Breath Warrior', description: 'Complete 15 breathing exercises' },
      { count: 30, name: 'Breath Sage', description: 'Complete 30 breathing exercises' },
      { count: 100, name: 'Breath Master', description: 'Complete 100 breathing exercises' },
    ],
  },
  pet_interactions: {
    title: 'Pet Whisperer',
    levels: [
      { count: 1, name: 'Pet Friend', description: 'Interact with your pet for the first time' },
      { count: 10, name: 'Pet Buddy', description: 'Interact with your pet 10 times' },
      { count: 50, name: 'Pet Companion', description: 'Interact with your pet 50 times' },
      { count: 100, name: 'Pet Guardian', description: 'Interact with your pet 100 times' },
      { count: 500, name: 'Pet Whisperer', description: 'Interact with your pet 500 times' },
    ],
  },
  pet_happiness: {
    title: 'Joy Bringer',
    levels: [
      { count: 50, name: 'Mood Lifter', description: 'Keep pet happiness above 50' },
      { count: 75, name: 'Joy Keeper', description: 'Keep pet happiness above 75' },
      { count: 90, name: 'Happiness Guardian', description: 'Keep pet happiness above 90' },
      { count: 95, name: 'Bliss Master', description: 'Keep pet happiness above 95' },
      { count: 100, name: 'Joy Bringer', description: 'Achieve maximum pet happiness' },
    ],
  },
};

export const AchievementsProvider = ({ children }) => {
  const [achievements, setAchievements] = useState({});
  const [recentAchievement, setRecentAchievement] = useState(null);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      const userId = auth.currentUser.uid;
      const achievementsRef = doc(db, 'users', userId, 'data', 'achievements');
      const achievementsDoc = await getDoc(achievementsRef);

      if (achievementsDoc.exists()) {
        setAchievements(achievementsDoc.data());
      } else {
        // Initialize achievements
        const initialAchievements = Object.keys(ACHIEVEMENTS).reduce((acc, key) => {
          acc[key] = { count: 0, level: 0 };
          return acc;
        }, {});
        
        await setDoc(achievementsRef, initialAchievements);
        setAchievements(initialAchievements);
      }
    } catch (error) {
      console.error('Error loading achievements:', error);
    }
  };

  const updateAchievement = async (type, count) => {
    try {
      if (!ACHIEVEMENTS[type]) return;

      const userId = auth.currentUser.uid;
      const achievementsRef = doc(db, 'users', userId, 'data', 'achievements');
      
      const currentLevel = achievements[type]?.level || 0;
      const levels = ACHIEVEMENTS[type].levels;
      
      // Find the highest level achieved based on count
      let newLevel = currentLevel;
      for (let i = currentLevel; i < levels.length; i++) {
        if (count >= levels[i].count) {
          newLevel = i + 1;
        } else {
          break;
        }
      }

      // If level increased, show achievement notification
      if (newLevel > currentLevel) {
        const achievement = levels[newLevel - 1];
        setRecentAchievement({
          title: ACHIEVEMENTS[type].title,
          name: achievement.name,
          description: achievement.description,
        });

        // Clear notification after 5 seconds
        setTimeout(() => {
          setRecentAchievement(null);
        }, 5000);
      }

      // Update achievement in state and database
      const updatedAchievements = {
        ...achievements,
        [type]: { count, level: newLevel },
      };

      await updateDoc(achievementsRef, updatedAchievements);
      setAchievements(updatedAchievements);
    } catch (error) {
      console.error('Error updating achievement:', error);
    }
  };

  const getAchievementProgress = (type) => {
    if (!achievements[type] || !ACHIEVEMENTS[type]) return null;

    const count = achievements[type].count;
    const level = achievements[type].level;
    const levels = ACHIEVEMENTS[type].levels;

    if (level >= levels.length) {
      return { progress: 1, nextLevel: null };
    }

    const currentLevelCount = level > 0 ? levels[level - 1].count : 0;
    const nextLevelCount = levels[level].count;
    const progress = (count - currentLevelCount) / (nextLevelCount - currentLevelCount);

    return {
      progress: Math.min(Math.max(progress, 0), 1),
      nextLevel: levels[level],
    };
  };

  return (
    <AchievementsContext.Provider
      value={{
        achievements,
        updateAchievement,
        getAchievementProgress,
        recentAchievement,
        ACHIEVEMENTS,
      }}
    >
      {children}
    </AchievementsContext.Provider>
  );
};

export const useAchievements = () => {
  const context = useContext(AchievementsContext);
  if (!context) {
    throw new Error('useAchievements must be used within an AchievementsProvider');
  }
  return context;
};
