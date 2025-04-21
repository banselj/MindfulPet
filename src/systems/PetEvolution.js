import { PetStages, PhysicalStates } from '../models/PetModel';

export class PetEvolutionSystem {
  static EVOLUTION_THRESHOLDS = {
    [PetStages.PUPPY]: {
      age: 30, // days
      minHealth: 0.7,
      minHappiness: 0.7,
      streakDays: 7,
    },
    [PetStages.ADULT]: {
      age: 180, // days
      minHealth: 0.8,
      minHappiness: 0.8,
      streakDays: 30,
    },
    [PetStages.ELDER]: {
      age: 365, // days
      minHealth: 0.9,
      minHappiness: 0.9,
      streakDays: 90,
    },
  };

  static EVOLUTION_PATHS = {
    [PetStages.PUPPY]: {
      default: PetStages.ADULT,
      special: {
        condition: (pet) => 
          pet.stats.streakDays >= 14 && 
          pet.attributes.physicalHealth >= 0.9 &&
          pet.attributes.happiness >= 0.9,
        result: 'Elite Adult',
      },
    },
    [PetStages.ADULT]: {
      default: PetStages.ELDER,
      special: {
        condition: (pet) => 
          pet.stats.streakDays >= 60 && 
          pet.attributes.physicalHealth >= 0.95 &&
          pet.stats.achievementsUnlocked >= 10,
        result: 'Mystic Elder',
      },
    },
    [PetStages.ELDER]: {
      default: PetStages.LEGENDARY,
      special: {
        condition: (pet) =>
          pet.stats.streakDays >= 180 &&
          pet.attributes.physicalHealth >= 0.98 &&
          pet.stats.achievementsUnlocked >= 20,
        result: 'Celestial Legend',
      },
    },
  };

  static checkEvolution(pet, habitConsistency, specialBoost = false) {
    const currentStage = pet.currentStage;
    const threshold = this.EVOLUTION_THRESHOLDS[currentStage];
    
    if (!threshold) return pet;

    const ageInDays = (Date.now() - new Date(pet.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    const effectiveThreshold = specialBoost ? {
      ...threshold,
      age: threshold.age * 0.8,
      minHealth: threshold.minHealth * 0.9,
      minHappiness: threshold.minHappiness * 0.9,
      streakDays: Math.floor(threshold.streakDays * 0.8),
    } : threshold;

    if (
      ageInDays >= effectiveThreshold.age &&
      pet.attributes.physicalHealth >= effectiveThreshold.minHealth &&
      pet.attributes.happiness >= effectiveThreshold.minHappiness &&
      pet.stats.streakDays >= effectiveThreshold.streakDays &&
      habitConsistency >= (specialBoost ? 0.7 : 0.8)
    ) {
      return this.evolvePet(pet);
    }

    return pet;
  }

  static evolvePet(pet) {
    const evolutionPath = this.EVOLUTION_PATHS[pet.currentStage];
    if (!evolutionPath) return pet;

    // Check for special evolution path
    const specialEvolution = evolutionPath.special?.condition(pet) 
      ? evolutionPath.special.result 
      : null;

    const newStage = specialEvolution || evolutionPath.default;
    
    // Apply evolution
    pet.currentStage = newStage;
    pet.attributes.age += 1;
    
    // Apply evolution bonuses
    if (specialEvolution) {
      pet.attributes.physicalHealth = Math.min(1, pet.attributes.physicalHealth + 0.2);
      pet.attributes.happiness = Math.min(1, pet.attributes.happiness + 0.2);
      pet.stats.evolutionProgress += 20;
    } else {
      pet.attributes.physicalHealth = Math.min(1, pet.attributes.physicalHealth + 0.1);
      pet.attributes.happiness = Math.min(1, pet.attributes.happiness + 0.1);
      pet.stats.evolutionProgress += 10;
    }

    // Record the evolution
    pet.addHistoryEntry(`Evolved to ${newStage}`);
    
    // Add special effects for evolution
    pet.enhancements.activeEffects.push({
      type: 'evolution_aura',
      duration: 7 * 24 * 60 * 60 * 1000, // 7 days
      startTime: Date.now(),
    });

    return pet;
  }

  static calculateEvolutionProgress(pet) {
    const threshold = this.EVOLUTION_THRESHOLDS[pet.currentStage];
    if (!threshold) return 1; // Already at max evolution

    const ageProgress = Math.min(1, (Date.now() - new Date(pet.createdAt).getTime()) / (threshold.age * 24 * 60 * 60 * 1000));
    const healthProgress = pet.attributes.physicalHealth / threshold.minHealth;
    const happinessProgress = pet.attributes.happiness / threshold.minHappiness;
    const streakProgress = pet.stats.streakDays / threshold.streakDays;

    return (ageProgress + healthProgress + happinessProgress + streakProgress) / 4;
  }

  static applyEvolutionBoost(pet, boostType) {
    switch (boostType) {
      case 'mystic_elixir':
        pet.attributes.physicalHealth = Math.min(1, pet.attributes.physicalHealth + 0.3);
        pet.attributes.happiness = Math.min(1, pet.attributes.happiness + 0.3);
        pet.stats.evolutionProgress += 15;
        pet.addHistoryEntry('Used Mystic Elixir evolution boost');
        break;
      case 'legacy_medallion':
        pet.stats.streakDays += 7;
        pet.stats.evolutionProgress += 25;
        pet.addHistoryEntry('Used Legacy Medallion evolution boost');
        break;
      default:
        break;
    }
    return pet;
  }
}

export default PetEvolutionSystem;
