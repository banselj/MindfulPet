import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { styled } from '@mui/material/styles';
import { Box, Typography, CircularProgress } from '@mui/material';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import workoutAI from '../../ai/services/workoutAI';

const VisualizerContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  height: '100%',
  backgroundColor: theme.palette.background.default,
  overflow: 'hidden',
}));

const FormFeedbackOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '20px',
  right: '20px',
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: 'rgba(22, 22, 26, 0.9)',
  backdropFilter: 'blur(10px)',
  color: theme.palette.primary.contrastText,
  maxWidth: '300px',
  zIndex: 10,
}));

const ExerciseModel = ({ modelPath, currentPose }) => {
  const group = useRef();
  const { scene } = useGLTF(modelPath);

  useFrame((state) => {
    if (group.current && currentPose) {
      // Interpolate model pose towards target pose
      group.current.position.lerp(new THREE.Vector3(
        currentPose.position.x,
        currentPose.position.y,
        currentPose.position.z
      ), 0.1);
      
      group.current.rotation.x = THREE.MathUtils.lerp(
        group.current.rotation.x,
        currentPose.rotation.x,
        0.1
      );
      group.current.rotation.y = THREE.MathUtils.lerp(
        group.current.rotation.y,
        currentPose.rotation.y,
        0.1
      );
    }
  });

  return (
    <primitive
      ref={group}
      object={scene}
      scale={0.75}
      position={[0, 0, 0]}
    />
  );
};

const PoseSkeletonOverlay = ({ poseData, formScore }) => {
  const lines = useRef();

  useFrame(() => {
    if (lines.current && poseData) {
      // Update skeleton lines based on pose data
      const positions = [];
      poseData.keypoints.forEach((keypoint, i) => {
        if (i < poseData.keypoints.length - 1) {
          positions.push(keypoint.position.x, keypoint.position.y, keypoint.position.z);
          positions.push(
            poseData.keypoints[i + 1].position.x,
            poseData.keypoints[i + 1].position.y,
            poseData.keypoints[i + 1].position.z
          );
        }
      });

      lines.current.geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(positions, 3)
      );
    }
  });

  return (
    <line ref={lines}>
      <bufferGeometry />
      <lineBasicMaterial
        color={formScore > 0.8 ? '#2cb67d' : formScore > 0.6 ? '#7f5af0' : '#ff6b6b'}
        linewidth={2}
      />
    </line>
  );
};

const FormAnalysis = ({ formData }) => {
  if (!formData) return null;

  return (
    <FormFeedbackOverlay>
      <Typography variant="h6" gutterBottom>
        Form Analysis
      </Typography>
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Overall Score
        </Typography>
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
          <CircularProgress
            variant="determinate"
            value={formData.score * 100}
            color={formData.score > 0.8 ? 'success' : formData.score > 0.6 ? 'primary' : 'error'}
          />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="caption" component="div" color="text.secondary">
              {Math.round(formData.score * 100)}%
            </Typography>
          </Box>
        </Box>
      </Box>
      <Box>
        <Typography variant="body2" color="text.secondary">
          Feedback
        </Typography>
        {formData.feedback.map((item, index) => (
          <Typography
            key={index}
            variant="body2"
            component={motion.p}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            • {item}
          </Typography>
        ))}
      </Box>
    </FormFeedbackOverlay>
  );
};

const WorkoutVisualizer = ({ exercise, onFormUpdate }) => {
  const [poseData, setPoseData] = useState(null);
  const [formAnalysis, setFormAnalysis] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    // Initialize webcam
    const initializeCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Failed to initialize camera:', error);
      }
    };

    initializeCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    let animationFrame;
    
    const analyzePose = async () => {
      if (videoRef.current) {
        try {
          const pose = await workoutAI.detectPose(videoRef.current);
          setPoseData(pose);

          const analysis = await workoutAI.analyzeForm(pose, exercise.type);
          setFormAnalysis(analysis);
          onFormUpdate?.(analysis);

          animationFrame = requestAnimationFrame(analyzePose);
        } catch (error) {
          console.error('Pose detection failed:', error);
        }
      }
    };

    analyzePose();

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [exercise, onFormUpdate]);

  return (
    <VisualizerContainer>
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <ExerciseModel
          modelPath={exercise.modelPath}
          currentPose={poseData}
        />
        <PoseSkeletonOverlay
          poseData={poseData}
          formScore={formAnalysis?.score || 0}
        />
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
      
      <FormAnalysis formData={formAnalysis} />
      
      <video
        ref={videoRef}
        style={{ display: 'none' }}
        autoPlay
        playsInline
      />
    </VisualizerContainer>
  );
};

export default WorkoutVisualizer;
