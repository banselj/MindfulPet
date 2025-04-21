import { configureStore } from '@reduxjs/toolkit';
import petReducer from './slices/petSlice';
import habitReducer from './slices/habitSlice';
import rewardsReducer from './slices/rewardsSlice';
import monetizationReducer from './slices/monetizationSlice';
import currencyReducer from './slices/currencySlice';

const store = configureStore({
  reducer: {
    pet: petReducer,
    habits: habitReducer,
    rewards: rewardsReducer,
    monetization: monetizationReducer,
    currency: currencyReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['monetization/updateSubscription'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.timestamp', 'payload.expiresAt'],
        // Ignore these paths in the state
        ignoredPaths: [
          'habits.moodLog.timestamp',
          'monetization.subscription.expiresAt',
          'monetization.dailyRewards.lastClaimed',
          'currency.last_daily_reward',
        ],
      },
    }),
});

export default store;
