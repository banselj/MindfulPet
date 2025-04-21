import { useEffect } from 'react';
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

export const usePetAnimation = (mood) => {
  // Shared values for different animations
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const breathe = useSharedValue(1);
  const eyeScale = useSharedValue(1);
  const tailRotation = useSharedValue(0);
  const bounce = useSharedValue(0);

  // Breathing animation
  useEffect(() => {
    breathe.value = withRepeat(
      withSequence(
        withTiming(1.05, {
          duration: 2000,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        }),
        withTiming(1, {
          duration: 2000,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        })
      ),
      -1,
      true
    );
  }, []);

  // Blinking animation
  useEffect(() => {
    const blink = () => {
      eyeScale.value = withSequence(
        withTiming(0.1, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
      // Random interval between blinks
      setTimeout(blink, Math.random() * 3000 + 2000);
    };
    blink();
  }, []);

  // Tail wagging based on mood
  useEffect(() => {
    if (mood === 'happy') {
      tailRotation.value = withRepeat(
        withSequence(
          withTiming(-0.2, { duration: 400 }),
          withTiming(0.2, { duration: 400 })
        ),
        -1,
        true
      );
    } else {
      tailRotation.value = withSpring(0);
    }
  }, [mood]);

  // Mood-based animations
  useEffect(() => {
    switch (mood) {
      case 'happy':
        bounce.value = withRepeat(
          withSequence(
            withSpring(1.1),
            withSpring(1)
          ),
          2,
          true
        );
        break;
      case 'sad':
        bounce.value = withSpring(0.95);
        break;
      case 'tired':
        bounce.value = withRepeat(
          withSequence(
            withTiming(0.98, { duration: 1000 }),
            withTiming(1, { duration: 1000 })
          ),
          -1,
          true
        );
        break;
      default:
        bounce.value = withSpring(1);
    }
  }, [mood]);

  // Interaction handlers
  const handlePet = () => {
    scale.value = withSequence(
      withSpring(1.2),
      withSpring(1)
    );
    rotation.value = withSequence(
      withSpring(-0.1),
      withSpring(0.1),
      withSpring(0)
    );
    ReactNativeHapticFeedback.trigger('impactLight', hapticOptions);
  };

  const handlePlay = () => {
    scale.value = withSequence(
      withSpring(1.3),
      withSpring(1)
    );
    rotation.value = withRepeat(
      withSequence(
        withSpring(-0.2),
        withSpring(0.2)
      ),
      2,
      true
    );
    ReactNativeHapticFeedback.trigger('impactMedium', hapticOptions);
  };

  // Animated styles
  const petStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value * breathe.value * bounce.value },
        { rotate: `${rotation.value * 30}deg` },
      ],
    };
  });

  const eyeStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scaleY: eyeScale.value }],
    };
  });

  const tailStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${tailRotation.value * 30}deg` }],
    };
  });

  return {
    petStyle,
    eyeStyle,
    tailStyle,
    handlePet,
    handlePlay,
  };
};
