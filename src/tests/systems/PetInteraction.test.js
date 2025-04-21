import PetInteractionSystem from '../../systems/PetInteraction';
import { PetModel, PersonalityTypes } from '../../models/PetModel';

describe('PetInteractionSystem', () => {
  let pet;

  beforeEach(() => {
    pet = new PetModel();
    PetInteractionSystem.lastInteractions.clear();
  });

  test('interact() should handle cooldowns correctly', () => {
    // First interaction should work
    const result1 = PetInteractionSystem.interact(pet, PetInteractionSystem.INTERACTION_TYPES.PET);
    expect(result1.success).toBe(true);

    // Immediate second interaction should fail due to cooldown
    const result2 = PetInteractionSystem.interact(pet, PetInteractionSystem.INTERACTION_TYPES.PET);
    expect(result2.success).toBe(false);
    expect(result2.message).toBe('Interaction is on cooldown');
  });

  test('personality multipliers should affect interaction effectiveness', () => {
    pet.attributes.personality = PersonalityTypes.PLAYFUL;
    const playResult = PetInteractionSystem.interact(pet, PetInteractionSystem.INTERACTION_TYPES.PLAY);
    
    // Reset cooldowns for next test
    PetInteractionSystem.lastInteractions.clear();
    
    pet.attributes.personality = PersonalityTypes.CALM;
    const playResult2 = PetInteractionSystem.interact(pet, PetInteractionSystem.INTERACTION_TYPES.PLAY);
    
    // Playful personality should have higher effectiveness for play action
    expect(playResult.effectiveness).toBeGreaterThan(playResult2.effectiveness);
  });

  test('pet state should affect interaction effectiveness', () => {
    // Test with low energy
    pet.attributes.energy = 0.2;
    const lowEnergyResult = PetInteractionSystem.interact(pet, PetInteractionSystem.INTERACTION_TYPES.PLAY);
    
    // Reset cooldowns and energy
    PetInteractionSystem.lastInteractions.clear();
    pet.attributes.energy = 1.0;
    
    const highEnergyResult = PetInteractionSystem.interact(pet, PetInteractionSystem.INTERACTION_TYPES.PLAY);
    
    // Higher energy should result in better effectiveness
    expect(highEnergyResult.effectiveness).toBeGreaterThan(lowEnergyResult.effectiveness);
  });

  test('interactions should update pet attributes correctly', () => {
    const initialHappiness = pet.attributes.happiness;
    PetInteractionSystem.interact(pet, PetInteractionSystem.INTERACTION_TYPES.PET);
    
    expect(pet.attributes.happiness).toBeGreaterThan(initialHappiness);
  });
});
