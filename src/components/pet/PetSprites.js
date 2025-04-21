import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform, Animated } from 'react-native';
import { SvgXml } from 'react-native-svg';

// Import SVG files for web
const petSpritesWeb = {
  cat: {
    normal: require('./sprites/cat-normal.svg'),
    happy: require('./sprites/cat-happy.svg'),
    tired: require('./sprites/cat-tired.svg'),
  },
  dog: {
    normal: require('./sprites/dog-normal.svg'),
    happy: require('./sprites/dog-happy.svg'),
    tired: require('./sprites/dog-tired.svg'),
  },
};

// SVG strings for native
const petSpritesNative = {
  cat: {
    normal: `
      <svg width="120" height="120" viewBox="0 0 120 120">
        <defs>
          <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#A0A0A0;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#808080;stop-opacity:1" />
          </linearGradient>
        </defs>
        <g transform="translate(10,10)">
          <!-- Body -->
          <ellipse cx="50" cy="60" rx="40" ry="30" fill="url(#bodyGradient)"/>
          <!-- Head -->
          <circle cx="50" cy="40" r="25" fill="url(#bodyGradient)"/>
          <!-- Ears -->
          <path d="M30 25 L40 40 L25 40 Z" fill="url(#bodyGradient)"/>
          <path d="M70 25 L75 40 L60 40 Z" fill="url(#bodyGradient)"/>
          <!-- Eyes -->
          <circle cx="40" cy="35" r="5" fill="white"/>
          <circle cx="60" cy="35" r="5" fill="white"/>
          <circle cx="40" cy="35" r="2.5" fill="black"/>
          <circle cx="60" cy="35" r="2.5" fill="black"/>
          <!-- Nose -->
          <path d="M47 45 L53 45 L50 48 Z" fill="#FFB6C1"/>
          <!-- Whiskers -->
          <line x1="30" y1="45" x2="15" y2="40" stroke="white" stroke-width="1"/>
          <line x1="30" y1="48" x2="15" y2="48" stroke="white" stroke-width="1"/>
          <line x1="30" y1="51" x2="15" y2="56" stroke="white" stroke-width="1"/>
          <line x1="70" y1="45" x2="85" y2="40" stroke="white" stroke-width="1"/>
          <line x1="70" y1="48" x2="85" y2="48" stroke="white" stroke-width="1"/>
          <line x1="70" y1="51" x2="85" y2="56" stroke="white" stroke-width="1"/>
          <!-- Tail -->
          <path d="M90 60 Q 100 40 90 30" stroke="url(#bodyGradient)" stroke-width="8" fill="none"/>
        </g>
      </svg>
    `,
    happy: `
      <svg width="120" height="120" viewBox="0 0 120 120">
        <defs>
          <linearGradient id="happyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#FFE5B4;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#FFD700;stop-opacity:1" />
          </linearGradient>
        </defs>
        <g transform="translate(10,10)">
          <!-- Body -->
          <ellipse cx="50" cy="60" rx="40" ry="30" fill="url(#happyGradient)"/>
          <!-- Head -->
          <circle cx="50" cy="40" r="25" fill="url(#happyGradient)"/>
          <!-- Ears -->
          <path d="M30 25 L40 40 L25 40 Z" fill="url(#happyGradient)"/>
          <path d="M70 25 L75 40 L60 40 Z" fill="url(#happyGradient)"/>
          <!-- Happy Eyes -->
          <path d="M35 35 Q 40 40 45 35" stroke="black" stroke-width="2" fill="none"/>
          <path d="M55 35 Q 60 40 65 35" stroke="black" stroke-width="2" fill="none"/>
          <!-- Nose -->
          <path d="M47 45 L53 45 L50 48 Z" fill="#FFB6C1"/>
          <!-- Happy Mouth -->
          <path d="M40 50 Q 50 60 60 50" stroke="black" stroke-width="2" fill="none"/>
          <!-- Whiskers -->
          <line x1="30" y1="45" x2="15" y2="40" stroke="white" stroke-width="1"/>
          <line x1="30" y1="48" x2="15" y2="48" stroke="white" stroke-width="1"/>
          <line x1="30" y1="51" x2="15" y2="56" stroke="white" stroke-width="1"/>
          <line x1="70" y1="45" x2="85" y2="40" stroke="white" stroke-width="1"/>
          <line x1="70" y1="48" x2="85" y2="48" stroke="white" stroke-width="1"/>
          <line x1="70" y1="51" x2="85" y2="56" stroke="white" stroke-width="1"/>
          <!-- Wagging Tail -->
          <path d="M90 60 Q 110 50 100 30" stroke="url(#happyGradient)" stroke-width="8" fill="none"/>
        </g>
      </svg>
    `,
    tired: `
      <svg width="120" height="120" viewBox="0 0 120 120">
        <defs>
          <linearGradient id="tiredGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#C0C0C0;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#A9A9A9;stop-opacity:1" />
          </linearGradient>
        </defs>
        <g transform="translate(10,10)">
          <!-- Body -->
          <ellipse cx="50" cy="60" rx="40" ry="30" fill="url(#tiredGradient)"/>
          <!-- Head -->
          <circle cx="50" cy="40" r="25" fill="url(#tiredGradient)"/>
          <!-- Ears -->
          <path d="M30 25 L40 40 L25 40 Z" fill="url(#tiredGradient)"/>
          <path d="M70 25 L75 40 L60 40 Z" fill="url(#tiredGradient)"/>
          <!-- Sleepy Eyes -->
          <line x1="35" y1="35" x2="45" y2="35" stroke="black" stroke-width="2"/>
          <line x1="55" y1="35" x2="65" y2="35" stroke="black" stroke-width="2"/>
          <!-- Nose -->
          <path d="M47 45 L53 45 L50 48 Z" fill="#FFB6C1"/>
          <!-- Sleepy Mouth -->
          <path d="M45 50 Q 50 45 55 50" stroke="black" stroke-width="2" fill="none"/>
          <!-- Whiskers -->
          <line x1="30" y1="45" x2="15" y2="40" stroke="white" stroke-width="1"/>
          <line x1="30" y1="48" x2="15" y2="48" stroke="white" stroke-width="1"/>
          <line x1="30" y1="51" x2="15" y2="56" stroke="white" stroke-width="1"/>
          <line x1="70" y1="45" x2="85" y2="40" stroke="white" stroke-width="1"/>
          <line x1="70" y1="48" x2="85" y2="48" stroke="white" stroke-width="1"/>
          <line x1="70" y1="51" x2="85" y2="56" stroke="white" stroke-width="1"/>
          <!-- Drooping Tail -->
          <path d="M90 60 Q 95 70 85 75" stroke="url(#tiredGradient)" stroke-width="8" fill="none"/>
        </g>
      </svg>
    `,
  },
  dog: {
    normal: `
      <svg width="120" height="120" viewBox="0 0 120 120">
        <defs>
          <linearGradient id="dogGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#DEB887;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#CD853F;stop-opacity:1" />
          </linearGradient>
        </defs>
        <g transform="translate(10,10)">
          <!-- Body -->
          <ellipse cx="50" cy="60" rx="40" ry="30" fill="url(#dogGradient)"/>
          <!-- Head -->
          <circle cx="50" cy="40" r="28" fill="url(#dogGradient)"/>
          <!-- Ears -->
          <path d="M25 30 Q 20 20 30 25" fill="url(#dogGradient)" stroke="url(#dogGradient)" stroke-width="4"/>
          <path d="M75 30 Q 80 20 70 25" fill="url(#dogGradient)" stroke="url(#dogGradient)" stroke-width="4"/>
          <!-- Eyes -->
          <circle cx="40" cy="35" r="4" fill="white"/>
          <circle cx="60" cy="35" r="4" fill="white"/>
          <circle cx="40" cy="35" r="2" fill="black"/>
          <circle cx="60" cy="35" r="2" fill="black"/>
          <!-- Nose -->
          <circle cx="50" cy="45" r="5" fill="black"/>
          <!-- Mouth -->
          <path d="M45 50 Q 50 55 55 50" stroke="black" stroke-width="2" fill="none"/>
          <!-- Tail -->
          <path d="M90 60 Q 100 40 90 30" stroke="url(#dogGradient)" stroke-width="8" fill="none"/>
        </g>
      </svg>
    `,
    happy: `
      <svg width="120" height="120" viewBox="0 0 120 120">
        <defs>
          <linearGradient id="happyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#FFE5B4;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#FFD700;stop-opacity:1" />
          </linearGradient>
        </defs>
        <g transform="translate(10,10)">
          <!-- Body -->
          <ellipse cx="50" cy="60" rx="40" ry="30" fill="url(#happyGradient)"/>
          <!-- Head -->
          <circle cx="50" cy="40" r="28" fill="url(#happyGradient)"/>
          <!-- Ears -->
          <path d="M25 30 Q 20 20 30 25" fill="url(#happyGradient)" stroke="url(#happyGradient)" stroke-width="4"/>
          <path d="M75 30 Q 80 20 70 25" fill="url(#happyGradient)" stroke="url(#happyGradient)" stroke-width="4"/>
          <!-- Happy Eyes -->
          <path d="M35 35 Q 40 40 45 35" stroke="black" stroke-width="2" fill="none"/>
          <path d="M55 35 Q 60 40 65 35" stroke="black" stroke-width="2" fill="none"/>
          <!-- Nose -->
          <circle cx="50" cy="45" r="5" fill="black"/>
          <!-- Happy Mouth -->
          <path d="M40 50 Q 50 60 60 50" stroke="black" stroke-width="2" fill="none"/>
          <!-- Tail -->
          <path d="M90 60 Q 110 50 100 30" stroke="url(#happyGradient)" stroke-width="8" fill="none"/>
        </g>
      </svg>
    `,
    tired: `
      <svg width="120" height="120" viewBox="0 0 120 120">
        <defs>
          <linearGradient id="tiredGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#C0C0C0;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#A9A9A9;stop-opacity:1" />
          </linearGradient>
        </defs>
        <g transform="translate(10,10)">
          <!-- Body -->
          <ellipse cx="50" cy="60" rx="40" ry="30" fill="url(#tiredGradient)"/>
          <!-- Head -->
          <circle cx="50" cy="40" r="28" fill="url(#tiredGradient)"/>
          <!-- Ears -->
          <path d="M25 30 Q 20 20 30 25" fill="url(#tiredGradient)" stroke="url(#tiredGradient)" stroke-width="4"/>
          <path d="M75 30 Q 80 20 70 25" fill="url(#tiredGradient)" stroke="url(#tiredGradient)" stroke-width="4"/>
          <!-- Sleepy Eyes -->
          <line x1="35" y1="35" x2="45" y2="35" stroke="black" stroke-width="2"/>
          <line x1="55" y1="35" x2="65" y2="35" stroke="black" stroke-width="2"/>
          <!-- Nose -->
          <circle cx="50" cy="45" r="5" fill="black"/>
          <!-- Sleepy Mouth -->
          <path d="M45 50 Q 50 45 55 50" stroke="black" stroke-width="2" fill="none"/>
          <!-- Tail -->
          <path d="M90 60 Q 95 70 85 75" stroke="url(#tiredGradient)" stroke-width="8" fill="none"/>
        </g>
      </svg>
    `,
  },
};

export const PetSprite = ({ type = 'cat', mood = 'normal' }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Reset animations
    fadeAnim.setValue(0);
    bounceAnim.setValue(1);

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Bounce animation when mood changes
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
      }),
    ]).start();

    // Cleanup
    return () => {
      fadeAnim.setValue(0);
      bounceAnim.setValue(1);
    };
  }, [mood, type]);

  const sprites = Platform.OS === 'web' ? petSpritesWeb : petSpritesNative;
  
  // Convert type to lowercase for consistency
  const petType = type.toLowerCase();
  
  // Get the sprite set for the pet type, fallback to cat if type not found
  const petSprites = sprites[petType] || sprites.cat;
  
  // Get the specific mood sprite, fallback to normal if mood not found
  const currentSprite = petSprites[mood] || petSprites.normal;

  const animatedStyle = {
    opacity: fadeAnim,
    transform: [{ scale: bounceAnim }],
  };

  if (Platform.OS === 'web') {
    const SvgComponent = currentSprite;
    return (
      <Animated.View style={[styles.container, animatedStyle]}>
        <SvgComponent width="100%" height="100%" />
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <SvgXml
        xml={currentSprite}
        width="100%"
        height="100%"
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
