module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    '\\.svg': '<rootDir>/__mocks__/svgMock.js',
    '^expo-secure-store$': '<rootDir>/__mocks__/expo-secure-store.js',
    '^expo-crypto$': '<rootDir>/__mocks__/expo-crypto.js',
    '^expo-local-authentication$': '<rootDir>/__mocks__/expo-local-authentication.js',
    '^@react-native-async-storage/async-storage$': '<rootDir>/__mocks__/@react-native-async-storage/async-storage.js',
    '^@react-native-firebase/auth$': '<rootDir>/__mocks__/@react-native-firebase/auth.js',
    '^@react-native-firebase/firestore$': '<rootDir>/__mocks__/@react-native-firebase/firestore.js',
    '^openai$': '<rootDir>/__mocks__/openai.js',
    '^@tensorflow/tfjs$': '<rootDir>/__mocks__/@tensorflow/tfjs.js',
    '^@tensorflow-models/face-landmarks-detection$': '<rootDir>/__mocks__/@tensorflow-models/face-landmarks-detection.js',
    '^elevenlabs-node$': '<rootDir>/__mocks__/elevenlabs-node.js',
    '^react-native$': '<rootDir>/__mocks__/react-native.js',
  },
  testEnvironment: 'node',
};
