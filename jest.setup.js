// Import Jest's expect
const { expect } = require('@jest/globals');
global.expect = expect;

// Gesture handler setup
import 'react-native-gesture-handler/jestSetup';

// Mock NativeEventEmitter
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');

// Mock DeviceEventEmitter
jest.mock('react-native/Libraries/EventEmitter/DeviceEventEmitter', () => ({
  addListener: jest.fn(),
  removeListener: jest.fn(),
  emit: jest.fn(),
}));

// Mock VirtualizedList internals
jest.mock('react-native/Libraries/Lists/VirtualizedList', () => 'VirtualizedList');
jest.mock('react-native/Libraries/Lists/VirtualizedListCellRenderer', () => 'VirtualizedListCellRenderer');

// Import testing library extensions
require('jest-extended');
require('@testing-library/jest-native');

// Mock performance API
global.performance = {
  now: () => Date.now()
};

// Mock Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'web'
  },
  Animated: {
    Value: jest.fn(),
    View: 'View',
    createAnimatedComponent: (component) => component,
  },
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => ({
  useAnimatedStyle: () => ({}),
  withSpring: () => ({}),
  withTiming: () => ({}),
  withRepeat: () => ({}),
  useSharedValue: () => ({ value: 0 }),
  withSequence: () => ({}),
  Easing: {
    bezier: () => ({}),
    linear: {},
    ease: {},
  },
  View: 'View',
  Text: 'Text',
  createAnimatedComponent: (component) => component,
}));

// Mock Animated
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock window for web environment
global.window = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

// Mock safe area context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: 'SafeAreaProvider',
  SafeAreaView: 'SafeAreaView',
  useSafeAreaInsets: jest.fn().mockReturnValue({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  }),
}));

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  useDispatch: () => jest.fn(),
}));

// Global test setup
jest.spyOn(console, 'warn').mockImplementation((...args) => {
  if (typeof args[0] === 'string' && args[0].includes('useNativeDriver')) {
    return;
  }
  console.warn(...args);
});
