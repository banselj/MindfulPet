import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ParticleIcon = ({ name, color, size, style }) => (
  <Animated.View style={style}>
    <MaterialCommunityIcons name={name} size={size} color={color} />
  </Animated.View>
);

const moodParticles = {
  happy: {
    icons: ['heart', 'star', 'sparkle'],
    colors: ['#FF69B4', '#FFD700', '#FF6B6B'],
    count: 8,
  },
  sad: {
    icons: ['water-drop', 'cloud'],
    colors: ['#87CEEB', '#B0C4DE'],
    count: 4,
  },
  tired: {
    icons: ['sleep', 'moon-waning-crescent'],
    colors: ['#9370DB', '#483D8B'],
    count: 3,
  },
  normal: {
    icons: ['leaf', 'flower'],
    colors: ['#98FB98', '#90EE90'],
    count: 5,
  },
};

export const PetParticles = ({ mood, visible }) => {
  const particles = Array(moodParticles[mood]?.count || 0)
    .fill(0)
    .map(() => ({
      scale: useSharedValue(0),
      translate: useSharedValue({ x: 0, y: 0 }),
      rotate: useSharedValue(0),
      opacity: useSharedValue(0),
    }));

  useEffect(() => {
    if (visible) {
      particles.forEach((particle, index) => {
        const angle = (index * 2 * Math.PI) / particles.length;
        const radius = Math.random() * 50 + 50;
        const delay = index * 100;

        particle.scale.value = withSequence(
          withDelay(
            delay,
            withSpring(1, {
              damping: 10,
              stiffness: 100,
            })
          ),
          withDelay(500, withSpring(0))
        );

        particle.translate.value = withSequence(
          withDelay(
            delay,
            withTiming(
              {
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius,
              },
              {
                duration: 1000,
                easing: Easing.bezier(0.25, 0.1, 0.25, 1),
              }
            )
          )
        );

        particle.rotate.value = withSequence(
          withDelay(
            delay,
            withTiming(Math.random() * 4 * Math.PI, {
              duration: 1000,
            })
          )
        );

        particle.opacity.value = withSequence(
          withDelay(delay, withSpring(1)),
          withDelay(500, withSpring(0))
        );
      });
    }
  }, [visible]);

  if (!visible) return null;

  const particleConfig = moodParticles[mood] || moodParticles.normal;

  return (
    <View style={StyleSheet.absoluteFill}>
      {particles.map((particle, index) => {
        const animatedStyle = useAnimatedStyle(() => ({
          transform: [
            { scale: particle.scale.value },
            { translateX: particle.translate.value.x },
            { translateY: particle.translate.value.y },
            { rotate: `${particle.rotate.value}rad` },
          ],
          opacity: particle.opacity.value,
        }));

        const iconName =
          particleConfig.icons[index % particleConfig.icons.length];
        const color =
          particleConfig.colors[index % particleConfig.colors.length];

        return (
          <ParticleIcon
            key={index}
            name={iconName}
            color={color}
            size={20}
            style={[styles.particle, animatedStyle]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    left: '50%',
    top: '50%',
  },
});
