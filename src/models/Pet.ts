// Legacy Pet class: Consider merging with PetModel or removing if redundant.
import { PetTypes, PetStages, EmotionalStates, GroomingStates, PersonalityTypes, PhysicalStates, PetAttributes, PetStats, PetEnhancements, PetHistoryEntry } from './PetModel';

/**
 * Pet (legacy) - consider deprecating in favor of PetModel.
 */
export class Pet {
  petId: string;
  ownerId: string | null;
  petType: PetTypes;
  currentStage: PetStages;
  attributes: PetAttributes;
  stats: PetStats;
  enhancements: PetEnhancements;
  history: PetHistoryEntry[];
  lastUpdate: string;
  createdAt: string;

  constructor(type: PetTypes = PetTypes.CANINE) {
    // This class is a placeholder; prefer PetModel for all logic.
    this.petId = '';
    this.ownerId = null;
    this.petType = type;
    this.currentStage = PetStages.PUPPY;
    this.attributes = {
      physicalHealth: 1.0,
      emotionalState: EmotionalStates.HAPPY,
      grooming: GroomingStates.CLEAN_CUT,
      illness: false,
      personality: PersonalityTypes.PLAYFUL,
      age: 0,
      energy: 1.0,
      happiness: 1.0,
      nutrition: 1.0,
      hydration: 1.0,
      exercise: 1.0,
      mindfulness: 1.0,
      socialInteraction: 1.0,
    };
    this.stats = {
      totalInteractions: 0,
      streakDays: 0,
      achievementsUnlocked: 0,
      evolutionProgress: 0,
      personalityScores: {
        PLAYFUL: 0,
        CALM: 0,
        WISE: 0,
        ADVENTUROUS: 0,
      },
    };
    this.enhancements = {
      accessories: [],
      habitat: 'Basic Home',
      evolutionBoosts: [],
      activeEffects: [],
    };
    this.history = [];
    this.lastUpdate = new Date().toISOString();
    this.createdAt = new Date().toISOString();
  }
}

export default Pet;
