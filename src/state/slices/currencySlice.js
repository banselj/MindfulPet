import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  vitality_points: 0,
  mindfulness_tokens: 0,
  evolution_crystals: 0,
  last_daily_reward: null,
};

const currencySlice = createSlice({
  name: 'currency',
  initialState,
  reducers: {
    addCurrency: (state, action) => {
      const { type, amount } = action.payload;
      state[type] = Math.max(0, state[type] + amount);
    },
    
    spendCurrency: (state, action) => {
      const { type, amount } = action.payload;
      if (state[type] >= amount) {
        state[type] -= amount;
      }
      // If not enough, do nothing (no mutation)
    },
    
    claimDailyReward: (state) => {
      const now = new Date();
      const lastReward = state.last_daily_reward ? new Date(state.last_daily_reward) : null;
      
      if (!lastReward || now.getDate() !== lastReward.getDate()) {
        state.vitality_points += 100;
        state.mindfulness_tokens += 10;
        state.evolution_crystals += 1;
        state.last_daily_reward = now.toISOString();
      }
    },
  },
});

export const {
  addCurrency,
  spendCurrency,
  claimDailyReward,
} = currencySlice.actions;

export default currencySlice.reducer;
