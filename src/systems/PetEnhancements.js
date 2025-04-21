export class PetEnhancementSystem {
  static ENHANCEMENT_TYPES = {
    ACCESSORY: 'accessory',
    HABITAT: 'habitat',
    EVOLUTION_BOOST: 'evolution_boost',
    HEALING_ITEM: 'healing_item',
    VISUAL_EFFECT: 'visual_effect',
  };

  static CURRENCY_TYPES = {
    VITALITY_POINTS: 'vitality_points',
    LUMINESCENCE_GEMS: 'luminescence_gems',
  };

  static RARITY_LEVELS = {
    COMMON: { level: 1, name: 'Common', dropRate: 0.6 },
    RARE: { level: 2, name: 'Rare', dropRate: 0.25 },
    EPIC: { level: 3, name: 'Epic', dropRate: 0.1 },
    LEGENDARY: { level: 4, name: 'Legendary', dropRate: 0.05 },
  };

  static ENHANCEMENT_CATALOG = {
    accessories: {
      'red_collar': {
        id: 'red_collar',
        name: 'Red Collar',
        type: this.ENHANCEMENT_TYPES.ACCESSORY,
        rarity: this.RARITY_LEVELS.COMMON,
        cost: { currency: this.CURRENCY_TYPES.VITALITY_POINTS, amount: 100 },
        effects: { happiness: 0.1 },
        slot: 'neck',
      },
      'mystic_crown': {
        id: 'mystic_crown',
        name: 'Mystic Crown',
        type: this.ENHANCEMENT_TYPES.ACCESSORY,
        rarity: this.RARITY_LEVELS.LEGENDARY,
        cost: { currency: this.CURRENCY_TYPES.LUMINESCENCE_GEMS, amount: 500 },
        effects: { happiness: 0.3, evolution_boost: 0.2 },
        slot: 'head',
      },
    },
    habitats: {
      'cozy_cottage': {
        id: 'cozy_cottage',
        name: 'Cozy Cottage',
        type: this.ENHANCEMENT_TYPES.HABITAT,
        rarity: this.RARITY_LEVELS.RARE,
        cost: { currency: this.CURRENCY_TYPES.VITALITY_POINTS, amount: 500 },
        effects: { happiness: 0.2, energy_recovery: 0.1 },
      },
      'crystal_palace': {
        id: 'crystal_palace',
        name: 'Crystal Palace',
        type: this.ENHANCEMENT_TYPES.HABITAT,
        rarity: this.RARITY_LEVELS.LEGENDARY,
        cost: { currency: this.CURRENCY_TYPES.LUMINESCENCE_GEMS, amount: 1000 },
        effects: { happiness: 0.4, energy_recovery: 0.2, evolution_boost: 0.1 },
      },
    },
    evolution_boosts: {
      'mystic_elixir': {
        id: 'mystic_elixir',
        name: 'Mystic Elixir',
        type: this.ENHANCEMENT_TYPES.EVOLUTION_BOOST,
        rarity: this.RARITY_LEVELS.EPIC,
        cost: { currency: this.CURRENCY_TYPES.LUMINESCENCE_GEMS, amount: 300 },
        effects: { evolution_progress: 0.2 },
        duration: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
    },
    visual_effects: {
      'sparkle_aura': {
        id: 'sparkle_aura',
        name: 'Sparkle Aura',
        type: this.ENHANCEMENT_TYPES.VISUAL_EFFECT,
        rarity: this.RARITY_LEVELS.RARE,
        cost: { currency: this.CURRENCY_TYPES.VITALITY_POINTS, amount: 200 },
        effects: { visual_only: true },
        duration: 24 * 60 * 60 * 1000, // 1 day
      },
    },
  };

  static applyEnhancement(pet, enhancementId, slot = null) {
    const enhancement = this.findEnhancement(enhancementId);
    if (!enhancement) return { success: false, message: 'Enhancement not found' };

    // Check if the enhancement can be applied
    const validationResult = this.validateEnhancement(pet, enhancement, slot);
    if (!validationResult.success) return validationResult;

    // Apply the enhancement based on its type
    switch (enhancement.type) {
      case this.ENHANCEMENT_TYPES.ACCESSORY:
        return this.applyAccessory(pet, enhancement, slot);
      case this.ENHANCEMENT_TYPES.HABITAT:
        return this.applyHabitat(pet, enhancement);
      case this.ENHANCEMENT_TYPES.EVOLUTION_BOOST:
        return this.applyEvolutionBoost(pet, enhancement);
      case this.ENHANCEMENT_TYPES.VISUAL_EFFECT:
        return this.applyVisualEffect(pet, enhancement);
      default:
        return { success: false, message: 'Unknown enhancement type' };
    }
  }

  static findEnhancement(enhancementId) {
    for (const category of Object.values(this.ENHANCEMENT_CATALOG)) {
      if (category[enhancementId]) return category[enhancementId];
    }
    return null;
  }

  static validateEnhancement(pet, enhancement, slot) {
    // Check if pet already has this enhancement
    if (enhancement.type === this.ENHANCEMENT_TYPES.ACCESSORY) {
      const hasAccessory = pet.enhancements.accessories.some(
        a => a.id === enhancement.id
      );
      if (hasAccessory) {
        return { success: false, message: 'Pet already has this accessory' };
      }

      // Check if slot is already occupied
      if (slot && pet.enhancements.accessories.some(a => a.slot === slot)) {
        return { success: false, message: 'Slot is already occupied' };
      }
    }

    // Check for habitat replacement
    if (enhancement.type === this.ENHANCEMENT_TYPES.HABITAT &&
        pet.enhancements.habitat === enhancement.id) {
      return { success: false, message: 'Pet already has this habitat' };
    }

    return { success: true };
  }

  static applyAccessory(pet, enhancement, slot) {
    const accessory = {
      id: enhancement.id,
      name: enhancement.name,
      slot,
      appliedAt: Date.now(),
      effects: enhancement.effects,
    };

    pet.enhancements.accessories.push(accessory);
    this.applyEnhancementEffects(pet, enhancement.effects);
    pet.addHistoryEntry(`Applied ${enhancement.name} accessory`);

    return { success: true, message: 'Accessory applied successfully' };
  }

  static applyHabitat(pet, enhancement) {
    const oldHabitat = pet.enhancements.habitat;
    pet.enhancements.habitat = enhancement.id;
    
    // Remove old habitat effects if any
    if (oldHabitat) {
      const oldEnhancement = this.findEnhancement(oldHabitat);
      if (oldEnhancement) {
        this.removeEnhancementEffects(pet, oldEnhancement.effects);
      }
    }

    this.applyEnhancementEffects(pet, enhancement.effects);
    pet.addHistoryEntry(`Moved to ${enhancement.name}`);

    return { success: true, message: 'Habitat changed successfully' };
  }

  static applyEvolutionBoost(pet, enhancement) {
    const boost = {
      id: enhancement.id,
      name: enhancement.name,
      appliedAt: Date.now(),
      duration: enhancement.duration,
      effects: enhancement.effects,
    };

    pet.enhancements.evolutionBoosts.push(boost);
    this.applyEnhancementEffects(pet, enhancement.effects);
    pet.addHistoryEntry(`Applied ${enhancement.name} evolution boost`);

    return { success: true, message: 'Evolution boost applied successfully' };
  }

  static applyVisualEffect(pet, enhancement) {
    const effect = {
      id: enhancement.id,
      name: enhancement.name,
      appliedAt: Date.now(),
      duration: enhancement.duration,
    };

    pet.enhancements.activeEffects.push(effect);
    pet.addHistoryEntry(`Applied ${enhancement.name} visual effect`);

    return { success: true, message: 'Visual effect applied successfully' };
  }

  static applyEnhancementEffects(pet, effects) {
    Object.entries(effects).forEach(([attribute, value]) => {
      if (attribute in pet.attributes) {
        pet.attributes[attribute] = Math.min(1, pet.attributes[attribute] + value);
      } else if (attribute === 'evolution_boost') {
        pet.stats.evolutionProgress += value;
      }
    });
  }

  static removeEnhancementEffects(pet, effects) {
    Object.entries(effects).forEach(([attribute, value]) => {
      if (attribute in pet.attributes) {
        pet.attributes[attribute] = Math.max(0, pet.attributes[attribute] - value);
      } else if (attribute === 'evolution_boost') {
        pet.stats.evolutionProgress = Math.max(0, pet.stats.evolutionProgress - value);
      }
    });
  }

  static cleanupExpiredEnhancements(pet) {
    const now = Date.now();

    // Clean up evolution boosts
    pet.enhancements.evolutionBoosts = pet.enhancements.evolutionBoosts.filter(boost => {
      const isExpired = now - boost.appliedAt > boost.duration;
      if (isExpired) {
        this.removeEnhancementEffects(pet, boost.effects);
        pet.addHistoryEntry(`${boost.name} boost expired`);
      }
      return !isExpired;
    });

    // Clean up visual effects
    pet.enhancements.activeEffects = pet.enhancements.activeEffects.filter(effect => {
      const isExpired = now - effect.appliedAt > effect.duration;
      if (isExpired) {
        pet.addHistoryEntry(`${effect.name} effect expired`);
      }
      return !isExpired;
    });

    return pet;
  }
}

export default PetEnhancementSystem;
