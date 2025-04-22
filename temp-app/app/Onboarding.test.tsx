import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import Onboarding from './Onboarding';

describe('Onboarding', () => {
  it('renders welcome screen and navigates through steps', () => {
    const onFinish = jest.fn();
    const { getByText } = render(<Onboarding onFinish={onFinish} />);
    expect(getByText('Welcome to MindfulPet!')).toBeTruthy();
    fireEvent.press(getByText('Next'));
    expect(getByText('Quantum & Biometric Security')).toBeTruthy();
    fireEvent.press(getByText('Next'));
    fireEvent.press(getByText('Next'));
    fireEvent.press(getByText('Finish'));
    expect(onFinish).toHaveBeenCalled();
  });
});
