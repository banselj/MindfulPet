import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { styled } from '@mui/material/styles';
import { Box, Typography, IconButton, Slider } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import BreathingVisualizer from './BreathingVisualizer';
import meditationAI from '../../ai/services/meditationAI';
import { PetHologram } from '../holographics/PetHologram';

const ExperienceContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100vw',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: theme.palette.background.default,
}));

const ControlsOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: theme.spacing(4),
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  background: 'rgba(22, 22, 26, 0.8)',
  backdropFilter: 'blur(10px)',
  zIndex: 10,
}));

const ProgressSlider = styled(Slider)(({ theme }) => ({
  width: '300px',
  color: theme.palette.primary.main,
  '& .MuiSlider-thumb': {
    width: 12,
    height: 12,
    transition: '0.3s cubic-bezier(.47,1.64,.41,.8)',
    '&:hover': {
      boxShadow: '0 0 0 8px rgba(127, 90, 240, 0.16)',
    },
  },
}));

const MeditationExperience = ({ petData }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState('preparation');
  const [emotionalState, setEmotionalState] = useState(null);
  const [breathingPattern, setBreathingPattern] = useState({
    inhale: 4000,
    exhale: 6000,
    holdAfterInhale: 2000,
    holdAfterExhale: 2000,
  });

  const videoRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    // Initialize webcam for emotion detection
    const initializeWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Failed to initialize webcam:', error);
      }
    };

    initializeWebcam();

    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    let emotionDetectionInterval;
    
    if (isPlaying) {
      emotionDetectionInterval = setInterval(async () => {
        try {
          const emotionalState = await meditationAI.detectEmotionalState(videoRef.current);
          if (emotionalState) {
            setEmotionalState(emotionalState);
            // Adjust breathing pattern based on emotional state
            const newPattern = meditationAI.generateBreathingPattern(emotionalState.relaxationLevel);
            setBreathingPattern(newPattern);
          }
        } catch (error) {
          console.error('Emotion detection failed:', error);
        }
      }, 5000);
    }

    return () => {
      if (emotionDetectionInterval) {
        clearInterval(emotionDetectionInterval);
      }
    };
  }, [isPlaying]);

  const startMeditation = async () => {
    try {
      setIsPlaying(true);
      setCurrentPhase('starting');

      const script = await meditationAI.generateMeditationScript({
        duration: 10,
        currentMood: emotionalState?.relaxationLevel < 0.5 ? 'stressed' : 'calm',
        goal: 'relaxation',
        experienceLevel: 'beginner',
      });

      const audioContent = await meditationAI.generateVoiceGuidance(script);
      if (audioRef.current) {
        audioRef.current.src = URL.createObjectURL(new Blob([audioContent]));
        await audioRef.current.play();
      }

      setCurrentPhase('meditating');
    } catch (error) {
      console.error('Failed to start meditation:', error);
      setIsPlaying(false);
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      startMeditation();
    }
  };

  return (
    <ExperienceContainer>
      <AnimatePresence mode="wait">
        {currentPhase === 'meditating' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'absolute', width: '100%', height: '100%' }}
          >
            <BreathingVisualizer breathingPattern={breathingPattern} />
          </motion.div>
        )}
      </AnimatePresence>

      <Box
        sx={{
          position: 'absolute',
          top: '20%',
          right: '5%',
          width: '200px',
          height: '200px',
        }}
      >
        <PetHologram
          petData={{
            ...petData,
            currentEmotion: emotionalState?.relaxationLevel > 0.7 ? 'zen' : 'calm',
          }}
        />
      </Box>

      <ControlsOverlay>
        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
          {currentPhase === 'preparation' ? 'Ready to begin' :
           currentPhase === 'starting' ? 'Preparing your session...' :
           'Breathe with the visualization'}
        </Typography>

        <ProgressSlider
          value={progress}
          onChange={(_, newValue) => setProgress(newValue)}
          disabled={!isPlaying}
        />

        <IconButton
          onClick={togglePlayPause}
          sx={{
            backgroundColor: 'primary.main',
            color: 'white',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
          }}
        >
          {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
        </IconButton>
      </ControlsOverlay>

      <video
        ref={videoRef}
        style={{ display: 'none' }}
        autoPlay
        playsInline
      />
      <audio ref={audioRef} />
    </ExperienceContainer>
  );
};

export default MeditationExperience;
