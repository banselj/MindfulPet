import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { styled } from '@mui/material/styles';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  Button,
  CircularProgress,
  TextField,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import TimerIcon from '@mui/icons-material/Timer';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import nutritionAI from '../../ai/services/nutritionAI';
import { PetHologram } from '../holographics/PetHologram';

const PlannerContainer = styled(Box)(({ theme }) => ({
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

const MealCard = styled(Card)(({ theme }) => ({
  background: 'rgba(36, 38, 41, 0.9)',
  backdropFilter: 'blur(10px)',
  borderRadius: theme.shape.borderRadius * 2,
  border: '1px solid rgba(127, 90, 240, 0.2)',
  marginBottom: theme.spacing(2),
}));

const PreferencesPanel = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  background: 'rgba(22, 22, 26, 0.8)',
  backdropFilter: 'blur(10px)',
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(2),
}));

const NutritionChart = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: theme.spacing(2),
}));

const MealPlanner = ({ petData, onClose }) => {
  const [userProfile, setUserProfile] = useState({
    restrictions: [],
    goals: ['weight_maintenance'],
    caloriesTarget: 2000,
    cookingSkill: 'intermediate',
    cookingTime: 30,
    allergies: [],
  });

  const [mealPlan, setMealPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [petMood, setPetMood] = useState('excited');

  useEffect(() => {
    generateMealPlan();
  }, [userProfile]);

  const generateMealPlan = async () => {
    setLoading(true);
    try {
      const meals = await nutritionAI.generateMealPlan(userProfile);
      setMealPlan(meals);
      setPetMood('happy');
    } catch (error) {
      console.error('Failed to generate meal plan:', error);
      setPetMood('concerned');
    }
    setLoading(false);
  };

  const handleProfileUpdate = (field, value) => {
    setUserProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMealSelection = (meal) => {
    setSelectedMeal(meal);
    const score = nutritionAI.calculateMealScore(meal, userProfile);
    setPetMood(score > 80 ? 'proud' : score > 60 ? 'happy' : 'concerned');
  };

  const handleFoodCapture = async (event) => {
    if (!event.target.files?.[0]) return;

    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = async () => {
        try {
          const analysis = await nutritionAI.analyzeFoodImage(img);
          // Update UI with food analysis
          setPetMood(analysis.predictions[0].probability > 0.8 ? 'excited' : 'curious');
        } catch (error) {
          console.error('Failed to analyze food:', error);
          setPetMood('concerned');
        }
      };
    };

    reader.readAsDataURL(file);
  };

  return (
    <PlannerContainer>
      <Box sx={{ gridColumn: '1 / 2', gridRow: '1 / 3', overflowY: 'auto' }}>
        <PreferencesPanel>
          <Typography variant="h6" gutterBottom>
            Your Preferences
          </Typography>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <FormControl fullWidth>
              <InputLabel>Dietary Restrictions</InputLabel>
              <Select
                multiple
                value={userProfile.restrictions}
                onChange={(e) => handleProfileUpdate('restrictions', e.target.value)}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} />
                    ))}
                  </Box>
                )}
              >
                {['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto'].map((restriction) => (
                  <MenuItem key={restriction} value={restriction}>
                    {restriction}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Cooking Skill</InputLabel>
              <Select
                value={userProfile.cookingSkill}
                onChange={(e) => handleProfileUpdate('cookingSkill', e.target.value)}
              >
                {['beginner', 'intermediate', 'advanced'].map((skill) => (
                  <MenuItem key={skill} value={skill}>
                    {skill}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box>
              <Typography gutterBottom>Daily Calories Target</Typography>
              <Slider
                value={userProfile.caloriesTarget}
                onChange={(e, value) => handleProfileUpdate('caloriesTarget', value)}
                min={1200}
                max={4000}
                step={100}
                valueLabelDisplay="auto"
              />
            </Box>

            <Box>
              <Typography gutterBottom>Cooking Time (minutes)</Typography>
              <Slider
                value={userProfile.cookingTime}
                onChange={(e, value) => handleProfileUpdate('cookingTime', value)}
                min={15}
                max={120}
                step={15}
                valueLabelDisplay="auto"
              />
            </Box>
          </Box>
        </PreferencesPanel>

        <AnimatePresence>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : mealPlan?.map((meal, index) => (
            <motion.div
              key={meal.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
            >
              <MealCard
                onClick={() => handleMealSelection(meal)}
                sx={{
                  cursor: 'pointer',
                  transform: selectedMeal?.name === meal.name ? 'scale(1.02)' : 'scale(1)',
                  transition: 'transform 0.2s',
                }}
              >
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    {meal.name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip
                      icon={<RestaurantIcon />}
                      label={`${meal.difficulty}`}
                    />
                    <Chip
                      icon={<TimerIcon />}
                      label={`${meal.time} min`}
                    />
                    <Chip
                      icon={<LocalDiningIcon />}
                      label={`${meal.nutrition.calories} cal`}
                    />
                  </Box>

                  {selectedMeal?.name === meal.name && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <Typography variant="subtitle1" gutterBottom>
                        Ingredients
                      </Typography>
                      <List dense>
                        {meal.ingredients.map((ingredient, idx) => (
                          <ListItem key={idx}>
                            <ListItemText
                              primary={ingredient.name}
                              secondary={`${ingredient.amount} ${ingredient.unit}`}
                            />
                          </ListItem>
                        ))}
                      </List>

                      <Typography variant="subtitle1" gutterBottom>
                        Steps
                      </Typography>
                      <List dense>
                        {meal.steps.map((step, idx) => (
                          <ListItem key={idx}>
                            <ListItemText primary={step} />
                          </ListItem>
                        ))}
                      </List>

                      <NutritionChart>
                        {Object.entries(meal.nutrition).map(([nutrient, value]) => (
                          <Box key={nutrient} sx={{ textAlign: 'center' }}>
                            <CircularProgress
                              variant="determinate"
                              value={(value / (nutrient === 'calories' ? 800 : 100)) * 100}
                              sx={{ mb: 1 }}
                            />
                            <Typography variant="caption" display="block">
                              {nutrient}
                            </Typography>
                            <Typography variant="body2">
                              {value}{nutrient === 'calories' ? '' : 'g'}
                            </Typography>
                          </Box>
                        ))}
                      </NutritionChart>
                    </motion.div>
                  )}
                </CardContent>
              </MealCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </Box>

      <Box sx={{ gridColumn: '2 / 3', gridRow: '1 / 2' }}>
        <Box sx={{ position: 'relative', height: '200px' }}>
          <PetHologram
            petData={{
              ...petData,
              currentEmotion: petMood,
            }}
          />
        </Box>

        <MealCard>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Food Recognition
            </Typography>
            <Button
              variant="contained"
              startIcon={<CameraAltIcon />}
              onClick={() => document.getElementById('food-input').click()}
              fullWidth
            >
              Analyze Food
            </Button>
            <input
              id="food-input"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFoodCapture}
              style={{ display: 'none' }}
            />
          </CardContent>
        </MealCard>

        <Button
          variant="contained"
          color="primary"
          onClick={generateMealPlan}
          startIcon={<RestaurantIcon />}
          fullWidth
          sx={{ mt: 2 }}
        >
          Generate New Plan
        </Button>
      </Box>
    </PlannerContainer>
  );
};

export default MealPlanner;
