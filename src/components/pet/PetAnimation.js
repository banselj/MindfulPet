import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { DotLottiePlayer } from '@lottiefiles/dotlottie-react';
import LottieView from 'lottie-react-native';

const LottieComponent = Platform.select({
  web: ({ source, style, autoPlay, loop, speed, ref }) => (
    <DotLottiePlayer
      ref={ref}
      src={source}
      style={style}
      autoplay={autoPlay}
      loop={loop}
      speed={speed}
    />
  ),
  default: LottieView,
});

export const PetAnimation = ({ onInteract, petState }) => {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const animationRef = useRef(null);

  useEffect(() => {
    // Bounce animation when happiness changes
    Animated.spring(bounceAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start(() => {
      bounceAnim.setValue(0);
    });
  }, [petState.happiness]);

  const getAnimationSource = () => {
    if (petState.energy < 30) {
      return require('./animations/pet-tired.json');
    } else if (petState.happiness > 80) {
      return require('./animations/pet-happy.json');
    } else {
      return require('./animations/pet-normal.json');
    }
  };

  const handlePress = () => {
    // Play tap animation
    if (animationRef.current) {
      if (Platform.OS === 'web') {
        animationRef.current.seek(30);
        animationRef.current.play();
      } else {
        animationRef.current.play(30, 60);
      }
    }
    
    // Call interaction handler
    onInteract();

    // Trigger bounce animation
    Animated.sequence([
      Animated.spring(bounceAnim, {
        toValue: 1.2,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.spring(bounceAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      })
    ]).start();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        onPress={handlePress}
        style={styles.touchable}
        activeOpacity={0.7}
      >
        <Animated.View style={[
          styles.animationContainer,
          {
            transform: [
              { scale: bounceAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.1]
              })}
            ]
          }
        ]}>
          <LottieComponent
            ref={animationRef}
            source={getAnimationSource()}
            autoPlay={true}
            loop={true}
            speed={1}
            style={styles.animation}
          />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchable: {
    width: 160,
    height: 160,
  },
  animationContainer: {
    width: '100%',
    height: '100%',
  },
  animation: {
    width: '100%',
    height: '100%',
  },
});
