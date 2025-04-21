import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePet } from '../contexts/PetContext';
import { useAchievements } from '../contexts/AchievementsContext';

const INHALE_DURATION = 4000; // 4 seconds
const EXHALE_DURATION = 6000; // 6 seconds
const CYCLE_DURATION = INHALE_DURATION + EXHALE_DURATION; // 10 seconds

const INHALE_COLOR = '#4CAF50'; // Green
const EXHALE_COLOR = '#2196F3'; // Blue

const levels = [
  { 
    id: 'breathing_beginner',
    name: 'Beginner', 
    duration: 60, 
    badge: '🌱',
    requiredAchievement: null
  },
  { 
    id: 'breathing_intermediate',
    name: 'Intermediate', 
    duration: 300, 
    badge: '🌿',
    requiredAchievement: 'breathing_beginner'
  },
  { 
    id: 'breathing_advanced',
    name: 'Advanced', 
    duration: 600, 
    badge: '🌳',
    requiredAchievement: 'breathing_intermediate'
  },
  { 
    id: 'breathing_expert',
    name: 'Expert', 
    duration: 1800, 
    badge: '🏆',
    requiredAchievement: 'breathing_advanced'
  },
  { 
    id: 'breathing_grandmaster',
    name: 'Master', 
    duration: 3600, 
    badge: '⭐',
    requiredAchievement: 'breathing_expert'
  },
];

export const BreathingExercise = ({ visible, onClose }) => {
  const [phase, setPhase] = useState('ready'); // ready, inhale, exhale, complete
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const animation = useRef(new Animated.Value(0)).current;
  const colorAnimation = useRef(new Animated.Value(0)).current;
  const timer = useRef(null);
  const cycleCount = useRef(0);
  
  const { completeBreathingExercise } = usePet();
  const { trackBreathingExercise, achievements } = useAchievements();

  // Check if a level is unlocked
  const isLevelUnlocked = (level) => {
    if (!level.requiredAchievement) return true;
    return achievements[level.requiredAchievement]?.completed;
  };

  // Get the next locked level for displaying progress message
  const getNextLockedLevel = () => {
    return levels.find(level => !isLevelUnlocked(level));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startBreathing = (level) => {
    if (!isLevelUnlocked(level)) {
      return; // Don't start if level is locked
    }
    
    setSelectedLevel(level);
    setTimeRemaining(level.duration);
    setPhase('inhale');
    cycleCount.current = 0;
    runBreathingAnimation();
    
    timer.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer.current);
          setPhase('complete');
          completeBreathingExercise();
          trackBreathingExercise(level.duration);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const runBreathingAnimation = () => {
    animation.setValue(0);
    colorAnimation.setValue(0);
    
    Animated.parallel([
      // Scale animation
      Animated.sequence([
        // Inhale animation
        Animated.timing(animation, {
          toValue: 1,
          duration: INHALE_DURATION,
          useNativeDriver: false,
        }),
        // Exhale animation
        Animated.timing(animation, {
          toValue: 0,
          duration: EXHALE_DURATION,
          useNativeDriver: false,
        }),
      ]),
      // Color animation
      Animated.sequence([
        // Inhale color
        Animated.timing(colorAnimation, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
        Animated.timing(colorAnimation, {
          toValue: 1,
          duration: INHALE_DURATION,
          useNativeDriver: false,
        }),
        // Exhale color
        Animated.timing(colorAnimation, {
          toValue: 0,
          duration: EXHALE_DURATION,
          useNativeDriver: false,
        }),
      ]),
    ]).start(() => {
      cycleCount.current += 1;
      if (phase !== 'complete') {
        setPhase((prev) => prev === 'inhale' ? 'exhale' : 'inhale');
        runBreathingAnimation();
      }
    });
  };

  const getInstructions = () => {
    switch (phase) {
      case 'ready':
        return 'Choose your level and tap to begin';
      case 'inhale':
        return 'Breathe in... (4s)';
      case 'exhale':
        return 'Breathe out... (6s)';
      case 'complete':
        return `Great job! You've completed the ${selectedLevel.name} level!`;
      default:
        return '';
    }
  };

  const handleClose = () => {
    if (timer.current) {
      clearInterval(timer.current);
    }
    onClose();
  };

  const scale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });

  const circleColor = colorAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [EXHALE_COLOR, INHALE_COLOR],
  });

  useEffect(() => {
    return () => {
      if (timer.current) {
        clearInterval(timer.current);
      }
    };
  }, []);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.content}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <MaterialCommunityIcons name="close" size={24} color="#666" />
          </TouchableOpacity>

          <Text style={styles.title}>4-6 Breathing Exercise</Text>
          
          {phase === 'ready' ? (
            <View style={styles.levelContainer}>
              {levels.map((level) => {
                const isUnlocked = isLevelUnlocked(level);
                return (
                  <TouchableOpacity
                    key={level.name}
                    style={[
                      styles.levelButton,
                      !isUnlocked && styles.lockedLevel
                    ]}
                    onPress={() => startBreathing(level)}
                    disabled={!isUnlocked}
                  >
                    <Text style={styles.levelBadge}>
                      {isUnlocked ? level.badge : '🔒'}
                    </Text>
                    <View style={styles.levelInfo}>
                      <Text style={[
                        styles.levelName,
                        !isUnlocked && styles.lockedText
                      ]}>
                        {level.name}
                      </Text>
                      <Text style={[
                        styles.levelDuration,
                        !isUnlocked && styles.lockedText
                      ]}>
                        {formatTime(level.duration)}
                      </Text>
                    </View>
                    {achievements[level.id]?.completed && (
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={24}
                        color="#4CAF50"
                        style={styles.completedIcon}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
              
              {getNextLockedLevel() && (
                <Text style={styles.unlockHint}>
                  Complete {getNextLockedLevel().requiredAchievement.split('_')[1]} level to unlock next challenge
                </Text>
              )}
            </View>
          ) : (
            <>
              <Text style={styles.timer}>
                {formatTime(timeRemaining)}
              </Text>

              <TouchableOpacity
                style={styles.circleContainer}
                disabled={phase !== 'ready'}
              >
                <Animated.View
                  style={[
                    styles.breathCircle,
                    {
                      transform: [{ scale }],
                    },
                  ]}
                >
                  <Animated.View
                    style={[
                      styles.circleOutline,
                      {
                        borderColor: circleColor,
                      },
                    ]}
                  />
                </Animated.View>
              </TouchableOpacity>

              <Text style={[
                styles.instructions,
                { color: phase === 'inhale' ? INHALE_COLOR : EXHALE_COLOR }
              ]}>
                {getInstructions()}
              </Text>

              {phase === 'complete' && (
                <TouchableOpacity 
                  style={styles.doneButton} 
                  onPress={handleClose}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  closeButton: {
    position: 'absolute',
    right: 15,
    top: 15,
    padding: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    marginTop: 10,
  },
  timer: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 20,
  },
  levelContainer: {
    width: '100%',
    padding: 10,
  },
  levelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  lockedLevel: {
    backgroundColor: '#f5f5f5',
    opacity: 0.7,
  },
  levelInfo: {
    flex: 1,
  },
  levelBadge: {
    fontSize: 24,
    marginRight: 15,
  },
  levelName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  levelDuration: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  lockedText: {
    color: '#999',
  },
  completedIcon: {
    marginLeft: 10,
  },
  unlockHint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 10,
  },
  circleContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 30,
  },
  breathCircle: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleOutline: {
    width: '100%',
    height: '100%',
    borderRadius: 75,
    borderWidth: 8,
    borderColor: INHALE_COLOR,
  },
  instructions: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  doneButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 10,
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
