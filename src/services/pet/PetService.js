import { store } from '../../state/store';
import {
  updateHealth,
  updateEnergy,
  updateHappiness,
  updateCalmness,
  evolve,
  setPersonality,
} from '../../state/slices/petSlice';

class PetService {
  // Evolution thresholds
  static EVOLUTION_STAGES = {
    BABY: { name: 'baby', requiredAge: 0 },
    CHILD: { name: 'child', requiredAge: 7 },
    TEEN: { name: 'teen', requiredAge: 30 },
    ADULT: { name: 'adult', requiredAge: 90 },
    ELDER: { name: 'elder', requiredAge: 365 },
  };

  // Personality types and their conditions
  static PERSONALITY_TYPES = {
    ATHLETIC: 'athletic', // High exercise streak
    MINDFUL: 'mindful',   // High meditation streak
    SOCIAL: 'social',     // High social interaction
    PLAYFUL: 'playful',   // Frequent play sessions
    WISE: 'wise',         // Long-term consistency in habits
  };

  // Calculate overall pet wellness based on all attributes
  static calculateWellness() {
    const state = store.getState().pet;
    const {
      health,
      energy,
      happiness,
      calmness,
      grooming,
      nutrition,
      hydration,
    } = state;

    return {
      physical: (health + energy + nutrition + hydration) / 4,
      emotional: (happiness + calmness) / 2,
      overall: (health + energy + happiness + calmness + grooming + nutrition + hydration) / 7,
    };
  }

  // Check and trigger evolution if conditions are met
  static checkEvolution() {
    const { age, streaks } = store.getState().pet;
    const stages = PetService.EVOLUTION_STAGES;

    // Find the highest eligible evolution stage
    let newStage = stages.BABY.name;
    for (const stage of Object.values(stages)) {
      if (age >= stage.requiredAge) {
        newStage = stage.name;
      }
    }

    store.dispatch(evolve(newStage));
  }

  // Determine and update personality based on user habits
  static updatePersonality() {
    const { streaks } = store.getState().pet;
    const habits = store.getState().habits;

    // Example personality determination logic
    if (streaks.exercise > 30) {
      store.dispatch(setPersonality(PetService.PERSONALITY_TYPES.ATHLETIC));
    } else if (streaks.meditation > 30) {
      store.dispatch(setPersonality(PetService.PERSONALITY_TYPES.MINDFUL));
    }
    // Add more personality conditions as needed
  }

  // Generate pet feedback based on current state
  static generateFeedback() {
    const state = store.getState().pet;
    const wellness = this.calculateWellness();

    const feedbackMessages = [];

    // Physical wellness feedback
    if (wellness.physical < 50) {
      feedbackMessages.push("I'm not feeling my best. Could we focus on some healthy habits?");
    }

    // Emotional wellness feedback
    if (wellness.emotional < 50) {
      feedbackMessages.push("I'm feeling a bit down. Maybe we could do something fun together?");
    }

    // Specific attribute feedback
    if (state.energy < 30) {
      feedbackMessages.push("I'm getting tired. A good rest would help!");
    }

    if (state.hydration < 30) {
      feedbackMessages.push("Don't forget to stay hydrated! I mirror your water intake.");
    }

    return feedbackMessages;
  }

  // Update pet state based on user's daily activities
  static updatePetState(habitData) {
    const { habitName, amount } = habitData;

    switch (habitName) {
      case 'exercise':
        store.dispatch(updateEnergy(Math.max(0, store.getState().pet.energy - amount * 0.1)));
        store.dispatch(updateHealth(Math.min(100, store.getState().pet.health + amount * 0.2)));
        break;
      case 'meditation':
        store.dispatch(updateCalmness(Math.min(100, store.getState().pet.calmness + amount * 0.3)));
        store.dispatch(updateHappiness(Math.min(100, store.getState().pet.happiness + amount * 0.1)));
        break;
      // Add more habit types and their effects
    }

    // Check for evolution and personality updates
    this.checkEvolution();
    this.updatePersonality();
  }

  // Get appropriate pet animation based on current state
  static getPetAnimation() {
    const state = store.getState().pet;
    
    if (state.isSleeping) return 'sleeping';
    if (state.energy < 30) return 'tired';
    if (state.happiness > 80) return 'happy';
    return 'idle';
  }

  // Generate daily pet care recommendations
  static getDailyCareRecommendations() {
    const state = store.getState().pet;
    const recommendations = [];

    if (state.energy < 50) {
      recommendations.push({
        type: 'rest',
        message: 'Your pet needs rest. Consider taking a break yourself!',
        priority: 'high',
      });
    }

    if (state.happiness < 50) {
      recommendations.push({
        type: 'play',
        message: 'Your pet would love to play! Time for a fun activity?',
        priority: 'medium',
      });
    }

    return recommendations;
  }
}

export default PetService;
