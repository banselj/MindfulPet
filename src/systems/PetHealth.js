import { PhysicalStates, EmotionalStates } from '../models/PetModel';

export class PetHealthSystem {
  static HEALTH_DECAY_RATE = {
    physicalHealth: 0.1,
    happiness: 0.08,
    energy: 0.15,
    nutrition: 0.2,
    hydration: 0.25,
    mindfulness: 0.05,
    socialInteraction: 0.1,
  };

  static RECOVERY_RATES = {
    physicalHealth: 0.15,
    happiness: 0.2,
    energy: 0.3,
    nutrition: 0.4,
    hydration: 0.5,
    mindfulness: 0.1,
    socialInteraction: 0.2,
  };

  static updateHealthStatus(pet, habitData) {
    // Calculate time-based decay
    const now = Date.now();
    const lastUpdate = new Date(pet.lastUpdate).getTime();
    const hoursElapsed = (now - lastUpdate) / (1000 * 60 * 60);

    // Apply time-based decay to all attributes
    Object.keys(this.HEALTH_DECAY_RATE).forEach(attribute => {
      const decayAmount = this.HEALTH_DECAY_RATE[attribute] * hoursElapsed;
      pet.attributes[attribute] = Math.max(0, pet.attributes[attribute] - decayAmount);
    });

    // Apply habit data improvements
    if (habitData) {
      this.applyHabitEffects(pet, habitData);
    }

    // Check for illness conditions
    this.checkIllness(pet);

    // Update last update timestamp
    pet.lastUpdate = new Date().toISOString();

    return pet;
  }

  static applyHabitEffects(pet, habitData) {
    // Exercise effects
    if (habitData.exercise) {
      pet.attributes.physicalHealth = Math.min(1, pet.attributes.physicalHealth + 
        (this.RECOVERY_RATES.physicalHealth * habitData.exercise));
      pet.attributes.energy = Math.max(0, pet.attributes.energy - 0.2); // Exercise consumes energy
    }

    // Nutrition effects
    if (habitData.nutrition) {
      pet.attributes.nutrition = Math.min(1, pet.attributes.nutrition + 
        (this.RECOVERY_RATES.nutrition * habitData.nutrition));
      pet.attributes.energy = Math.min(1, pet.attributes.energy + 0.1);
    }

    // Sleep effects
    if (habitData.sleep) {
      pet.attributes.energy = Math.min(1, pet.attributes.energy + 
        (this.RECOVERY_RATES.energy * habitData.sleep));
      pet.attributes.physicalHealth = Math.min(1, pet.attributes.physicalHealth + 0.05);
    }

    // Mindfulness effects
    if (habitData.mindfulness) {
      pet.attributes.mindfulness = Math.min(1, pet.attributes.mindfulness + 
        (this.RECOVERY_RATES.mindfulness * habitData.mindfulness));
      pet.attributes.happiness = Math.min(1, pet.attributes.happiness + 0.1);
    }

    // Social interaction effects
    if (habitData.socialInteraction) {
      pet.attributes.socialInteraction = Math.min(1, pet.attributes.socialInteraction + 
        (this.RECOVERY_RATES.socialInteraction * habitData.socialInteraction));
      pet.attributes.happiness = Math.min(1, pet.attributes.happiness + 0.1);
    }

    // Hydration effects
    if (habitData.hydration) {
      pet.attributes.hydration = Math.min(1, pet.attributes.hydration + 
        (this.RECOVERY_RATES.hydration * habitData.hydration));
      pet.attributes.physicalHealth = Math.min(1, pet.attributes.physicalHealth + 0.05);
    }
  }

  static checkIllness(pet) {
    const criticalAttributes = [
      'physicalHealth',
      'energy',
      'nutrition',
      'hydration'
    ];

    const wasIll = pet.attributes.illness;
    const criticalCount = criticalAttributes.filter(
      attr => pet.attributes[attr] < 0.3
    ).length;

    // Pet becomes ill if multiple critical attributes are low
    if (criticalCount >= 2) {
      pet.attributes.illness = true;
      if (!wasIll) {
        pet.addHistoryEntry('Pet became ill due to poor health');
      }
    } 
    // Pet recovers if all critical attributes are above threshold
    else if (wasIll && criticalAttributes.every(attr => pet.attributes[attr] >= 0.6)) {
      pet.attributes.illness = false;
      pet.addHistoryEntry('Pet recovered from illness');
    }
  }

  static applyHealingItem(pet, itemType) {
    switch (itemType) {
      case 'basic_healing_treat':
        this.applyHealing(pet, 0.3);
        pet.addHistoryEntry('Used basic healing treat');
        break;
      case 'premium_healing_potion':
        this.applyHealing(pet, 0.6);
        pet.addHistoryEntry('Used premium healing potion');
        break;
      case 'ultimate_restoration':
        this.applyHealing(pet, 1.0);
        pet.addHistoryEntry('Used ultimate restoration item');
        break;
    }
    return pet;
  }

  static applyHealing(pet, amount) {
    const attributes = [
      'physicalHealth',
      'energy',
      'nutrition',
      'hydration',
      'happiness'
    ];

    attributes.forEach(attr => {
      pet.attributes[attr] = Math.min(1, pet.attributes[attr] + amount);
    });

    if (amount >= 0.6) {
      pet.attributes.illness = false;
    }
  }

  static calculateOverallHealth(pet) {
    const weights = {
      physicalHealth: 0.25,
      energy: 0.15,
      nutrition: 0.15,
      hydration: 0.15,
      happiness: 0.15,
      mindfulness: 0.075,
      socialInteraction: 0.075
    };

    return Object.entries(weights).reduce((total, [attr, weight]) => {
      return total + (pet.attributes[attr] * weight);
    }, 0);
  }
}

export default PetHealthSystem;
