import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { BlurView } from 'expo-blur';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { logHabitProgress } from '../../state/slices/habitSlice';
import { addVitalityPoints } from '../../state/slices/monetizationSlice';
import PetService from '../../services/pet/PetService';

const MindfulnessScreen = () => {
  const dispatch = useDispatch();
  const [activeSession, setActiveSession] = useState(null);
  const [sound, setSound] = useState(null);
  const subscription = useSelector(state => state.monetization.subscription);

  const mindfulnessActivities = [
    {
      id: 'breathing',
      title: 'Breathing Exercise',
      duration: 5, // minutes
      points: 50,
      premium: false,
      description: 'A simple breathing exercise to calm your mind.',
      icon: '🫁',
    },
    {
      id: 'meditation',
      title: 'Guided Meditation',
      duration: 10,
      points: 100,
      premium: true,
      description: 'A calming guided meditation session.',
      icon: '🧘‍♂️',
    },
    {
      id: 'gratitude',
      title: 'Gratitude Journal',
      duration: 5,
      points: 50,
      premium: false,
      description: 'Write down three things you're grateful for.',
      icon: '📝',
    },
    {
      id: 'bodyscan',
      title: 'Body Scan',
      duration: 15,
      points: 150,
      premium: true,
      description: 'A relaxing body awareness meditation.',
      icon: '🧬',
    },
  ];

  const startActivity = async (activity) => {
    if (activity.premium && subscription.tier === 'free') {
      // Show premium upgrade prompt
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveSession(activity);

    // Load and play ambient sound
    try {
      const { sound: audioSound } = await Audio.Sound.createAsync(
        require('../../../assets/sounds/ambient.mp3'),
        { shouldPlay: true, isLooping: true }
      );
      setSound(audioSound);
    } catch (error) {
      console.error('Error loading sound', error);
    }

    // Start timer for activity duration
    setTimeout(() => {
      completeActivity(activity);
    }, activity.duration * 60 * 1000);
  };

  const completeActivity = async (activity) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Stop sound if playing
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
    }

    // Update habit progress
    dispatch(logHabitProgress({
      habitName: 'meditation',
      amount: activity.duration,
      timestamp: new Date().toISOString(),
    }));

    // Award points
    dispatch(addVitalityPoints(activity.points));

    // Update pet state
    PetService.updatePetState({
      habitName: 'meditation',
      amount: activity.duration,
    });

    setActiveSession(null);
    setSound(null);
  };

  const renderActiveSession = () => {
    if (!activeSession) return null;

    return (
      <BlurView intensity={90} style={styles.sessionContainer}>
        <Text style={styles.sessionTitle}>{activeSession.title}</Text>
        <Text style={styles.sessionTimer}>{activeSession.duration}:00</Text>
        <TouchableOpacity
          style={styles.endButton}
          onPress={() => completeActivity(activeSession)}
        >
          <Text style={styles.endButtonText}>End Session</Text>
        </TouchableOpacity>
      </BlurView>
    );
  };

  return (
    <View style={styles.container}>
      {!activeSession ? (
        <ScrollView style={styles.scrollView}>
          <Text style={styles.header}>Mindfulness Activities</Text>
          {mindfulnessActivities.map((activity) => (
            <TouchableOpacity
              key={activity.id}
              style={[
                styles.activityCard,
                activity.premium && styles.premiumCard,
              ]}
              onPress={() => startActivity(activity)}
            >
              <Text style={styles.activityIcon}>{activity.icon}</Text>
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>
                  {activity.title}
                  {activity.premium && ' 💎'}
                </Text>
                <Text style={styles.activityDescription}>
                  {activity.description}
                </Text>
                <Text style={styles.activityMeta}>
                  {activity.duration} mins • {activity.points} points
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        renderActiveSession()
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  premiumCard: {
    backgroundColor: '#FFF9E6',
  },
  activityIcon: {
    fontSize: 30,
    marginRight: 15,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  activityDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  activityMeta: {
    fontSize: 12,
    color: '#999',
  },
  sessionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sessionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  sessionTimer: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  endButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  endButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MindfulnessScreen;
