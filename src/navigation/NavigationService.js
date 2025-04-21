import { createRef } from 'react';
import { StackActions, CommonActions } from '@react-navigation/native';

export const navigationRef = createRef();

export const navigate = (name, params) => {
  navigationRef.current?.navigate(name, params);
};

export const push = (name, params) => {
  navigationRef.current?.dispatch(StackActions.push(name, params));
};

export const replace = (name, params) => {
  navigationRef.current?.dispatch(StackActions.replace(name, params));
};

export const pop = (count = 1) => {
  navigationRef.current?.dispatch(StackActions.pop(count));
};

export const popToTop = () => {
  navigationRef.current?.dispatch(StackActions.popToTop());
};

export const reset = (routes, index = 0) => {
  navigationRef.current?.dispatch(
    CommonActions.reset({
      index,
      routes,
    })
  );
};

export const getCurrentRoute = () => {
  return navigationRef.current?.getCurrentRoute()?.name;
};

// Helper functions for common navigation patterns
export const NavigationService = {
  // Navigate to AR view
  openARMode: () => {
    navigate('AR');
  },

  // Navigate to store
  openStore: () => {
    navigate('Store');
  },

  // Navigate to a specific mindfulness activity
  startMindfulnessActivity: (activityId, duration) => {
    navigate('Session', { activityId, duration });
  },

  // Navigate to challenge details
  openChallengeDetails: (challengeId) => {
    navigate('ChallengeDetails', { challengeId });
  },

  // Navigate to playdate details
  openPlaydateDetails: (playdateId) => {
    navigate('PlaydateDetails', { playdateId });
  },

  // Navigate to profile
  openProfile: () => {
    navigate('Profile');
  },

  // Reset to main app after onboarding
  completeOnboarding: () => {
    reset([{ name: 'Main' }]);
  },

  // Navigate back
  goBack: () => {
    navigationRef.current?.goBack();
  },
};

export default NavigationService;
