import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePet } from '../contexts/PetContext';
import { BreathingExercise } from '../components/BreathingExercise';

export const MeditationScreen = () => {
  const [showBreathingExercise, setShowBreathingExercise] = useState(false);
  const { petState } = usePet();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Mindful Breathing</Text>
        <Text style={styles.subtitle}>
          Take a moment to breathe and center yourself
        </Text>

        <View style={styles.meditationCard}>
          <MaterialCommunityIcons
            name="meditation"
            size={64}
            color="#4CAF50"
          />
          <Text style={styles.cardTitle}>Breathing Challenge</Text>
          <Text style={styles.cardDescription}>
            Follow the guided breathing exercise to calm your mind and reduce stress.
            Complete different durations to unlock achievements!
          </Text>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => setShowBreathingExercise(true)}
          >
            <Text style={styles.startButtonText}>Start Challenge</Text>
          </TouchableOpacity>
        </View>

        {petState.emoji && (
          <View style={styles.petContainer}>
            <Text style={styles.petEmoji}>{petState.emoji}</Text>
            <Text style={styles.petText}>
              {petState.name} is ready to meditate with you!
            </Text>
          </View>
        )}

        <BreathingExercise
          visible={showBreathingExercise}
          onClose={() => setShowBreathingExercise(false)}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 30,
  },
  meditationCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  cardDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  petContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  petEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  petText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
