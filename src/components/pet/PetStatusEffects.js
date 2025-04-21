import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const PetStatusEffects = ({ pet, onEffectPress }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const renderActiveEffects = () => {
    const activeEffects = [
      ...pet.enhancements.activeEffects,
      ...pet.enhancements.evolutionBoosts,
    ].filter(effect => {
      const now = Date.now();
      const appliedAt = new Date(effect.appliedAt).getTime();
      return now - appliedAt < effect.duration;
    });

    if (activeEffects.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Effects</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {activeEffects.map((effect, index) => {
            const timeRemaining = Math.max(
              0,
              effect.duration - (Date.now() - new Date(effect.appliedAt).getTime())
            );
            const minutesRemaining = Math.ceil(timeRemaining / (1000 * 60));

            return (
              <TouchableOpacity
                key={`${effect.id}_${index}`}
                style={styles.effectCard}
                onPress={() => onEffectPress(effect)}
              >
                <MaterialCommunityIcons
                  name={getEffectIcon(effect.id)}
                  size={24}
                  color="#2196F3"
                />
                <Text style={styles.effectName}>{effect.name}</Text>
                <Text style={styles.effectTime}>{minutesRemaining}m</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderAchievements = () => {
    const recentAchievements = pet.history
      .filter(entry => entry.event.includes('achievement'))
      .slice(-3);

    if (recentAchievements.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Achievements</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {recentAchievements.map((achievement, index) => (
            <View key={index} style={styles.achievementCard}>
              <MaterialCommunityIcons
                name="trophy"
                size={24}
                color="#FFD700"
              />
              <Text style={styles.achievementText}>
                {achievement.event.replace('achievement:', '')}
              </Text>
              <Text style={styles.achievementTime}>
                {formatTimestamp(achievement.timestamp)}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderStatusConditions = () => {
    const conditions = [];

    if (pet.attributes.illness) {
      conditions.push({
        id: 'illness',
        name: 'Sick',
        icon: 'medical-bag',
        color: '#FF6B6B',
      });
    }

    if (pet.attributes.energy < 0.3) {
      conditions.push({
        id: 'tired',
        name: 'Tired',
        icon: 'sleep',
        color: '#9C27B0',
      });
    }

    if (pet.attributes.happiness < 0.3) {
      conditions.push({
        id: 'sad',
        name: 'Sad',
        icon: 'emoticon-sad',
        color: '#607D8B',
      });
    }

    if (conditions.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status Conditions</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {conditions.map(condition => (
            <View key={condition.id} style={styles.conditionCard}>
              <MaterialCommunityIcons
                name={condition.icon}
                size={24}
                color={condition.color}
              />
              <Text style={[styles.conditionText, { color: condition.color }]}>
                {condition.name}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  if (!pet) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <BlurView intensity={80} style={styles.content}>
        {renderActiveEffects()}
        {renderStatusConditions()}
        {renderAchievements()}
      </BlurView>
    </Animated.View>
  );
};

const getEffectIcon = (effectId) => {
  const icons = {
    sparkle_aura: 'star-face',
    mystic_elixir: 'flask',
    evolution_boost: 'dna',
    healing_potion: 'medical-bag',
    // Add more effect icons
  };
  return icons[effectId] || 'star';
};

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    borderRadius: 15,
    overflow: 'hidden',
  },
  content: {
    padding: 15,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  effectCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    borderRadius: 10,
    marginRight: 10,
    alignItems: 'center',
    minWidth: 80,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  effectName: {
    fontSize: 12,
    color: '#333',
    marginTop: 5,
    textAlign: 'center',
  },
  effectTime: {
    fontSize: 10,
    color: '#666',
    marginTop: 3,
  },
  achievementCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    borderRadius: 10,
    marginRight: 10,
    alignItems: 'center',
    minWidth: 120,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  achievementText: {
    fontSize: 12,
    color: '#333',
    marginTop: 5,
    textAlign: 'center',
  },
  achievementTime: {
    fontSize: 10,
    color: '#666',
    marginTop: 3,
  },
  conditionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    borderRadius: 10,
    marginRight: 10,
    alignItems: 'center',
    minWidth: 80,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  conditionText: {
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
});

export default PetStatusEffects;
