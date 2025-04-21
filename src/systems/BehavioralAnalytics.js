import * as tf from '@tensorflow/tfjs';

// Utility functions
const normalizeTime = (timestamp) => {
  const date = new Date(timestamp);
  return (date.getHours() * 60 + date.getMinutes()) / (24 * 60);
};

const getDayPeriod = (timestamp) => {
  const hour = new Date(timestamp).getHours();
  if (hour < 6) return 'night';
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
};

const encodeActivityType = (activity) => {
  const activities = ['exercise', 'work', 'leisure', 'rest', 'social'];
  return activities.indexOf(activity) / activities.length;
};

const encodeMood = (mood) => {
  const moods = ['very_negative', 'negative', 'neutral', 'positive', 'very_positive'];
  return moods.indexOf(mood) / moods.length;
};

const encodeLocation = (location) => {
  const locations = ['home', 'work', 'outdoors', 'transit', 'other'];
  return locations.indexOf(location) / locations.length;
};

const encodeWeather = (weather) => {
  const conditions = ['sunny', 'cloudy', 'rainy', 'stormy'];
  return conditions.indexOf(weather) / conditions.length;
};

// Behavioral Analytics functions
export const processBehavioralData = async (data) => {
  if (!data.action || !data.timestamp || data.duration < 0) {
    throw new Error('Invalid behavioral data');
  }

  return {
    processedAction: data.action,
    emotionalImpact: calculateEmotionalImpact(data),
    timestamp: data.timestamp
  };
};

const calculateEmotionalImpact = (data) => {
  const baseImpact = {
    play: 0.8,
    feed: 0.6,
    sleep: 0.3
  }[data.action] || 0.1;

  return baseImpact * (data.duration / 300);
};
