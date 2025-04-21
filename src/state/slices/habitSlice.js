import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  habits: {
    // Physical habits
    exercise: {
      dailyGoal: 30, // minutes
      currentProgress: 0,
      streak: 0,
      history: [], // array of daily records
    },
    hydration: {
      dailyGoal: 8, // glasses
      currentProgress: 0,
      streak: 0,
      history: [],
    },
    sleep: {
      dailyGoal: 8, // hours
      currentProgress: 0,
      streak: 0,
      history: [],
      quality: 0, // 0-100
    },
    nutrition: {
      dailyGoal: 3, // healthy meals
      currentProgress: 0,
      streak: 0,
      history: [],
    },

    // Mental wellness habits
    meditation: {
      dailyGoal: 10, // minutes
      currentProgress: 0,
      streak: 0,
      history: [],
    },
    gratitude: {
      dailyGoal: 3, // entries
      currentProgress: 0,
      streak: 0,
      history: [],
    },
    mindfulBreaks: {
      dailyGoal: 5, // breaks
      currentProgress: 0,
      streak: 0,
      history: [],
    },
  },

  // Current challenges
  activeChallenge: null,
  challengeHistory: [],

  // Mood tracking
  moodLog: [],
  currentMood: {
    value: 'neutral', // sad, neutral, happy, etc.
    intensity: 5, // 1-10
    timestamp: new Date().toISOString(),
    notes: '',
  },

  // Achievements
  achievements: [],
  
  // Stats
  stats: {
    totalMeditationMinutes: 0,
    totalExerciseMinutes: 0,
    totalGratitudeEntries: 0,
    averageSleepHours: 0,
    averageMoodScore: 5,
  },
};

const habitSlice = createSlice({
  name: 'habits',
  initialState,
  reducers: {
    // Track habit progress
    logHabitProgress: (state, action) => {
      const { habitName, amount, timestamp = new Date().toISOString() } = action.payload;
      const habit = state.habits[habitName];
      
      if (habit) {
        habit.currentProgress += amount;
        habit.history.push({
          amount,
          timestamp,
          completed: habit.currentProgress >= habit.dailyGoal,
        });

        // Update related stats
        if (habitName === 'meditation') {
          state.stats.totalMeditationMinutes += amount;
        } else if (habitName === 'exercise') {
          state.stats.totalExerciseMinutes += amount;
        }
      }
    },

    // Reset daily progress
    resetDailyProgress: (state, action) => {
      const habitName = action.payload;
      if (state.habits[habitName]) {
        state.habits[habitName].currentProgress = 0;
      }
    },

    // Update streaks
    updateStreak: (state, action) => {
      const { habitName, increment } = action.payload;
      if (state.habits[habitName]) {
        state.habits[habitName].streak += increment;
      }
    },

    // Log mood
    logMood: (state, action) => {
      const { value, intensity, notes } = action.payload;
      const moodEntry = {
        value,
        intensity,
        notes,
        timestamp: new Date().toISOString(),
      };
      
      state.currentMood = moodEntry;
      state.moodLog.push(moodEntry);
      
      // Update average mood score
      const totalMoods = state.moodLog.length;
      const moodSum = state.moodLog.reduce((sum, mood) => sum + mood.intensity, 0);
      state.stats.averageMoodScore = moodSum / totalMoods;
    },

    // Start challenge
    startChallenge: (state, action) => {
      state.activeChallenge = {
        ...action.payload,
        startDate: new Date().toISOString(),
        progress: 0,
      };
    },

    // Complete challenge
    completeChallenge: (state) => {
      if (state.activeChallenge) {
        state.challengeHistory.push({
          ...state.activeChallenge,
          completed: true,
          endDate: new Date().toISOString(),
        });
        state.activeChallenge = null;
      }
    },

    // Add achievement
    unlockAchievement: (state, action) => {
      const achievement = {
        ...action.payload,
        unlockedAt: new Date().toISOString(),
      };
      state.achievements.push(achievement);
    },

    // Update habit goal
    updateHabitGoal: (state, action) => {
      const { habitName, newGoal } = action.payload;
      if (state.habits[habitName]) {
        state.habits[habitName].dailyGoal = newGoal;
      }
    },
  },
});

export const {
  logHabitProgress,
  resetDailyProgress,
  updateStreak,
  logMood,
  startChallenge,
  completeChallenge,
  unlockAchievement,
  updateHabitGoal,
} = habitSlice.actions;

export default habitSlice.reducer;
