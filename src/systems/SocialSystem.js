import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const db = firestore();
let currentUser = null;
let familyGroup = null;
const activeEvents = new Map();
const leaderboards = new Map();

const initialize = async () => {
  try {
    // Initialize Firebase listeners
    setupAuthListener();
    setupEventListeners();
    
    // Load cached data
    const cached = await AsyncStorage.getItem('social_cache');
    if (cached) {
      const { events, leaderboards } = JSON.parse(cached);
      activeEvents.clear();
      leaderboards.clear();
      events.forEach(([key, value]) => activeEvents.set(key, value));
      leaderboards.forEach(([key, value]) => leaderboards.set(key, value));
    }
  } catch (error) {
    console.error('Error initializing SocialSystem:', error);
  }
};

const setupAuthListener = () => {
  auth().onAuthStateChanged(async user => {
    currentUser = user;
    if (user) {
      await loadUserSocialData();
    }
  });
};

const setupEventListeners = () => {
  // Listen for global events
  db.collection('global_events')
    .where('endTime', '>', new Date())
    .onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added' || change.type === 'modified') {
          activeEvents.set(change.doc.id, change.doc.data());
        } else if (change.type === 'removed') {
          activeEvents.delete(change.doc.id);
        }
      });
      updateCache();
    });
};

const loadUserSocialData = async () => {
  if (!currentUser) return;

  // Load family group
  const familyDoc = await db
    .collection('family_groups')
    .where('members', 'array-contains', currentUser.uid)
    .get();

  if (!familyDoc.empty) {
    familyGroup = familyDoc.docs[0].data();
    setupFamilyListeners(familyDoc.docs[0].id);
  }
};

const setupFamilyListeners = familyId => {
  // Listen for family updates
  db.collection('family_groups')
    .doc(familyId)
    .onSnapshot(doc => {
      familyGroup = doc.data();
      DeviceEventEmitter.emit('familyUpdated', familyGroup);
    });

  // Listen for family challenges
  db.collection('family_challenges')
    .where('familyId', '==', familyId)
    .where('endTime', '>', new Date())
    .onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added' || change.type === 'modified') {
          DeviceEventEmitter.emit('familyChallengeUpdated', change.doc.data());
        }
      });
    });
};

const createFamilyGroup = async (familyData) => {
  const { name, members, preferences } = familyData;

  if (!name || !members || members.length === 0) {
    throw new Error('Invalid family group data');
  }

  const groupId = generateGroupId();
  
  return {
    groupId,
    name,
    members,
    preferences,
    createdAt: new Date().toISOString()
  };
};

const joinCommunityEvent = async (eventData) => {
  const { eventId, petId, role } = eventData;

  if (await isEventFull(eventId)) {
    return {
      success: false,
      error: 'Event has reached maximum capacity'
    };
  }

  return {
    success: true,
    eventDetails: await getEventDetails(eventId),
    participationStatus: 'confirmed'
  };
};

const initiatePlayDate = async (playDateData) => {
  const { initiator, invitee, duration, activity } = playDateData;

  if (await hasScheduleConflict(initiator, invitee, duration)) {
    return {
      status: 'failed',
      reason: 'schedule conflict'
    };
  }

  const playDateId = generatePlayDateId();
  const scheduledTime = calculateNextAvailableTime(initiator, invitee);

  return {
    playDateId,
    status: 'scheduled',
    scheduledTime,
    participants: [initiator, invitee],
    activity,
    duration
  };
};

const updateSocialScore = async (currentScore, interactions) => {
  const impactScore = calculateInteractionImpact(interactions);
  const newScore = Math.min(100, Math.max(0, currentScore + impactScore));
  
  return newScore;
};

// Helper functions
const generateGroupId = () => {
  return 'group_' + Math.random().toString(36).substr(2, 9);
};

const isEventFull = async (eventId) => {
  // Implementation would check event capacity
  return false;
};

const getEventDetails = async (eventId) => {
  // Implementation would fetch event details
  return {
    name: 'Community Playdate',
    time: new Date().toISOString(),
    location: 'Virtual Park',
    maxParticipants: 10
  };
};

const hasScheduleConflict = async (pet1, pet2, duration) => {
  // Implementation would check schedules
  return pet1 === 'busyPet';
};

const generatePlayDateId = () => {
  return 'play_' + Math.random().toString(36).substr(2, 9);
};

const calculateNextAvailableTime = (pet1, pet2) => {
  // Implementation would find next available time slot
  return new Date(Date.now() + 3600000).toISOString(); // 1 hour from now
};

