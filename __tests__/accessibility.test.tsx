import React from 'react';
import { render } from '@testing-library/react-native';
import SecuritySettingsScreen from '../src/screens/settings/SecuritySettingsScreen';

describe('Accessibility', () => {
  it('should have accessible labels for all major controls', () => {
    const { getByRole } = render(<SecuritySettingsScreen navigation={{}} />);
    // Example checks using getByRole and accessible label
    expect(getByRole('switch', { name: 'Authenticator App (TOTP)' })).toBeTruthy();
    expect(getByRole('switch', { name: 'Biometric Authentication' })).toBeTruthy();
    expect(getByRole('switch', { name: 'Push Notifications' })).toBeTruthy();
    // Add more checks for session termination, copy, etc.
  });
});
