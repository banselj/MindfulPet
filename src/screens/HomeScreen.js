import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { usePet } from '../contexts/PetContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PetSprite } from '../components/pet/PetSprites';
import { PetAnimation } from '../components/pet/PetAnimation';

const StatBar = ({ label, value, color }) => (
  <View style={styles.statContainer}>
    <Text style={styles.statLabel}>{label}</Text>
    <View style={styles.statBarBackground}>
      <View
        style={[styles.statBarFill, { width: `${value}%`, backgroundColor: color }]}
      />
    </View>
    <Text style={styles.statValue}>{value}%</Text>
  </View>
);

export const HomeScreen = ({ navigation }) => {
  const pet = usePet();
  const [isActionDisabled, setIsActionDisabled] = useState(false);

  useEffect(() => {
    if (!pet.id) {
      navigation.replace('PetSelection');
    }
  }, [pet.id, navigation]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigation.replace('Auth');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const handleAction = async (actionType) => {
    if (isActionDisabled) {
      Alert.alert('Please wait', 'Your pet needs some time to rest between actions.');
      return;
    }

    try {
      setIsActionDisabled(true);
      let updates = {};

      switch (actionType) {
        case 'feed':
          updates = {
            health: Math.min(100, pet.health + 20),
            happiness: Math.min(100, pet.happiness + 10),
            lastFed: new Date().toISOString(),
          };
          break;
        case 'play':
          if (pet.energy < 20) {
            Alert.alert('Low Energy', 'Your pet needs to rest before playing.');
            return;
          }
          updates = {
            happiness: Math.min(100, pet.happiness + 25),
            energy: Math.max(0, pet.energy - 20),
            lastPlayed: new Date().toISOString(),
          };
          break;
        case 'rest':
          updates = {
            energy: Math.min(100, pet.energy + 40),
            health: Math.min(100, pet.health + 10),
            lastRested: new Date().toISOString(),
          };
          break;
        case 'meditate':
          updates = {
            happiness: Math.min(100, pet.happiness + 15),
            energy: Math.min(100, pet.energy + 15),
            lastMeditated: new Date().toISOString(),
          };
          break;
      }

      await pet.updateStats(updates);
      setTimeout(() => setIsActionDisabled(false), 3000); // Enable actions after 3 seconds
    } catch (error) {
      console.error('Error performing action:', error);
      Alert.alert('Error', 'Failed to perform action. Please try again.');
      setIsActionDisabled(false);
    }
  };

  if (!pet.id) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>MindfulPet</Text>
          <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
            <MaterialCommunityIcons name="logout" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.petContainer}>
          <View style={styles.petWrapper}>
            <PetSprite
              type={pet.type}
              mood={pet.energy < 20 ? 'tired' : pet.happiness > 80 ? 'happy' : 'normal'}
            />
            <PetAnimation
              petState={pet}
              onInteract={async () => {
                try {
                  await pet.updateStats({
                    happiness: Math.min(100, pet.happiness + 5),
                    energy: Math.max(0, pet.energy - 2),
                  });
                } catch (error) {
                  console.error('Error updating pet stats:', error);
                }
              }}
            />
          </View>
          <Text style={styles.petName}>{pet.name}</Text>
          <Text style={styles.petPersonality}>{pet.personality}</Text>
        </View>

        <View style={styles.statsContainer}>
          <StatBar label="Happiness" value={Math.round(pet.happiness)} color="#4CAF50" />
          <StatBar label="Energy" value={Math.round(pet.energy)} color="#2196F3" />
          <StatBar label="Health" value={Math.round(pet.health)} color="#FF9800" />
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
            onPress={() => handleAction('feed')}
            disabled={isActionDisabled}
          >
            <MaterialCommunityIcons name="food" size={24} color="white" />
            <Text style={styles.actionButtonText}>Feed</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
            onPress={() => handleAction('play')}
            disabled={isActionDisabled}
          >
            <MaterialCommunityIcons name="play" size={24} color="white" />
            <Text style={styles.actionButtonText}>Play</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
            onPress={() => handleAction('rest')}
            disabled={isActionDisabled}
          >
            <MaterialCommunityIcons name="sleep" size={24} color="white" />
            <Text style={styles.actionButtonText}>Rest</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#9C27B0' }]}
            onPress={() => handleAction('meditate')}
            disabled={isActionDisabled}
          >
            <MaterialCommunityIcons name="meditation" size={24} color="white" />
            <Text style={styles.actionButtonText}>Meditate</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  signOutButton: {
    padding: 8,
  },
  petContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  petWrapper: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  petName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  petPersonality: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  statsContainer: {
    marginBottom: 20,
  },
  statContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statLabel: {
    width: 80,
    fontSize: 16,
    color: '#333',
  },
  statBarBackground: {
    flex: 1,
    height: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  statValue: {
    width: 40,
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  actionButton: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  actionButtonText: {
    color: 'white',
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
  },
});
