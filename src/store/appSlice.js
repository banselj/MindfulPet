import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isFirstLaunch: true,
  theme: 'light',
  notifications: true,
  sound: true,
};

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setFirstLaunch: (state, action) => {
      state.isFirstLaunch = action.payload;
    },
    updateSettings: (state, action) => {
      return {
        ...state,
        ...action.payload,
      };
    },
    resetApp: () => initialState,
  },
});

export const { setFirstLaunch, updateSettings, resetApp } = appSlice.actions;

export default appSlice.reducer;
