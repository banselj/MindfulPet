import React, { Suspense, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, ContactShadows } from '@react-three/drei';
import { motion } from 'framer-motion-3d';
import { useFrame } from '@react-three/fiber';

const PetModel = ({ modelPath, emotion }) => {
  const group = useRef();
  const { scene } = useGLTF(modelPath);
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    group.current.rotation.y = Math.sin(t / 4) / 4;
    group.current.position.y = Math.sin(t / 1.5) / 10 + 0.5;
  });

  // Emotion-based color effects
  const emotionColors = {
    happy: '#FFD700',
    calm: '#4169E1',
    excited: '#FF4500',
    sleepy: '#9370DB'
  };

  return (
    <motion.group
      ref={group}
      animate={{
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <primitive object={scene} scale={0.75} />
      <pointLight
        position={[0, 2, 0]}
        color={emotionColors[emotion] || '#ffffff'}
        intensity={2}
      />
    </motion.group>
  );
};

const PetHologram = ({ petData }) => {
  return (
    <div style={{ width: '100%', height: '50vh', position: 'relative' }}>
      <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
        <Suspense fallback={null}>
          <Environment preset="sunset" />
          <PetModel
            modelPath={petData.modelPath}
            emotion={petData.currentEmotion}
          />
          <ContactShadows
            opacity={0.4}
            scale={5}
            blur={2}
            far={4}
            resolution={256}
            color="#000000"
          />
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 2}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default PetHologram;
