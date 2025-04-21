import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  health: 100,
  happiness: 100,
  energy: 100,
  healthy: true,
  evolution: 'baby',
  lastFed: new Date().toISOString(),
  lastPlayed: new Date().toISOString(),
};

const petSlice = createSlice({
  name: 'pet',
  initialState,
  reducers: {
    updateHealth: (state, action) => {
      state.health = action.payload;
      state.healthy = state.health > 50;
    },
    updateHappiness: (state, action) => {
      state.happiness = action.payload;
    },
    updateEnergy: (state, action) => {
      state.energy = action.payload;
    },
    evolve: (state, action) => {
      state.evolution = action.payload;
    },
    feed: (state) => {
      state.lastFed = new Date().toISOString();
      state.energy = Math.min(state.energy + 20, 100);
    },
    play: (state) => {
      state.lastPlayed = new Date().toISOString();
      state.happiness = Math.min(state.happiness + 20, 100);
      state.energy = Math.max(state.energy - 10, 0);
    },
  },
});

export const { 
  updateHealth, 
  updateHappiness, 
  updateEnergy, 
  evolve, 
  feed, 
  play 
} = petSlice.actions;

export default petSlice.reducer;
