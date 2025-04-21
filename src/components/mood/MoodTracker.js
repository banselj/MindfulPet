import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MoodService } from '../../services/moodService';
import { usePetContext } from '../../contexts/PetContext';
import { RewardsService } from '../../services/rewardsService';
import { auth } from '../../services/firebase';

const moods = [
  { emoji: '😊', name: 'happy' },
  { emoji: '😌', name: 'calm' },
  { emoji: '😐', name: 'neutral' },
  { emoji: '😔', name: 'sad' },
  { emoji: '😰', name: 'anxious' },
];

export const MoodTracker = () => {
  const [selectedMood, setSelectedMood] = useState(null);
  const { updatePetMood } = usePetContext();
  const userId = auth.currentUser?.uid;

  const handleMoodSelect = async (mood) => {
    if (!userId) return;

    setSelectedMood(mood);
    try {
      // Log mood
      await MoodService.logMood(userId, mood.name);
      
      // Update pet's mood
      await updatePetMood(mood.name);
      
      // Award Calm Coins for daily check-in
      await RewardsService.addCalmCoins(
        userId, 
        RewardsService.getRewardForAction('daily_checkin')
      );
    } catch (error) {
      console.error('Error logging mood:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How are you feeling?</Text>
      <View style={styles.moodGrid}>
        {moods.map((mood) => (
          <Pressable
            key={mood.name}
            style={[
              styles.moodButton,
              selectedMood?.name === mood.name && styles.selectedMood,
            ]}
            onPress={() => handleMoodSelect(mood)}
          >
            <Text style={styles.emoji}>{mood.emoji}</Text>
            <Text style={styles.moodName}>{mood.name}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 12,
  },
  moodButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    width: '18%',
  },
  selectedMood: {
    backgroundColor: '#e0f2f1',
    borderColor: '#80cbc4',
    borderWidth: 2,
  },
  emoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodName: {
    fontSize: 12,
    textAlign: 'center',
  },
});
