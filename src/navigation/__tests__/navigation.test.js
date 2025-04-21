import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import AppNavigator from '../AppNavigator';
import NavigationService from '../NavigationService';

const mockStore = configureStore([]);

describe('Navigation Testing', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      app: {
        isFirstLaunch: false,
      },
      pet: {
        needsAttention: false,
      },
      monetization: {
        subscription: {
          tier: 'free',
        },
        currencies: {
          vitalityPoints: 1000,
          luminescenceGems: 50,
        },
      },
      user: {
        name: 'Test User',
        level: 1,
      },
    });
  });

  const renderWithNavigation = (component) => {
    return render(
      <Provider store={store}>
        <NavigationContainer>
          {component}
        </NavigationContainer>
      </Provider>
    );
  };

  it('renders main navigation structure', () => {
    const { getByText } = renderWithNavigation(<AppNavigator />);
    expect(getByText('Home')).toBeTruthy();
    expect(getByText('Mindfulness')).toBeTruthy();
    expect(getByText('Community')).toBeTruthy();
    expect(getByText('Profile')).toBeTruthy();
  });

  it('shows onboarding on first launch', () => {
    store = mockStore({
      ...store.getState(),
      app: { isFirstLaunch: true },
    });
    const { getByTestId } = renderWithNavigation(<AppNavigator />);
    expect(getByTestId('onboarding-screen')).toBeTruthy();
  });

  it('navigates to AR view', () => {
    const { getByTestId } = renderWithNavigation(<AppNavigator />);
    fireEvent.press(getByTestId('ar-button'));
    expect(getByTestId('ar-view')).toBeTruthy();
  });

  it('handles deep linking', async () => {
    const { getByText } = renderWithNavigation(<AppNavigator />);
    await NavigationService.navigate('Store', { showSubscriptions: true });
    expect(getByText('Subscriptions')).toBeTruthy();
  });

  it('shows badge when pet needs attention', () => {
    store = mockStore({
      ...store.getState(),
      pet: { needsAttention: true },
    });
    const { getByTestId } = renderWithNavigation(<AppNavigator />);
    expect(getByTestId('tab-badge')).toBeTruthy();
  });
});
