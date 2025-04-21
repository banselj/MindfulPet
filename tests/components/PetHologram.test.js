import React from 'react';
import { render } from '@testing-library/react';
import PetHologram from '../../src/components/holographics/PetHologram';
import { Canvas } from '@react-three/fiber';

// Mock Canvas and other Three.js components
jest.mock('@react-three/fiber', () => ({
  Canvas: ({ children }) => <div data-testid="canvas">{children}</div>,
  useFrame: () => jest.fn(),
}));

jest.mock('@react-three/drei', () => ({
  OrbitControls: () => null,
  Environment: () => null,
  ContactShadows: () => null,
  useGLTF: () => ({
    scene: {
      clone: () => ({}),
      traverse: () => {},
    },
  }),
}));

describe('PetHologram', () => {
  const mockPetData = {
    modelPath: '/assets/models/default_pet.glb',
    currentEmotion: 'happy',
  };

  it('renders without crashing', () => {
    const { getByTestId } = render(<PetHologram petData={mockPetData} />);
    expect(getByTestId('canvas')).toBeInTheDocument();
  });
});
