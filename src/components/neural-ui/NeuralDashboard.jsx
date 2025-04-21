import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { styled } from '@mui/material/styles';
import { Box, Paper, Typography, IconButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const NeuralContainer = styled(Paper)(({ theme }) => ({
  background: 'rgba(36, 38, 41, 0.8)',
  backdropFilter: 'blur(10px)',
  borderRadius: theme.shape.borderRadius * 2,
  padding: theme.spacing(3),
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '2px',
    background: 'linear-gradient(90deg, #7f5af0, #2cb67d)',
  }
}));

const MetricCard = styled(motion.div)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.05)',
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  cursor: 'pointer',
  '&:hover': {
    background: 'rgba(255, 255, 255, 0.1)',
  }
}));

const NeuralDashboard = ({ petData, onInteract }) => {
  const theme = useTheme();
  const [metrics, setMetrics] = useState({
    happiness: 0,
    energy: 0,
    health: 0,
  });

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setMetrics(prev => ({
        happiness: Math.min(100, prev.happiness + Math.random() * 5),
        energy: Math.min(100, prev.energy + Math.random() * 3),
        health: Math.min(100, prev.health + Math.random() * 2),
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <NeuralContainer elevation={24}>
      <Typography variant="h5" 
        component={motion.h5}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{ mb: 3, color: theme.palette.primary.main }}
      >
        Neural Interface
      </Typography>
      
      <AnimatePresence>
        {Object.entries(metrics).map(([key, value], index) => (
          <MetricCard
            key={key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onInteract(key)}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>
                {key}
              </Typography>
              <Typography variant="h6" sx={{ color: theme.palette.secondary.main }}>
                {Math.round(value)}%
              </Typography>
            </Box>
            <Box
              component={motion.div}
              sx={{
                height: 4,
                background: theme.palette.background.paper,
                mt: 1,
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #7f5af0, #2cb67d)',
                }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </Box>
          </MetricCard>
        ))}
      </AnimatePresence>
    </NeuralContainer>
  );
};

export default NeuralDashboard;
