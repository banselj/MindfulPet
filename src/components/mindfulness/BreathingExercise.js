import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Pressable } from 'react-native';
import { MindfulnessService } from '../../services/mindfulnessService';
import { auth } from '../../services/firebase';

export const BreathingExercise = ({ exerciseId = 'box-breathing', onComplete }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState('ready');
  const [timeLeft, setTimeLeft] = useState(0);
  const animation = useRef(new Animated.Value(0)).current;
  
  const exercise = MindfulnessService.getBreathingExercises()
    .find(ex => ex.id === exerciseId);

  const startExercise = () => {
    setIsActive(true);
    setCurrentPhase('inhale');
    runAnimation();
  };

  const runAnimation = () => {
    const { inhale, holdIn, exhale, holdOut } = exercise.pattern;
    const sequence = [
      // Inhale
      Animated.timing(animation, {
        toValue: 1,
        duration: inhale * 1000,
        useNativeDriver: true,
      }),
      // Hold
      Animated.timing(animation, {
        toValue: 1,
        duration: holdIn * 1000,
        useNativeDriver: true,
      }),
      // Exhale
      Animated.timing(animation, {
        toValue: 0,
        duration: exhale * 1000,
        useNativeDriver: true,
      }),
      // Hold
      Animated.timing(animation, {
        toValue: 0,
        duration: holdOut * 1000,
        useNativeDriver: true,
      }),
    ];

    Animated.sequence(sequence).start(({ finished }) => {
      if (finished && isActive) {
        runAnimation();
      }
    });
  };

  useEffect(() => {
    let interval;
    if (isActive) {
      const totalTime = exercise.duration;
      setTimeLeft(totalTime);
      
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            clearInterval(interval);
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const handleComplete = async () => {
    if (auth.currentUser?.uid) {
      await MindfulnessService.logExercise(
        auth.currentUser.uid,
        'breathing',
        exercise.duration
      );
    }
    onComplete?.();
  };

  const animatedStyle = {
    transform: [
      {
        scale: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.5],
        }),
      },
    ],
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{exercise.name}</Text>
      <Text style={styles.description}>{exercise.description}</Text>
      
      <Pressable 
        onPress={isActive ? null : startExercise}
        style={styles.circleContainer}
      >
        <Animated.View style={[styles.breathCircle, animatedStyle]} />
        <Text style={styles.phaseText}>
          {isActive ? currentPhase : 'Tap to start'}
        </Text>
      </Pressable>
      
      {isActive && (
        <Text style={styles.timer}>
          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    height: 200,
  },
  breathCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#80cbc4',
    opacity: 0.8,
  },
  phaseText: {
    position: 'absolute',
    fontSize: 18,
    color: '#333',
  },
  timer: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 20,
  },
});
