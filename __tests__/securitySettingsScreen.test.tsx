import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SecuritySettingsScreen from '../src/screens/settings/SecuritySettingsScreen';
import * as Clipboard from 'expo-clipboard';

describe('SecuritySettingsScreen', () => {
  it('renders without crashing', () => {
    const { getByText } = render(<SecuritySettingsScreen navigation={{}} />);
    expect(getByText('Security Settings')).toBeTruthy();
  });

  it('copies text to clipboard', async () => {
    jest.spyOn(Clipboard, 'setStringAsync').mockResolvedValueOnce(undefined);
    const { getByText } = render(<SecuritySettingsScreen navigation={{}} />);
    // Simulate copy action (replace with actual button if present)
    // fireEvent.press(getByText('Copy'));
    // expect(Clipboard.setStringAsync).toHaveBeenCalled();
    // TODO: Replace above with actual UI interaction
  });

  it('shows MFA options', () => {
    const { getByText } = render(<SecuritySettingsScreen navigation={{}} />);
    expect(getByText('Authenticator App (TOTP)')).toBeTruthy();
    expect(getByText('Biometric Authentication')).toBeTruthy();
    expect(getByText('Push Notifications')).toBeTruthy();
  });

  // Add more tests for session management, MFA toggles, etc.
});
