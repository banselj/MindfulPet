import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  Slider,
} from 'react-native';
import { usePet } from '../contexts/PetContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Alert } from 'react-native';

const pets = [
  {
    id: 'cat',
    name: 'Whiskers',
    type: 'Cat',
    description: 'A playful kitten who loves meditation',
    emoji: '🐱',
    personality: 'Calm and curious',
    color: '#FF9800',
  },
  {
    id: 'dog',
    name: 'Buddy',
    type: 'Dog',
    description: 'An energetic puppy ready to join your mindfulness journey',
    emoji: '🐶',
    personality: 'Enthusiastic and loyal',
    color: '#4CAF50',
  },
  {
    id: 'bunny',
    name: 'Hopps',
    type: 'Bunny',
    description: 'A zen master in training with fluffy ears',
    emoji: '🐰',
    personality: 'Peaceful and gentle',
    color: '#E91E63',
  },
  {
    id: 'panda',
    name: 'Pamboo',
    type: 'Panda',
    description: 'A relaxed panda who knows the art of balance',
    emoji: '🐼',
    personality: 'Balanced and wise',
    color: '#9C27B0',
  },
];

const attributes = [
  {
    id: 'size',
    label: 'Size',
    min: 'Small',
    max: 'Large',
  },
  {
    id: 'age',
    label: 'Age',
    min: 'Young',
    max: 'Old',
  },
  {
    id: 'energy',
    label: 'Energy Level',
    min: 'Calm',
    max: 'Active',
  },
  {
    id: 'sociability',
    label: 'Sociability',
    min: 'Independent',
    max: 'Social',
  },
  {
    id: 'emotionality',
    label: 'Emotional Sensitivity',
    min: 'Reserved',
    max: 'Expressive',
  },
  {
    id: 'routine',
    label: 'Daily Routine',
    min: 'Flexible',
    max: 'Structured',
  },
];

const AttributeSlider = ({ attribute, value, onChange }) => (
  <View style={styles.sliderContainer}>
    <Text style={styles.sliderLabel}>{attribute.label}</Text>
    <View style={styles.sliderRow}>
      <Text style={styles.sliderMinMax}>{attribute.min}</Text>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={100}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor="#4CAF50"
        maximumTrackTintColor="#E0E0E0"
        thumbTintColor="#4CAF50"
      />
      <Text style={styles.sliderMinMax}>{attribute.max}</Text>
    </View>
  </View>
);

export const PetSelectionScreen = ({ navigation }) => {
  const [selectedPet, setSelectedPet] = useState(null);
  const [attributeValues, setAttributeValues] = useState(
    attributes.reduce((acc, attr) => ({ ...acc, [attr.id]: 50 }), {})
  );
  const { selectPet } = usePet();

  const handleAttributeChange = (attributeId, value) => {
    setAttributeValues(prev => ({
      ...prev,
      [attributeId]: value,
    }));
  };

  const handlePetSelection = async (pet) => {
    try {
      setSelectedPet(pet);
      const personalizedPet = {
        ...pet,
        attributes: attributeValues,
      };
      await selectPet(personalizedPet);
      navigation.replace('MainTabs');
    } catch (error) {
      console.error('Error selecting pet:', error);
      Alert.alert('Error', 'Failed to select pet. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your MindfulPal</Text>
        <Text style={styles.subtitle}>
          Select and personalize your mindfulness companion
        </Text>
      </View>

      <View style={styles.petsContainer}>
        {pets.map((pet) => (
          <TouchableOpacity
            key={pet.id}
            style={[
              styles.petCard,
              selectedPet?.id === pet.id && styles.selectedPet,
              { borderColor: pet.color },
            ]}
            onPress={() => setSelectedPet(pet)}
          >
            <View style={styles.petHeader}>
              <Text style={styles.petEmoji}>{pet.emoji}</Text>
              <View style={styles.petInfo}>
                <Text style={styles.petName}>{pet.name}</Text>
                <Text style={styles.petType}>{pet.type}</Text>
              </View>
              {selectedPet?.id === pet.id && (
                <MaterialCommunityIcons
                  name="check-circle"
                  size={24}
                  color={pet.color}
                />
              )}
            </View>
            <Text style={styles.petDescription}>{pet.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedPet && (
        <View style={styles.attributesSection}>
          <Text style={styles.attributesTitle}>Personalize Your Pet</Text>
          <Text style={styles.attributesSubtitle}>
            Adjust these attributes to match your preferences
          </Text>
          {attributes.map((attribute) => (
            <AttributeSlider
              key={attribute.id}
              attribute={attribute}
              value={attributeValues[attribute.id]}
              onChange={(value) => handleAttributeChange(attribute.id, value)}
            />
          ))}
          <TouchableOpacity
            style={[styles.confirmButton, { backgroundColor: selectedPet.color }]}
            onPress={() => handlePetSelection(selectedPet)}
          >
            <Text style={styles.confirmButtonText}>Begin Journey Together</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  petsContainer: {
    padding: 20,
  },
  petCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  selectedPet: {
    borderWidth: 3,
  },
  petHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  petEmoji: {
    fontSize: 40,
    marginRight: 15,
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  petType: {
    fontSize: 16,
    color: '#666',
  },
  petDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  attributesSection: {
    padding: 20,
    backgroundColor: '#f8f8f8',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  attributesTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  attributesSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  sliderContainer: {
    marginBottom: 20,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slider: {
    flex: 1,
    marginHorizontal: 10,
  },
  sliderMinMax: {
    fontSize: 12,
    color: '#666',
    width: 70,
  },
  confirmButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
