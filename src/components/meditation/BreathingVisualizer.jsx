import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { styled } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';

const VisualizerContainer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  width: '100%',
  height: '100%',
  background: 'radial-gradient(circle at center, #1a1a2e 0%, #16161a 100%)',
  overflow: 'hidden',
}));

const BreathingOrb = ({ pattern, phase }) => {
  const orbRef = useRef();
  const [scale, setScale] = useState(1);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    
    // Calculate breathing phase
    const breathCycle = (time % (pattern.inhale + pattern.exhale + pattern.holdAfterInhale + pattern.holdAfterExhale)) / 1000;
    
    if (breathCycle < pattern.inhale / 1000) {
      // Inhale phase
      setScale(1 + (breathCycle / (pattern.inhale / 1000)) * 0.5);
    } else if (breathCycle < (pattern.inhale + pattern.holdAfterInhale) / 1000) {
      // Hold after inhale
      setScale(1.5);
    } else if (breathCycle < (pattern.inhale + pattern.holdAfterInhale + pattern.exhale) / 1000) {
      // Exhale phase
      const exhaleProgress = (breathCycle - (pattern.inhale + pattern.holdAfterInhale) / 1000) / (pattern.exhale / 1000);
      setScale(1.5 - exhaleProgress * 0.5);
    } else {
      // Hold after exhale
      setScale(1);
    }

    // Add subtle floating motion
    if (orbRef.current) {
      orbRef.current.position.y = Math.sin(time * 2) * 0.1;
      orbRef.current.rotation.z = time * 0.1;
    }
  });

  return (
    <mesh ref={orbRef} scale={[scale, scale, scale]}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial
        color="#7f5af0"
        emissive="#2cb67d"
        emissiveIntensity={0.5}
        roughness={0.2}
        metalness={0.8}
      />
    </mesh>
  );
};

const PhaseIndicator = ({ phase }) => {
  return (
    <Typography
      variant="h4"
      component={motion.h4}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'absolute',
        bottom: '10%',
        left: '50%',
        transform: 'translateX(-50%)',
        color: '#fff',
        textAlign: 'center',
      }}
    >
      {phase}
    </Typography>
  );
};

const ParticleField = () => {
  const particlesRef = useRef();

  useFrame(({ clock }) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = clock.getElapsedTime() * 0.05;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        {/* Generate random particles in a sphere */}
        <float32BufferAttribute
          attach="attributes-position"
          count={1000}
          array={new Float32Array(3000).map(() => (Math.random() - 0.5) * 10)}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#7f5af0"
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
};

const BreathingVisualizer = ({ breathingPattern }) => {
  const [phase, setPhase] = useState('inhale');

  useEffect(() => {
    const updatePhase = () => {
      const cycle = Date.now() % (breathingPattern.inhale + breathingPattern.exhale + 
                                breathingPattern.holdAfterInhale + breathingPattern.holdAfterExhale);
      
      if (cycle < breathingPattern.inhale) {
        setPhase('Inhale');
      } else if (cycle < (breathingPattern.inhale + breathingPattern.holdAfterInhale)) {
        setPhase('Hold');
      } else if (cycle < (breathingPattern.inhale + breathingPattern.holdAfterInhale + breathingPattern.exhale)) {
        setPhase('Exhale');
      } else {
        setPhase('Rest');
      }
    };

    const interval = setInterval(updatePhase, 100);
    return () => clearInterval(interval);
  }, [breathingPattern]);

  return (
    <VisualizerContainer>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        <BreathingOrb pattern={breathingPattern} phase={phase} />
        <ParticleField />
      </Canvas>
      <AnimatePresence mode="wait">
        <PhaseIndicator key={phase} phase={phase} />
      </AnimatePresence>
    </VisualizerContainer>
  );
};

export default BreathingVisualizer;
