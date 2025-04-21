import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { PetTypes, PetStages, EmotionalStates } from '../../models/PetModel';
import PetAnimationSystem from '../../systems/PetAnimation';

const PetRenderer = ({ pet, size = 200, onInteractionComplete }) => {
  // Animation refs
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Effect refs for visual enhancements
  const sparkleRef = useRef(null);
  const auraRef = useRef(null);

  useEffect(() => {
    // Initialize animation system
    PetAnimationSystem.initializeAnimations(pet, {
      bounce: bounceAnim,
      rotate: rotateAnim,
      scale: scaleAnim,
      glow: glowAnim,
    });

    // Start idle animation
    startIdleAnimation();

    return () => {
      // Cleanup animations
      PetAnimationSystem.cleanupAnimations();
    };
  }, [pet.petId]);

  useEffect(() => {
    // Update animations when pet state changes
    updatePetAnimations();
  }, [
    pet.attributes.emotionalState,
    pet.attributes.physicalHealth,
    pet.attributes.energy,
    pet.attributes.illness,
  ]);

  const startIdleAnimation = () => {
    PetAnimationSystem.playIdleAnimation(bounceAnim, pet.attributes.energy);
  };

  const updatePetAnimations = () => {
    // Update animation states based on pet attributes
    PetAnimationSystem.updateAnimationStates(pet, {
      bounce: bounceAnim,
      rotate: rotateAnim,
      scale: scaleAnim,
      glow: glowAnim,
    });
  };

  const getPetAsset = () => {
    return PetAnimationSystem.getPetAsset(pet.petType, pet.currentStage, pet.attributes.emotionalState);
  };

  const getEnhancementAssets = () => {
    return pet.enhancements.accessories.map(accessory => 
      PetAnimationSystem.getAccessoryAsset(accessory.id)
    );
  };

  const renderVisualEffects = () => {
    return pet.enhancements.activeEffects.map((effect, index) => (
      <PetAnimationSystem.VisualEffect
        key={`${effect.id}_${index}`}
        effect={effect}
        petSize={size}
        ref={effect.type === 'sparkle' ? sparkleRef : auraRef}
      />
    ));
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Background effects layer */}
      <Animated.View style={[styles.effectsLayer, { opacity: glowAnim }]}>
        {renderVisualEffects()}
      </Animated.View>

      {/* Pet layer */}
      <Animated.View
        style={[
          styles.petContainer,
          {
            transform: [
              { translateY: bounceAnim },
              { rotate },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        {/* Base pet render */}
        <SvgUri
          width={size}
          height={size}
          uri={getPetAsset()}
          style={styles.petImage}
        />

        {/* Accessories layer */}
        {getEnhancementAssets().map((accessoryUri, index) => (
          <SvgUri
            key={`accessory_${index}`}
            width={size}
            height={size}
            uri={accessoryUri}
            style={[styles.accessory, { zIndex: index + 1 }]}
          />
        ))}
      </Animated.View>

      {/* Foreground effects layer */}
      <Animated.View style={styles.foregroundEffects}>
        {pet.attributes.illness && (
          <PetAnimationSystem.IllnessEffect size={size} />
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  effectsLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  petImage: {
    width: '100%',
    height: '100%',
  },
  accessory: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  foregroundEffects: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
});

export default PetRenderer;
