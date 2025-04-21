import React, { useState } from 'react';
import { View, StyleSheet, TouchableWithoutFeedback, Alert } from 'react-native';
import { usePet } from '../contexts/PetContext';
import { PetSprite } from './pet/PetSprites';

export const VirtualPet = () => {
  const { petState, updatePetState } = usePet();
  const [showParticles, setShowParticles] = useState(false);
  
  const getPetMood = () => {
    if (petState.energy < 20) return 'tired';
    if (petState.happiness > 80) return 'happy';
    if (petState.happiness < 30) return 'sad';
    return 'normal';
  };

  const handlePetInteraction = async () => {
    try {
      if (petState.energy < 20) {
        Alert.alert(
          'Tired Pet',
          `${petState.name} is too tired to play! Let them rest first.`,
          [{ text: 'OK' }]
        );
        return;
      }

      // Show particles
      setShowParticles(true);
      setTimeout(() => setShowParticles(false), 1000);

      // Update pet state
      await updatePetState({
        happiness: Math.min(petState.happiness + 5, 100),
        energy: Math.max(petState.energy - 2, 0),
      });
    } catch (error) {
      console.error('Error updating pet state:', error);
      Alert.alert('Error', 'Failed to update pet state. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={handlePetInteraction}>
        <View style={styles.petContainer}>
          <PetSprite
            type={petState.type}
            mood={getPetMood()}
          />
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
