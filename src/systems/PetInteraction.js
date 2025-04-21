import { DeviceEventEmitter } from 'react-native';
import { EmotionalStates, PersonalityTypes } from '../models/PetModel';

export class PetInteractionSystem {
  static INTERACTION_TYPES = {
    PET: 'pet',
    PLAY: 'play',
    FEED: 'feed',
    GROOM: 'groom',
    HEAL: 'heal',
    EXERCISE: 'exercise',
    MEDITATE: 'meditate',
  };

  static PERSONALITY_WEIGHTS = {
    [PersonalityTypes.PLAYFUL]: {
      [this.INTERACTION_TYPES.PLAY]: 1.5,
      [this.INTERACTION_TYPES.EXERCISE]: 1.3,
      [this.INTERACTION_TYPES.PET]: 1.0,
    },
    [PersonalityTypes.CALM]: {
      [this.INTERACTION_TYPES.MEDITATE]: 1.5,
      [this.INTERACTION_TYPES.PET]: 1.3,
      [this.INTERACTION_TYPES.GROOM]: 1.2,
    },
    [PersonalityTypes.WISE]: {
      [this.INTERACTION_TYPES.MEDITATE]: 1.3,
      [this.INTERACTION_TYPES.HEAL]: 1.2,
      [this.INTERACTION_TYPES.GROOM]: 1.1,
    },
    [PersonalityTypes.ADVENTUROUS]: {
      [this.INTERACTION_TYPES.EXERCISE]: 1.5,
      [this.INTERACTION_TYPES.PLAY]: 1.3,
      [this.INTERACTION_TYPES.FEED]: 1.1,
    },
  };

  static INTERACTION_COOLDOWNS = {
    [this.INTERACTION_TYPES.PET]: 5000,
    [this.INTERACTION_TYPES.PLAY]: 30000,
    [this.INTERACTION_TYPES.FEED]: 3600000,
    [this.INTERACTION_TYPES.GROOM]: 3600000,
    [this.INTERACTION_TYPES.HEAL]: 7200000,
    [this.INTERACTION_TYPES.EXERCISE]: 3600000,
    [this.INTERACTION_TYPES.MEDITATE]: 1800000,
  };

  static lastInteractions = new Map();

  static interact(pet, interactionType, intensity = 1) {
    // Check cooldown
    if (!this.canInteract(interactionType)) {
      return {
        success: false,
        message: 'Interaction is on cooldown',
        cooldownRemaining: this.getRemainingCooldown(interactionType),
      };
    }

    // Get personality multiplier
    const personalityMultiplier = this.getPersonalityMultiplier(
      pet.attributes.personality,
      interactionType
    );

    // Calculate interaction effectiveness
    const effectiveness = this.calculateEffectiveness(
      pet,
      interactionType,
      intensity,
      personalityMultiplier
    );

    // Apply interaction effects
    this.applyInteractionEffects(pet, interactionType, effectiveness);

    // Update cooldown
    this.updateCooldown(interactionType);

    // Emit interaction event
    DeviceEventEmitter.emit('PET_INTERACTION', {
      type: interactionType,
      effectiveness,
      pet: pet.toJSON(),
    });

    return {
      success: true,
      effectiveness,
      message: this.getInteractionMessage(interactionType, effectiveness),
    };
  }

  static canInteract(interactionType) {
    const lastInteraction = this.lastInteractions.get(interactionType);
    if (!lastInteraction) return true;

    const cooldown = this.INTERACTION_COOLDOWNS[interactionType];
    return Date.now() - lastInteraction >= cooldown;
  }

  static getRemainingCooldown(interactionType) {
    const lastInteraction = this.lastInteractions.get(interactionType);
    if (!lastInteraction) return 0;

    const cooldown = this.INTERACTION_COOLDOWNS[interactionType];
    const remaining = cooldown - (Date.now() - lastInteraction);
    return Math.max(0, remaining);
  }

  static getPersonalityMultiplier(personality, interactionType) {
    return this.PERSONALITY_WEIGHTS[personality]?.[interactionType] || 1.0;
  }

  static calculateEffectiveness(pet, interactionType, intensity, personalityMultiplier) {
    let baseEffectiveness = intensity * personalityMultiplier;

    // Modify effectiveness based on pet state
    if (pet.attributes.illness) {
      baseEffectiveness *= 0.5;
    }
    if (pet.attributes.energy < 0.3) {
      baseEffectiveness *= 0.7;
    }

    // Add some randomness
    const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
    return baseEffectiveness * randomFactor;
  }