const calculateInteractionImpact = (interactions) => {
  return interactions.reduce((total, interaction) => {
    const baseImpact = getBaseImpact(interaction);
    const multiplier = getInteractionMultiplier(interaction);
    return total + (baseImpact * multiplier);
  }, 0);
};

const getBaseImpact = (interaction) => {
  const impacts = {
    playDate: 5,
    groupActivity: 3
  };
  return impacts[interaction.type] || 1;
};

const getInteractionMultiplier = (interaction) => {
  if (interaction.success === false) return -0.5;
  if (interaction.participation === 'active') return 1.2;
  if (interaction.participation === 'disruptive') return -0.8;
  return 1;
};

const createCommunityEvent = async (eventData) => {
  if (!currentUser) throw new Error('User not authenticated');

  const event = {
    ...eventData,
    createdAt: firestore.FieldValue.serverTimestamp(),
    createdBy: currentUser.uid,
    participants: [],
    leaderboard: [],
    status: 'upcoming'
  };

  await db.collection('global_events').add(event);
};

const joinEvent = async (eventId) => {
  if (!currentUser) throw new Error('User not authenticated');

  await db.collection('global_events')
    .doc(eventId)
    .update({
      participants: firestore.FieldValue.arrayUnion(currentUser.uid)
    });

  // Create participant record
  await db.collection('event_participants').add({
    eventId,
    userId: currentUser.uid,
    joinedAt: firestore.FieldValue.serverTimestamp(),
    progress: 0,
    achievements: [],
    status: 'active'
  });
};

const updateEventProgress = async (eventId, progress) => {
  if (!currentUser) throw new Error('User not authenticated');

  const participantQuery = await db
    .collection('event_participants')
    .where('eventId', '==', eventId)
    .where('userId', '==', currentUser.uid)
    .get();

  if (!participantQuery.empty) {
    await participantQuery.docs[0].ref.update({
      progress,
      lastUpdated: firestore.FieldValue.serverTimestamp()
    });
  }
};

const getLeaderboard = async (eventId) => {
  const leaderboardQuery = await db
    .collection('event_participants')
    .where('eventId', '==', eventId)
    .orderBy('progress', 'desc')
    .limit(100)
    .get();

  const leaderboard = await Promise.all(
    leaderboardQuery.docs.map(async doc => {
      const userData = await db
        .collection('users')
        .doc(doc.data().userId)
        .get();
      
      return {
        ...doc.data(),
        user: userData.data()
      };
    })
  );

  leaderboards.set(eventId, leaderboard);
  updateCache();
  return leaderboard;
};

const sharePetMoment = async (moment) => {
  if (!currentUser) throw new Error('User not authenticated');

  const momentData = {
    ...moment,
    userId: currentUser.uid,
    createdAt: firestore.FieldValue.serverTimestamp(),
    likes: 0,
    comments: []
  };

  // Share with family if in a group
  if (familyGroup) {
    momentData.familyId = familyGroup.id;
  }

  await db.collection('pet_moments').add(momentData);
};

const reactToMoment = async (momentId, reaction) => {
  if (!currentUser) throw new Error('User not authenticated');

  await db.collection('pet_moments')
    .doc(momentId)
    .update({
      [`reactions.${reaction}`]: firestore.FieldValue.increment(1)
    });
};

const updateCache = async () => {
  try {
    await AsyncStorage.setItem('social_cache', JSON.stringify({
      events: Array.from(activeEvents.entries()),
      leaderboards: Array.from(leaderboards.entries())
    }));
  } catch (error) {
    console.error('Error updating social cache:', error);
  }
};

const calculateEventRewards = (progress, eventType) => {
  const baseRewards = {
    vitality_points: Math.floor(progress * 100),
    experience: Math.floor(progress * 50)
  };

  if (progress >= 1) { // Completed event
    baseRewards.special_item = getEventSpecialItem(eventType);
  }

  return baseRewards;
};

const getEventSpecialItem = (eventType) => {
  const specialItems = {
    wellness_week: { type: 'accessory', id: 'meditation_crystal', rarity: 'rare' },
    fitness_challenge: { type: 'boost', id: 'energy_surge', rarity: 'epic' },
    community_festival: { type: 'cosmetic', id: 'festival_aura', rarity: 'legendary' }
  };

  return specialItems[eventType] || { type: 'accessory', id: 'participation_badge', rarity: 'common' };
};

initialize();

export {
  createFamilyGroup,
  joinCommunityEvent,
  initiatePlayDate,
  updateSocialScore,
  createCommunityEvent,
  joinEvent,
  updateEventProgress,
  getLeaderboard,
  sharePetMoment,
  reactToMoment,
  calculateEventRewards
};
