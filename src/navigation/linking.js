const linking = {
  prefixes: ['mindfulpals://', 'https://mindfulpals.app'],
  
  config: {
    screens: {
      Onboarding: 'welcome',
      Main: {
        screens: {
          Home: {
            screens: {
              PetInteraction: 'pet',
              Store: 'store',
            },
          },
          Mindfulness: {
            screens: {
              Activities: 'mindfulness',
              Session: 'mindfulness/session/:activityId',
            },
          },
          Community: {
            screens: {
              Feed: 'community',
              ChallengeDetails: 'challenge/:challengeId',
              PlaydateDetails: 'playdate/:playdateId',
            },
          },
          Profile: 'profile',
        },
      },
      AR: 'ar',
    },
  },

  // Custom function to handle incoming deep links
  async getInitialURL() {
    // Handle incoming links from universal links or custom URL schemes
    return null;
  },

  // Custom function to subscribe to incoming links
  subscribe(listener) {
    // Listen to incoming links while the app is running
    return () => {
      // Cleanup subscription
    };
  },
};

export default linking;