  static applyInteractionEffects(pet, interactionType, effectiveness) {
    switch (interactionType) {
      case this.INTERACTION_TYPES.PET:
        this.applyPettingEffects(pet, effectiveness);
        break;
      case this.INTERACTION_TYPES.PLAY:
        this.applyPlayEffects(pet, effectiveness);
        break;
      case this.INTERACTION_TYPES.FEED:
        this.applyFeedingEffects(pet, effectiveness);
        break;
      case this.INTERACTION_TYPES.GROOM:
        this.applyGroomingEffects(pet, effectiveness);
        break;
      case this.INTERACTION_TYPES.HEAL:
        this.applyHealingEffects(pet, effectiveness);
        break;
      case this.INTERACTION_TYPES.EXERCISE:
        this.applyExerciseEffects(pet, effectiveness);
        break;
      case this.INTERACTION_TYPES.MEDITATE:
        this.applyMeditationEffects(pet, effectiveness);
        break;
    }

    // Update personality scores based on interaction
    this.updatePersonalityScores(pet, interactionType, effectiveness);
  }

  static applyPettingEffects(pet, effectiveness) {
    pet.attributes.happiness = Math.min(1, pet.attributes.happiness + 0.1 * effectiveness);
    pet.attributes.socialInteraction = Math.min(1, pet.attributes.socialInteraction + 0.05 * effectiveness);
  }

  static applyPlayEffects(pet, effectiveness) {
    pet.attributes.happiness = Math.min(1, pet.attributes.happiness + 0.15 * effectiveness);
    pet.attributes.energy = Math.max(0, pet.attributes.energy - 0.1 * effectiveness);
    pet.attributes.socialInteraction = Math.min(1, pet.attributes.socialInteraction + 0.1 * effectiveness);
  }

  static applyFeedingEffects(pet, effectiveness) {
    pet.attributes.nutrition = Math.min(1, pet.attributes.nutrition + 0.3 * effectiveness);
    pet.attributes.energy = Math.min(1, pet.attributes.energy + 0.2 * effectiveness);
    pet.attributes.happiness = Math.min(1, pet.attributes.happiness + 0.1 * effectiveness);
  }

  static applyGroomingEffects(pet, effectiveness) {
    pet.attributes.happiness = Math.min(1, pet.attributes.happiness + 0.1 * effectiveness);
    pet.attributes.socialInteraction = Math.min(1, pet.attributes.socialInteraction + 0.05 * effectiveness);
  }

  static applyHealingEffects(pet, effectiveness) {
    if (pet.attributes.illness) {
      const recoveryChance = 0.3 * effectiveness;
      if (Math.random() < recoveryChance) {
        pet.attributes.illness = false;
        pet.addHistoryEntry('Recovered from illness through healing');
      }
    }
    pet.attributes.physicalHealth = Math.min(1, pet.attributes.physicalHealth + 0.2 * effectiveness);
  }

  static applyExerciseEffects(pet, effectiveness) {
    pet.attributes.physicalHealth = Math.min(1, pet.attributes.physicalHealth + 0.2 * effectiveness);
    pet.attributes.energy = Math.max(0, pet.attributes.energy - 0.2 * effectiveness);
    pet.attributes.happiness = Math.min(1, pet.attributes.happiness + 0.1 * effectiveness);
  }

  static applyMeditationEffects(pet, effectiveness) {
    pet.attributes.mindfulness = Math.min(1, pet.attributes.mindfulness + 0.2 * effectiveness);
    pet.attributes.happiness = Math.min(1, pet.attributes.happiness + 0.15 * effectiveness);
    pet.attributes.energy = Math.min(1, pet.attributes.energy + 0.1 * effectiveness);
  }

  static updatePersonalityScores(pet, interactionType, effectiveness) {
    // Find which personality types favor this interaction
    Object.entries(this.PERSONALITY_WEIGHTS).forEach(([personality, weights]) => {
      if (weights[interactionType]) {
        const score = weights[interactionType] * effectiveness;
        pet.stats.personalityScores[personality] += score;
      }
    });
  }

  static updateCooldown(interactionType) {
    this.lastInteractions.set(interactionType, Date.now());
  }

  static getInteractionMessage(interactionType, effectiveness) {
    const messages = {
      [this.INTERACTION_TYPES.PET]: [
        'Your pet purrs contentedly',
        'Your pet nuzzles against you',
        'Your pet seems very happy',
      ],
      [this.INTERACTION_TYPES.PLAY]: [
        'Your pet had a great time playing!',
        'Your pet is full of energy and joy',
        'Your pet wants to play more',
      ],
      // Add messages for other interaction types
    };

    const messageSet = messages[interactionType] || ['Your pet enjoyed that!'];
    const messageIndex = Math.floor(effectiveness * messageSet.length);
    return messageSet[Math.min(messageSet.length - 1, messageIndex)];
  }
}

export default PetInteractionSystem;
