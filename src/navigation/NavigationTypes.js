// Navigation types for TypeScript support
export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  AR: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Mindfulness: undefined;
  Community: undefined;
  Profile: undefined;
};

export type HomeStackParamList = {
  PetInteraction: undefined;
  PetStats: undefined;
  Store: undefined;
};

export type MindfulnessStackParamList = {
  Activities: undefined;
  Session: {
    activityId: string;
    duration: number;
  };
};

export type CommunityStackParamList = {
  Feed: undefined;
  ChallengeDetails: { challengeId: string };
  PlaydateDetails: { playdateId: string };
};
