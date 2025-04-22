import React from 'react';
import { render } from '@testing-library/react-native';
import { IconSymbol } from './IconSymbol';

describe('IconSymbol', () => {
  it('renders a MaterialIcon for a known name', () => {
    const { getByTestId } = render(
      <IconSymbol name="house.fill" color="#000" />
    );
    // Should render something with accessibilityRole="image"
    expect(getByTestId('icon-symbol')).toBeTruthy();
  });
});
