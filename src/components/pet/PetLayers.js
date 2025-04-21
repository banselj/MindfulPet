import React from 'react';
import Svg, { G, Path, Circle, Defs, RadialGradient, Stop, Filter, feGaussianBlur, feOffset, feComposite } from 'react-native-svg';
import { View } from 'react-native';
import Animated, { useAnimatedProps, withSpring, withRepeat, withSequence } from 'react-native-reanimated';

const AnimatedSvg = Animated.createAnimatedComponent(Svg);
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const moodColors = {
  happy: {
    primary: '#FFD700',
    secondary: '#FFA500',
    highlight: '#FFEB3B',
    shadow: '#F57C00',
    overlay: 'rgba(255, 107, 107, 0.2)'
  },
  sad: {
    primary: '#87CEEB',
    secondary: '#4682B4',
    highlight: '#B0E0E6',
    shadow: '#4169E1',
    overlay: 'rgba(108, 91, 123, 0.2)'
  },
  tired: {
    primary: '#A9A9A9',
    secondary: '#808080',
    highlight: '#D3D3D3',
    shadow: '#696969',
    overlay: 'rgba(169, 169, 169, 0.2)'
  },
  normal: {
    primary: '#98FB98',
    secondary: '#3CB371',
    highlight: '#90EE90',
    shadow: '#2E8B57',
    overlay: 'rgba(144, 238, 144, 0.2)'
  }
};

// SVG Paths for different pets
const petPaths = {
  cat: {
    body: "M50,150 C20,150 0,130 0,100 C0,70 20,50 50,50 L150,50 C180,50 200,70 200,100 C200,130 180,150 150,150 Z",
    ears: "M40,60 L20,20 L60,40 Z M160,60 L180,20 L140,40 Z",
    tail: "M180,100 Q200,120 190,140 Q180,160 160,140",
    whiskers: "M70,100 L30,90 M70,110 L30,120 M130,100 L170,90 M130,110 L170,120"
  },
  dog: {
    body: "M40,160 C10,160 0,130 0,100 C0,70 20,40 50,40 L150,40 C180,40 200,70 200,100 C200,130 190,160 160,160 Z",
    ears: "M30,60 C10,40 10,20 30,10 L60,40 Z M170,60 C190,40 190,20 170,10 L140,40 Z",
    tail: "M180,100 Q210,110 200,140 Q190,170 170,150",
    nose: "M95,110 Q100,115 105,110 Q100,120 95,110"
  },
  bunny: {
    body: "M50,170 C20,170 0,140 0,100 C0,60 20,30 50,30 L150,30 C180,30 200,60 200,100 C200,140 180,170 150,170 Z",
    ears: "M60,40 C40,0 80,0 60,40 Z M140,40 C120,0 160,0 140,40 Z",
    tail: "M180,100 Q190,110 185,120 Q180,130 175,125",
    nose: "M95,110 Q100,115 105,110 Q100,120 95,110"
  },
  panda: {
    body: "M50,160 C20,160 0,130 0,100 C0,70 20,40 50,40 L150,40 C180,40 200,70 200,100 C200,130 180,160 150,160 Z",
    ears: "M30,50 C10,30 20,10 40,30 Z M170,50 C190,30 180,10 160,30 Z",
    eyePatches: "M40,80 C30,70 30,90 40,100 C50,110 60,100 60,90 C60,80 50,70 40,80 Z M160,80 C150,70 150,90 160,100 C170,110 180,100 180,90 C180,80 170,70 160,80 Z",
    nose: "M95,110 Q100,115 105,110 Q100,120 95,110"
  }
};

export const PetBase = ({ type, mood, animProps }) => {
  const colors = moodColors[mood || 'normal'];
  const paths = petPaths[type || 'cat'];

  return (
    <AnimatedSvg width="200" height="200" viewBox="0 0 200 200" {...animProps}>
      <Defs>
        <RadialGradient id="bodyGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <Stop offset="0%" stopColor={colors.highlight} />
          <Stop offset="100%" stopColor={colors.primary} />
        </RadialGradient>
        <Filter id="shadow">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <feOffset dx="2" dy="2" />
          <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" />
        </Filter>
      </Defs>

      {/* Body */}
      <AnimatedPath
        d={paths.body}
        fill="url(#bodyGradient)"
        stroke={colors.secondary}
        strokeWidth="2"
        filter="url(#shadow)"
      />

      {/* Ears */}
      <AnimatedPath
        d={paths.ears}
        fill={colors.primary}
        stroke={colors.secondary}
        strokeWidth="2"
      />

      {/* Type-specific features */}
      {type === 'panda' && (
        <Path
          d={paths.eyePatches}
          fill={colors.shadow}
          stroke={colors.secondary}
          strokeWidth="1"
        />
      )}

      {/* Eyes */}
      <G>
        <Circle cx="60" cy="90" r="8" fill="#000000" />
        <Circle cx="140" cy="90" r="8" fill="#000000" />
        <Circle cx="57" cy="87" r="3" fill="#FFFFFF" />
        <Circle cx="137" cy="87" r="3" fill="#FFFFFF" />
      </G>

      {/* Nose and Mouth */}
      <Path
        d={paths.nose || "M95,110 Q100,115 105,110 Q100,120 95,110"}
        fill="#000000"
      />
      <Path
        d="M100,115 Q100,125 100,120"
        stroke="#000000"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Tail */}
      <AnimatedPath
        d={paths.tail}
        fill="none"
        stroke={colors.secondary}
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Whiskers (for cat) */}
      {type === 'cat' && (
        <Path
          d={paths.whiskers}
          fill="none"
          stroke={colors.shadow}
          strokeWidth="1"
        />
      )}
    </AnimatedSvg>
  );
};

export const MoodParticles = ({ mood, visible }) => {
  if (!visible) return null;

  return (
    <View style={{ position: 'absolute', width: '100%', height: '100%' }}>
      {/* Add mood-specific particles here */}
    </View>
  );
};
