import React from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { PetTypes, PetStages, EmotionalStates } from '../models/PetModel';

class PetAnimationSystem {
  static animations = {
    idle: null,
    emotion: null,
    effect: null,
  };

  static ANIMATION_CONFIGS = {
    idle: {
      duration: 1500,
      energyMultiplier: 1.2,
    },
    happy: {
      bounceHeight: 15,
      duration: 500,
      iterations: 3,
    },
    sad: {
      bounceHeight: 5,
      duration: 2000,
      iterations: 1,
    },
    sick: {
      bounceHeight: 3,
      duration: 3000,
      iterations: 1,
    },
  };

  static ASSET_PATHS = {
    [PetTypes.CANINE]: {
      [PetStages.PUPPY]: {
        [EmotionalStates.HAPPY]: 'assets/pets/canine/puppy/happy.svg',
        [EmotionalStates.SAD]: 'assets/pets/canine/puppy/sad.svg',
        [EmotionalStates.ANXIOUS]: 'assets/pets/canine/puppy/anxious.svg',
        // Add more emotional states
      },
      // Add more stages
    },
    // Add more pet types
  };

  static initializeAnimations(pet, animRefs) {
    this.stopAllAnimations();
    
    // Configure animation values based on pet state
    const config = this.getAnimationConfig(pet);
    
    // Initialize animation references
    this.animations = {
      idle: this.createIdleAnimation(animRefs.bounce, config),
      emotion: this.createEmotionAnimation(pet, animRefs),
      effect: this.createEffectAnimations(pet, animRefs),
    };
  }

  static getAnimationConfig(pet) {
    const baseConfig = { ...this.ANIMATION_CONFIGS.idle };
    
    // Modify animation parameters based on pet state
    if (pet.attributes.illness) {
      baseConfig.energyMultiplier *= 0.5;
    }
    if (pet.attributes.energy < 0.3) {
      baseConfig.energyMultiplier *= 0.7;
    }
    
    return baseConfig;
  }

  static createIdleAnimation(bounceAnim, config) {
    return Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -5 * config.energyMultiplier,
          duration: config.duration / 2,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: config.duration / 2,
          useNativeDriver: true,
        }),
      ])
    );
  }

  static createEmotionAnimation(pet, animRefs) {
    const { emotionalState } = pet.attributes;
    const config = this.ANIMATION_CONFIGS[emotionalState] || this.ANIMATION_CONFIGS.happy;

    return Animated.sequence([
      // Scale up
      Animated.timing(animRefs.scale, {
        toValue: 1.1,
        duration: config.duration / 4,
        useNativeDriver: true,
      }),
      // Scale down
      Animated.timing(animRefs.scale, {
        toValue: 1,
        duration: config.duration / 4,
        useNativeDriver: true,
      }),
    ]);
  }

  static createEffectAnimations(pet, animRefs) {
    const effects = [];

    // Add glow effect if pet has active enhancements
    if (pet.enhancements.activeEffects.length > 0) {
      effects.push(
        Animated.loop(
          Animated.sequence([
            Animated.timing(animRefs.glow, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(animRefs.glow, {
              toValue: 0.5,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        )
      );
    }

    return Animated.parallel(effects);
  }

  static playIdleAnimation(bounceAnim, energy = 1) {
    const config = { ...this.ANIMATION_CONFIGS.idle, energyMultiplier: energy };
    this.animations.idle = this.createIdleAnimation(bounceAnim, config);
    this.animations.idle.start();
  }

  static playEmotionAnimation(pet, animRefs) {
    if (this.animations.emotion) {
      this.animations.emotion.stop();
    }
    this.animations.emotion = this.createEmotionAnimation(pet, animRefs);
    this.animations.emotion.start();
  }

  static updateAnimationStates(pet, animRefs) {
    // Update idle animation based on energy
    if (this.animations.idle) {
      this.animations.idle.stop();
    }
    this.playIdleAnimation(animRefs.bounce, pet.attributes.energy);

    // Update emotion animations
    this.playEmotionAnimation(pet, animRefs);

    // Update effect animations
    if (this.animations.effect) {
      this.animations.effect.stop();
    }
    this.animations.effect = this.createEffectAnimations(pet, animRefs);
    this.animations.effect.start();
  }

  static getPetAsset(petType, stage, emotionalState) {
    return this.ASSET_PATHS[petType]?.[stage]?.[emotionalState] || 
           this.ASSET_PATHS[petType]?.[stage]?.[EmotionalStates.HAPPY];
  }

  static getAccessoryAsset(accessoryId) {
    return `assets/accessories/${accessoryId}.svg`;
  }

  static cleanupAnimations() {
    Object.values(this.animations).forEach(anim => {
      if (anim && typeof anim.stop === 'function') {
        anim.stop();
      }
    });
  }

  // Visual Effect Components
  static VisualEffect = React.forwardRef(({ effect, petSize }, ref) => {
    const scaleAnim = React.useRef(new Animated.Value(0)).current;
    const rotateAnim = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 0.8,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, []);

    const rotate = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <Animated.View
        ref={ref}
        style={[
          styles.effectContainer,
          {
            transform: [
              { scale: scaleAnim },
              { rotate },
            ],
          },
        ]}
      >
        {/* Render effect specific content */}
      </Animated.View>
    );
  });

  static IllnessEffect = ({ size }) => {
    const opacityAnim = React.useRef(new Animated.Value(0.4)).current;

    React.useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0.7,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.4,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, []);

    return (
      <Animated.View
        style={[
          styles.illnessEffect,
          {
            width: size,
            height: size,
            opacity: opacityAnim,
          },
        ]}
      />
    );
  };
}

const styles = StyleSheet.create({
  effectContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  illnessEffect: {
    position: 'absolute',
    backgroundColor: 'rgba(158, 158, 158, 0.3)',
    borderRadius: 100,
  },
});

export default PetAnimationSystem;
