import React from 'react';
import { render, act } from '@testing-library/react-native';
import PetRenderer from '../../../components/pet/PetRenderer';
import { PetModel, EmotionalStates } from '../../../models/PetModel';
import PetAnimationSystem from '../../../systems/PetAnimation';

// Mock the animation system
jest.mock('../../../systems/PetAnimation', () => ({
  initializeAnimations: jest.fn(),
  cleanupAnimations: jest.fn(),
  playIdleAnimation: jest.fn(),
  updateAnimationStates: jest.fn(),
  getPetAsset: jest.fn(),
  getAccessoryAsset: jest.fn(),
  VisualEffect: jest.fn(() => null),
}));

describe('PetRenderer', () => {
  let pet;
  
  beforeEach(() => {
    pet = new PetModel();
    // Reset all mocks
    jest.clearAllMocks();
  });

  test('initializes animations on mount', () => {
    render(<PetRenderer pet={pet} />);
    expect(PetAnimationSystem.initializeAnimations).toHaveBeenCalled();
  });

  test('cleans up animations on unmount', () => {
    const { unmount } = render(<PetRenderer pet={pet} />);
    unmount();
    expect(PetAnimationSystem.cleanupAnimations).toHaveBeenCalled();
  });

  test('updates animations when pet state changes', () => {
    const { rerender } = render(<PetRenderer pet={pet} />);
    
    // Update pet state
    pet.attributes.emotionalState = EmotionalStates.HAPPY;
    rerender(<PetRenderer pet={pet} />);
    
    expect(PetAnimationSystem.updateAnimationStates).toHaveBeenCalled();
  });

  test('renders accessories when present', () => {
    pet.enhancements.accessories = [{ id: 'hat_001' }];
    render(<PetRenderer pet={pet} />);
    expect(PetAnimationSystem.getAccessoryAsset).toHaveBeenCalledWith('hat_001');
  });

  test('renders visual effects when present', () => {
    pet.enhancements.activeEffects = [
      { id: 'sparkle_001', type: 'sparkle' },
      { id: 'aura_001', type: 'aura' },
    ];
    const { container } = render(<PetRenderer pet={pet} />);
    expect(PetAnimationSystem.VisualEffect).toHaveBeenCalledTimes(2);
  });

  test('handles custom size prop', () => {
    const { container } = render(<PetRenderer pet={pet} size={300} />);
    // Check if the container style includes the custom size
    expect(container.props.style).toMatchObject({
      width: 300,
      height: 300,
    });
  });
});
