import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  id: null,
  type: null,
  name: '',
  emoji: '',
  personality: '',
  happiness: 100,
  energy: 100,
  health: 100,
  needsAttention: false,
  lastFed: null,
  lastPlayed: null,
  lastRested: null,
  lastMeditated: null,
  attributes: {
    size: 50,
    age: 50,
    energy: 50,
    sociability: 50,
    emotionality: 50,
    routine: 50,
  },
  moodHistory: [],
};

export const petSlice = createSlice({
  name: 'pet',
  initialState,
  reducers: {
    setPet: (state, action) => {
      const { attributes, ...petInfo } = action.payload;
      return {
        ...state,
        ...petInfo,
        attributes: {
          ...state.attributes,
          ...attributes,
        },
        lastFed: new Date().toISOString(),
        lastPlayed: new Date().toISOString(),
        lastRested: new Date().toISOString(),
      };
    },
    updatePet: (state, action) => {
      return {
        ...state,
        ...action.payload,
      };
    },
    updatePetStats: (state, action) => {
      const { happiness, energy, health } = action.payload;
      if (happiness !== undefined) state.happiness = happiness;
      if (energy !== undefined) state.energy = energy;
      if (health !== undefined) state.health = health;
      
      // Update needsAttention flag
      state.needsAttention = 
        state.happiness < 50 || 
        state.energy < 50 || 
        state.health < 50;
    },
    updateAttributes: (state, action) => {
      state.attributes = {
        ...state.attributes,
        ...action.payload,
      };
    },
    addMoodEntry: (state, action) => {
      state.moodHistory.push({
        mood: action.payload,
        timestamp: new Date().toISOString(),
      });
    },
    resetPet: () => initialState,
  },
});

export const { setPet, updatePet, updatePetStats, updateAttributes, addMoodEntry, resetPet } = petSlice.actions;

export default petSlice.reducer;
