// TypeScript migration of constants.js. Adds types and documentation.

/**
 * App-wide constant values for configuration and feature flags.
 */
export const APP_NAME = 'MindulPet';
export const METRICS_BUFFER_SIZE = 100;
export const DEFAULT_PET_TYPE = 'Canine';
export const DEFAULT_COOKING_SKILL = 'beginner';
export const DEFAULT_COOKING_TIME = 30;

export const SUPPORTED_PERSONALITIES = [
  'playful',
  'calm',
  'wise',
  'adventurous',
];

export const SUPPORTED_PET_TYPES = [
  'Canine',
  'Feline',
  'Mystical',
];

export const SUPPORTED_EMOTIONS = [
  'happy',
  'sad',
  'anxious',
  'calm',
  'playful',
  'tired',
];
