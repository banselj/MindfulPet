import { v4 as uuidv4 } from 'uuid';

// Enumerations for various pet attributes
export enum PetTypes {
  CANINE = 'Canine',
  FELINE = 'Feline',
  MYSTICAL = 'Mystical',
}

export enum PetStages {
  PUPPY = 'Puppy',
  ADULT = 'Adult',
  ELDER = 'Elder',
  LEGENDARY = 'Legendary',
}

export enum EmotionalStates {
  HAPPY = 'happy',
  SAD = 'sad',
  ANXIOUS = 'anxious',
  CALM = 'calm',
  PLAYFUL = 'playful',
  TIRED = 'tired',
}

export enum GroomingStates {
  SCRAGGLY = 'scraggly',
  CLEAN_CUT = 'clean-cut',
  DULL = 'dull',
  SHINY = 'shiny',
}

export enum PersonalityTypes {
  PLAYFUL = 'playful',
  CALM = 'calm',
  WISE = 'wise',
  ADVENTUROUS = 'adventurous',
}

export enum PhysicalStates {
  SKINNY = 'skinny',
  AVERAGE = 'average',
  OVERWEIGHT = 'overweight',
  ENERGETIC = 'energetic',
  SLUGGISH = 'sluggish',
  STRONG = 'strong',
  WEAK = 'weak',
}

export interface PetAttributes {
  physicalHealth: number;
  emotionalState: EmotionalStates;
  grooming: GroomingStates;
  illness: boolean;
  personality: PersonalityTypes;
  age: number;
  energy: number;
  happiness: number;
  nutrition: number;
  hydration: number;
  exercise: number;
  mindfulness: number;
  socialInteraction: number;
}

export interface PetStats {
  totalInteractions: number;
  streakDays: number;
  achievementsUnlocked: number;
  evolutionProgress: number;
  personalityScores: Record<keyof typeof PersonalityTypes, number>;
}

export interface PetEnhancements {
  accessories: string[];
  habitat: string;
  evolutionBoosts: string[];
  activeEffects: string[];
}

export interface PetHistoryEntry {
  timestamp: string;
  event: string;
}

export interface PetModelJSON {
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
}

/**
 * PetModel represents a user's digital pet and its state.
 * Includes methods for state management, health checks, and serialization.
 */
export class PetModel {
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
    this.petId = uuidv4();
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

  // State calculation methods
  calculatePhysicalHealth(): PhysicalStates {
    const { exercise, nutrition, hydration, energy } = this.attributes;
    const healthIndex = (exercise * 0.4) + (nutrition * 0.3) + (hydration * 0.2) + (energy * 0.1);

    if (healthIndex >= 0.8) return PhysicalStates.ENERGETIC;
    if (healthIndex >= 0.6) return PhysicalStates.STRONG;
    if (healthIndex >= 0.4) return PhysicalStates.AVERAGE;
    if (healthIndex >= 0.2) return PhysicalStates.WEAK;
    return PhysicalStates.SLUGGISH;
  }

  calculateEmotionalState(): EmotionalStates {
    const { happiness, mindfulness, socialInteraction } = this.attributes;
    const emotionalIndex = (happiness * 0.4) + (mindfulness * 0.3) + (socialInteraction * 0.3);

    if (emotionalIndex >= 0.8) return EmotionalStates.HAPPY;
    if (emotionalIndex >= 0.6) return EmotionalStates.PLAYFUL;
    if (emotionalIndex >= 0.4) return EmotionalStates.CALM;
    if (emotionalIndex >= 0.2) return EmotionalStates.ANXIOUS;
    return EmotionalStates.SAD;
  }

  updateAttributes(newAttributes: Partial<PetAttributes>): this {
    this.attributes = { ...this.attributes, ...newAttributes };
    this.lastUpdate = new Date().toISOString();

    // Recalculate derived states
    const physicalState = this.calculatePhysicalHealth();
    const emotionalState = this.calculateEmotionalState();

    // Add to history if significant changes
    if (this.attributes.emotionalState !== emotionalState) {
      this.addHistoryEntry(`Mood changed to ${emotionalState}`);
      this.attributes.emotionalState = emotionalState;
    }

    // Check for illness
    this.checkHealth();

    // Update personality based on interactions
    this.updatePersonality();

    return this;
  }

  checkHealth(): void {
    const healthThreshold = 0.3;
    const wasIll = this.attributes.illness;

    if (
      this.attributes.physicalHealth < healthThreshold ||
      this.attributes.energy < healthThreshold ||
      this.attributes.nutrition < healthThreshold
    ) {
      this.attributes.illness = true;
      if (!wasIll) {
        this.addHistoryEntry('Pet became ill');
      }
    } else if (wasIll && this.attributes.physicalHealth > 0.6) {
      this.attributes.illness = false;
      this.addHistoryEntry('Pet recovered from illness');
    }
  }

  updatePersonality(): void {
    const scores = this.stats.personalityScores;
    const dominantScore = Math.max(...Object.values(scores));
    const dominantType = (Object.entries(scores)
      .find(([_, score]) => score === dominantScore)?.[0] ?? this.attributes.personality) as PersonalityTypes;

    if (dominantType && this.attributes.personality !== dominantType) {
      this.attributes.personality = dominantType;
      this.addHistoryEntry(`Personality evolved to ${dominantType}`);
    }
  }

  addHistoryEntry(event: string): void {
    this.history.push({
      timestamp: new Date().toISOString(),
      event,
    });
    // Keep history limited to last 100 entries
    if (this.history.length > 100) {
      this.history = this.history.slice(-100);
    }
  }

  toJSON(): PetModelJSON {
    return {
      petId: this.petId,
      ownerId: this.ownerId,
      petType: this.petType,
      currentStage: this.currentStage,
      attributes: this.attributes,
      stats: this.stats,
      enhancements: this.enhancements,
      history: this.history,
      lastUpdate: this.lastUpdate,
      createdAt: this.createdAt,
    };
  }

  static fromJSON(json: PetModelJSON): PetModel {
    const pet = new PetModel(json.petType);
    Object.assign(pet, json);
    return pet;
  }
}

export default PetModel;
