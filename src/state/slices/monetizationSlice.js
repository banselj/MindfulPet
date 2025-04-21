import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Virtual currencies
  currencies: {
    vitalityPoints: 0,
    luminescenceGems: 0,
  },

  // Subscription status
  subscription: {
    tier: 'free', // free, basic, mindfulPro, communityHero
    expiresAt: null,
    features: [],
    autoRenew: false,
  },

  // Store items
  inventory: [],
  storeItems: [
    {
      id: 'premium_meditation_pack',
      name: 'Premium Meditation Pack',
      description: 'Access to advanced guided meditations',
      price: { gems: 100 },
      type: 'content',
    },
    {
      id: 'rainbow_aura',
      name: 'Rainbow Aura',
      description: 'Give your pet a magical rainbow aura',
      price: { points: 1000 },
      type: 'cosmetic',
    },
    // More items will be added dynamically
  ],

  // Purchase history
  purchaseHistory: [],

  // Rewards and bonuses
  dailyRewards: {
    lastClaimed: null,
    currentStreak: 0,
  },

  // Special offers
  activeOffers: [],
};

const monetizationSlice = createSlice({
  name: 'monetization',
  initialState,
  reducers: {
    // Currency management
    addVitalityPoints: (state, action) => {
      state.currencies.vitalityPoints += action.payload;
    },
    addLuminescenceGems: (state, action) => {
      state.currencies.luminescenceGems += action.payload;
    },
    spendVitalityPoints: (state, action) => {
      if (state.currencies.vitalityPoints >= action.payload) {
        state.currencies.vitalityPoints -= action.payload;
        return true;
      }
      return false;
    },
    spendLuminescenceGems: (state, action) => {
      if (state.currencies.luminescenceGems >= action.payload) {
        state.currencies.luminescenceGems -= action.payload;
        return true;
      }
      return false;
    },

    // Subscription management
    updateSubscription: (state, action) => {
      state.subscription = {
        ...state.subscription,
        ...action.payload,
      };
    },
    cancelSubscription: (state) => {
      state.subscription.autoRenew = false;
    },

    // Inventory management
    addToInventory: (state, action) => {
      state.inventory.push({
        ...action.payload,
        acquiredAt: new Date().toISOString(),
      });
    },
    useInventoryItem: (state, action) => {
      state.inventory = state.inventory.filter(item => item.id !== action.payload);
    },

    // Store management
    addStoreItem: (state, action) => {
      state.storeItems.push(action.payload);
    },
    removeStoreItem: (state, action) => {
      state.storeItems = state.storeItems.filter(item => item.id !== action.payload);
    },

    // Purchase handling
    recordPurchase: (state, action) => {
      state.purchaseHistory.push({
        ...action.payload,
        timestamp: new Date().toISOString(),
      });
    },

    // Daily rewards
    claimDailyReward: (state) => {
      const now = new Date();
      const lastClaimed = state.dailyRewards.lastClaimed 
        ? new Date(state.dailyRewards.lastClaimed)
        : null;

      if (!lastClaimed || 
          now.getDate() !== lastClaimed.getDate() || 
          now.getMonth() !== lastClaimed.getMonth()) {
        state.dailyRewards.lastClaimed = now.toISOString();
        state.dailyRewards.currentStreak += 1;
        
        // Calculate reward based on streak
        const baseReward = 50;
        const streakBonus = Math.floor(state.dailyRewards.currentStreak / 7) * 25;
        state.currencies.vitalityPoints += baseReward + streakBonus;
      }
    },
    resetDailyStreak: (state) => {
      state.dailyRewards.currentStreak = 0;
    },

    // Special offers
    addSpecialOffer: (state, action) => {
      state.activeOffers.push({
        ...action.payload,
        startTime: new Date().toISOString(),
      });
    },
    removeExpiredOffers: (state) => {
      const now = new Date();
      state.activeOffers = state.activeOffers.filter(offer => 
        new Date(offer.expiresAt) > now
      );
    },
  },
});

export const {
  addVitalityPoints,
  addLuminescenceGems,
  spendVitalityPoints,
  spendLuminescenceGems,
  updateSubscription,
  cancelSubscription,
  addToInventory,
  useInventoryItem,
  addStoreItem,
  removeStoreItem,
  recordPurchase,
  claimDailyReward,
  resetDailyStreak,
  addSpecialOffer,
  removeExpiredOffers,
} = monetizationSlice.actions;

export default monetizationSlice.reducer;
