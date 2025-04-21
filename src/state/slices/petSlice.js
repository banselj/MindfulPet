import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Physical attributes
  health: 100,
  energy: 100,
  hydration: 100,
  nutrition: 100,
  
  // Emotional attributes
  happiness: 100,
  calmness: 100,
  social: 100,
  
  // Growth & Development
  age: 0, // in days
  evolution: 'baby',
  personality: 'balanced',
  
  // Appearance
  grooming: 100,
  accessories: [],
  
  // Status flags
  isHealthy: true,
  isSleeping: false,
  
  // Timestamps
  lastFed: new Date().toISOString(),
  lastPlayed: new Date().toISOString(),
  lastGroomed: new Date().toISOString(),
  lastMeditated: new Date().toISOString(),
  
  // Achievement tracking
  streaks: {
    meditation: 0,
    exercise: 0,
    hydration: 0,
    sleep: 0,
  },
};

const petSlice = createSlice({
  name: 'pet',
  initialState,
  reducers: {
    // Physical attribute updates
    updateHealth: (state, action) => {
      state.health = action.payload;
      state.isHealthy = state.health > 50;
    },
    updateEnergy: (state, action) => {
      state.energy = Math.max(0, Math.min(100, action.payload));
    },
    updateHydration: (state, action) => {
      state.hydration = Math.max(0, Math.min(100, action.payload));
    },
    updateNutrition: (state, action) => {
      state.nutrition = Math.max(0, Math.min(100, action.payload));
    },
    
    // Emotional attribute updates
    updateHappiness: (state, action) => {
      state.happiness = Math.max(0, Math.min(100, action.payload));
    },
    updateCalmness: (state, action) => {
      state.calmness = Math.max(0, Math.min(100, action.payload));
    },
    updateSocial: (state, action) => {
      state.social = Math.max(0, Math.min(100, action.payload));
    },
    
    // Growth & Development
    age: (state) => {
      state.age += 1;
    },
    evolve: (state, action) => {
      state.evolution = action.payload;
    },
    setPersonality: (state, action) => {
      state.personality = action.payload;
    },
    
    // Activities
    feed: (state) => {
      state.lastFed = new Date().toISOString();
      state.energy = Math.min(state.energy + 20, 100);
      state.nutrition = Math.min(state.nutrition + 30, 100);
    },
    play: (state) => {
      state.lastPlayed = new Date().toISOString();
      state.happiness = Math.min(state.happiness + 20, 100);
      state.energy = Math.max(state.energy - 10, 0);
      state.social = Math.min(state.social + 15, 100);
    },
    groom: (state) => {
      state.lastGroomed = new Date().toISOString();
      state.grooming = 100;
      state.happiness = Math.min(state.happiness + 10, 100);
    },
    meditate: (state) => {
      state.lastMeditated = new Date().toISOString();
      state.calmness = Math.min(state.calmness + 25, 100);
      state.streaks.meditation += 1;
    },
    sleep: (state) => {
      state.isSleeping = true;
      state.energy = 100;
    },
    wake: (state) => {
      state.isSleeping = false;
    },
    
    // Accessories
    addAccessory: (state, action) => {
      state.accessories.push(action.payload);
    },
    removeAccessory: (state, action) => {
      state.accessories = state.accessories.filter(a => a.id !== action.payload);
    },
    
    // Streak management
    updateStreak: (state, action) => {
      const { type, value } = action.payload;
      state.streaks[type] = value;
    },
    resetStreak: (state, action) => {
      state.streaks[action.payload] = 0;
    },
  },
});

export const {
  updateHealth,
  updateEnergy,
  updateHydration,
  updateNutrition,
  updateHappiness,
  updateCalmness,
  updateSocial,
  age,
  evolve,
  setPersonality,
  feed,
  play,
  groom,
  meditate,
  sleep,
  wake,
  addAccessory,
  removeAccessory,
  updateStreak,
  resetStreak,
} = petSlice.actions;

export default petSlice.reducer;
