import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Text,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import PetRenderer from '../../components/pet/PetRenderer';
import PetInteractionSystem from '../../systems/PetInteraction';
import PetHealthSystem from '../../systems/PetHealth';
import { updatePet } from '../../state/slices/petSlice';
import { addCurrency } from '../../state/slices/currencySlice';

const PetInteractionScreen = () => {
  const dispatch = useDispatch();
  const pet = useSelector(state => state.pet.currentPet);
  const [interactionCooldowns, setInteractionCooldowns] = useState({});
  const [showInteractionMenu, setShowInteractionMenu] = useState(false);
  const menuAnim = useRef(new Animated.Value(0)).current;

  // Update cooldowns every second
  useEffect(() => {
    const interval = setInterval(() => {
      const newCooldowns = {};
      Object.values(PetInteractionSystem.INTERACTION_TYPES).forEach(type => {
        newCooldowns[type] = PetInteractionSystem.getRemainingCooldown(type);
      });
      setInteractionCooldowns(newCooldowns);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Animate interaction menu
  useEffect(() => {
    Animated.spring(menuAnim, {
      toValue: showInteractionMenu ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [showInteractionMenu]);

  const handleInteraction = async (interactionType) => {
    if (interactionCooldowns[interactionType] > 0) {
      Alert.alert(
        'Interaction Unavailable',
        `Please wait ${Math.ceil(interactionCooldowns[interactionType] / 1000)} seconds`
      );
      return;
    }

    const result = PetInteractionSystem.interact(pet, interactionType);
    
    if (result.success) {
      // Update pet state
      dispatch(updatePet(pet));
      
      // Award currency based on interaction effectiveness
      const currencyAmount = Math.floor(result.effectiveness * 10);
      dispatch(addCurrency({
        type: 'vitality_points',
        amount: currencyAmount,
      }));

      // Show interaction message
      Alert.alert('Success', result.message);
    } else {
      Alert.alert('Cannot Interact', result.message);
    }
  };

  const renderInteractionButton = (type, icon, label) => {
    const cooldown = interactionCooldowns[type] || 0;
    const isDisabled = cooldown > 0;

    return (
      <TouchableOpacity
        style={[styles.interactionButton, isDisabled && styles.disabledButton]}
        onPress={() => handleInteraction(type)}
        disabled={isDisabled}
      >
        <MaterialCommunityIcons
          name={icon}
          size={24}
          color={isDisabled ? '#999' : '#fff'}
        />
        <Text style={[styles.buttonLabel, isDisabled && styles.disabledLabel]}>
          {label}
        </Text>
        {isDisabled && (
          <Text style={styles.cooldownText}>
            {Math.ceil(cooldown / 1000)}s
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderInteractionMenu = () => {
    const translateY = menuAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [200, 0],
    });

    return (
      <Animated.View
        style={[
          styles.interactionMenu,
          {
            transform: [{ translateY }],
          },
        ]}
      >
        <BlurView intensity={80} style={styles.menuContent}>
          <View style={styles.buttonRow}>
            {renderInteractionButton(
              PetInteractionSystem.INTERACTION_TYPES.PET,
              'hand-heart',
              'Pet'
            )}
            {renderInteractionButton(
              PetInteractionSystem.INTERACTION_TYPES.PLAY,
              'play',
              'Play'
            )}
            {renderInteractionButton(
              PetInteractionSystem.INTERACTION_TYPES.FEED,
              'food',
              'Feed'
            )}
          </View>
          <View style={styles.buttonRow}>
            {renderInteractionButton(
              PetInteractionSystem.INTERACTION_TYPES.GROOM,
              'brush',
              'Groom'
            )}
            {renderInteractionButton(
              PetInteractionSystem.INTERACTION_TYPES.HEAL,
              'medical-bag',
              'Heal'
            )}
            {renderInteractionButton(
              PetInteractionSystem.INTERACTION_TYPES.EXERCISE,
              'run',
              'Exercise'
            )}
          </View>
          <View style={styles.buttonRow}>
            {renderInteractionButton(
              PetInteractionSystem.INTERACTION_TYPES.MEDITATE,
              'meditation',
              'Meditate'
            )}
          </View>
        </BlurView>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Pet display area */}
      <View style={styles.petContainer}>
        <PetRenderer
          pet={pet}
          size={250}
          onInteractionComplete={() => {
            // Handle interaction completion
          }}
        />
      </View>

      {/* Status indicators */}
      <View style={styles.statusContainer}>
        <View style={styles.statusBar}>
          <MaterialCommunityIcons name="heart" size={20} color="#FF6B6B" />
          <View style={styles.statusBarTrack}>
            <View
              style={[
                styles.statusBarFill,
                { width: `${pet.attributes.physicalHealth * 100}%` },
              ]}
            />
          </View>
        </View>
        <View style={styles.statusBar}>
          <MaterialCommunityIcons name="lightning-bolt" size={20} color="#4CAF50" />
          <View style={styles.statusBarTrack}>
            <View
              style={[
                styles.statusBarFill,
                {
                  width: `${pet.attributes.energy * 100}%`,
                  backgroundColor: '#4CAF50',
                },
              ]}
            />
          </View>
        </View>
        <View style={styles.statusBar}>
          <MaterialCommunityIcons name="emoticon" size={20} color="#2196F3" />
          <View style={styles.statusBarTrack}>
            <View
              style={[
                styles.statusBarFill,
                {
                  width: `${pet.attributes.happiness * 100}%`,
                  backgroundColor: '#2196F3',
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Interaction menu toggle */}
      <TouchableOpacity
        style={styles.menuToggle}
        onPress={() => setShowInteractionMenu(!showInteractionMenu)}
      >
        <MaterialCommunityIcons
          name={showInteractionMenu ? 'close' : 'gesture-tap'}
          size={30}
          color="#fff"
        />
      </TouchableOpacity>

      {/* Interaction menu */}
      {renderInteractionMenu()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  petContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusContainer: {
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    marginLeft: 10,
    overflow: 'hidden',
  },
  statusBarFill: {
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 4,
  },
  menuToggle: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  interactionMenu: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  menuContent: {
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  interactionButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonLabel: {
    color: '#fff',
    marginTop: 5,
    fontSize: 12,
  },
  disabledLabel: {
    color: '#999',
  },
  cooldownText: {
    position: 'absolute',
    bottom: -20,
    color: '#666',
    fontSize: 12,
  },
});

export default PetInteractionScreen;
