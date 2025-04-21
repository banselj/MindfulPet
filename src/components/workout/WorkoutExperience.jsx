import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { styled } from '@mui/material/styles';
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  IconButton,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import TimerIcon from '@mui/icons-material/Timer';
import WorkoutVisualizer from './WorkoutVisualizer';
import workoutAI from '../../ai/services/workoutAI';
import { PetHologram } from '../holographics/PetHologram';

const ExperienceContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100vw',
  height: '100vh',
  display: 'grid',
  gridTemplateColumns: '1fr 300px',
  gridTemplateRows: '1fr auto',
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.default,
}));

const WorkoutCard = styled(Card)(({ theme }) => ({
  background: 'rgba(36, 38, 41, 0.9)',
  backdropFilter: 'blur(10px)',
  borderRadius: theme.shape.borderRadius * 2,
  border: '1px solid rgba(127, 90, 240, 0.2)',
}));

const ControlsOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: theme.spacing(4),
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  background: 'rgba(22, 22, 26, 0.8)',
  backdropFilter: 'blur(10px)',
  zIndex: 10,
}));

const WorkoutExperience = ({ petData, onClose }) => {
  const [workout, setWorkout] = useState(null);
  const [currentExercise, setCurrentExercise] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [formScore, setFormScore] = useState(0);
  const [petMood, setPetMood] = useState('excited');

  useEffect(() => {
    const generateWorkout = async () => {
      try {
        const userMetrics = {
          availableTime: 30 * 60, // 30 minutes in seconds
          fitnessLevel: 0.7, // 0-1 scale
          goals: ['strength', 'cardio'],
          availableEquipment: ['none', 'dumbbells'],
        };

        const { workout: generatedWorkout } = await workoutAI.generateWorkoutPlan(userMetrics);
        setWorkout(generatedWorkout);
        setCurrentExercise(generatedWorkout.exercises[0]);
      } catch (error) {
        console.error('Failed to generate workout:', error);
      }
    };

    generateWorkout();
  }, []);

  useEffect(() => {
    let interval;
    if (isPlaying && workout) {
      interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + (100 / (workout.totalDuration * 60));
          return newProgress >= 100 ? 100 : newProgress;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, workout]);

  const handleFormUpdate = (analysis) => {
    setFormScore(analysis.score);
    // Update pet mood based on form score
    setPetMood(analysis.score > 0.8 ? 'proud' : analysis.score > 0.6 ? 'encouraging' : 'concerned');
  };

  const handleNextExercise = () => {
    if (!workout) return;
    
    const currentIndex = workout.exercises.findIndex(e => e.name === currentExercise.name);
    if (currentIndex < workout.exercises.length - 1) {
      setCurrentExercise(workout.exercises[currentIndex + 1]);
    } else {
      // Workout complete
      setIsPlaying(false);
      setPetMood('celebrating');
    }
  };

  if (!workout || !currentExercise) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography variant="h5">Generating your personalized workout...</Typography>
      </Box>
    );
  }

  return (
    <ExperienceContainer>
      <Box sx={{ gridColumn: '1 / 2', gridRow: '1 / 3' }}>
        <WorkoutVisualizer
          exercise={currentExercise}
          onFormUpdate={handleFormUpdate}
        />
      </Box>

      <Box sx={{ gridColumn: '2 / 3', gridRow: '1 / 2', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <WorkoutCard>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Current Exercise
            </Typography>
            <Typography variant="h4" gutterBottom>
              {currentExercise.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Chip
                icon={<FitnessCenterIcon />}
                label={`${workout.sets[currentExercise.name].sets} sets × ${workout.sets[currentExercise.name].reps} reps`}
              />
              <Chip
                icon={<TimerIcon />}
                label={`${workout.sets[currentExercise.name].restBetweenSets}s rest`}
              />
            </Box>
            <LinearProgress
              variant="determinate"
              value={formScore * 100}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </CardContent>
        </WorkoutCard>

        <Box sx={{ position: 'relative', height: '200px' }}>
          <PetHologram
            petData={{
              ...petData,
              currentEmotion: petMood,
            }}
          />
        </Box>
      </Box>

      <ControlsOverlay>
        <IconButton
          onClick={() => setIsPlaying(!isPlaying)}
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

        <IconButton
          onClick={handleNextExercise}
          sx={{
            backgroundColor: 'secondary.main',
            color: 'white',
            '&:hover': {
              backgroundColor: 'secondary.dark',
            },
          }}
        >
          <SkipNextIcon />
        </IconButton>

        <Box sx={{ width: '200px', ml: 2 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
      </ControlsOverlay>
    </ExperienceContainer>
  );
};

export default WorkoutExperience;
