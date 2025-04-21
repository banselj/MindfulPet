import { configureStore } from '@reduxjs/toolkit';
import petReducer from './petSlice';
import appReducer from './appSlice';

export const store = configureStore({
  reducer: {
    pet: petReducer,
    app: appReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these actions as they may contain non-serializable data
        ignoredActions: [
          'pet/setPet',
          'pet/updateStats',
          'pet/addMoodEntry',
          'pet/updateAttributes',
        ],
        // Ignore these paths in the state as they may contain non-serializable data
        ignoredPaths: [
          'pet.lastFed',
          'pet.lastPlayed',
          'pet.lastRested',
          'pet.lastMeditated',
          'pet.moodEntries',
        ],
      },
    }),
});
