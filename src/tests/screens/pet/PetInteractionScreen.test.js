import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import PetInteractionScreen from '../../../screens/pet/PetInteractionScreen';
import PetInteractionSystem from '../../../systems/PetInteraction';
import { PetModel, EmotionalStates } from '../../../models/PetModel';

// Create mock store
const mockStore = configureStore([]);

describe('PetInteractionScreen', () => {
  let store;
  let pet;

  beforeEach(() => {
    pet = new PetModel();
    store = mockStore({
      pet: {
        currentPet: pet,
      },
      currency: {
        vitality_points: 100,
      },
    });

    // Mock dispatch
    store.dispatch = jest.fn();
  });

  const renderWithProvider = (component) => {
    return render(
      <Provider store={store}>
        {component}
      </Provider>
    );
  };

  test('renders all interaction buttons', () => {
    const { getByText } = renderWithProvider(<PetInteractionScreen />);
    
    expect(getByText('Pet')).toBeTruthy();
    expect(getByText('Play')).toBeTruthy();
    expect(getByText('Feed')).toBeTruthy();
    expect(getByText('Groom')).toBeTruthy();
    expect(getByText('Heal')).toBeTruthy();
    expect(getByText('Exercise')).toBeTruthy();
  });

  test('handles interaction button press', () => {
    const { getByText } = renderWithProvider(<PetInteractionScreen />);
    
    act(() => {
      fireEvent.press(getByText('Pet'));
    });

    // Should dispatch updatePet and addCurrency actions
    expect(store.dispatch).toHaveBeenCalledTimes(2);
  });

  test('shows cooldown timer when interaction is on cooldown', () => {
    // Mock cooldown
    jest.spyOn(PetInteractionSystem, 'getRemainingCooldown')
      .mockImplementation(() => 5000);

    const { getByText } = renderWithProvider(<PetInteractionScreen />);
    
    // Should show cooldown text
    expect(getByText('5s')).toBeTruthy();
  });

  test('disables buttons during cooldown', () => {
    // Mock cooldown
    jest.spyOn(PetInteractionSystem, 'getRemainingCooldown')
      .mockImplementation(() => 5000);

    const { getByText } = renderWithProvider(<PetInteractionScreen />);
    const petButton = getByText('Pet').parent;
    
    expect(petButton.props.disabled).toBe(true);
  });

  test('updates interaction menu visibility', () => {
    const { getByTestId } = renderWithProvider(<PetInteractionScreen />);
    const menuButton = getByTestId('interaction-menu-button');
    
    act(() => {
      fireEvent.press(menuButton);
    });

    const menu = getByTestId('interaction-menu');
    expect(menu.props.style.transform).toEqual([{ translateY: 0 }]);
  });
});
