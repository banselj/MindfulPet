// ESLint v9+ flat config for React Native + TypeScript
import { fileURLToPath } from 'url';
import path from 'path';
import parser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactPlugin from 'eslint-plugin-react';
import reactNativePlugin from 'eslint-plugin-react-native';
import babelParser from '@babel/eslint-parser';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default [
  // Ignore system and build folders (ESLint v9+ flat config)
  {
    ignores: [
      'node_modules',
      '.expo',
      'coverage',
      'build',
      'dist',
      'index.js',
      'index.web.js',
      'jest.config.js',
      'jest.setup.js',
      'metro.config.js',
      'webpack.config.js',
      'babel.config.js',
      'scripts/**',
      '__mocks__/**',
      'tests/**',
      'App.js',
      'src/__tests__/**',
      'src/utils/__tests__/**',
      'src/ai/services/*.js',
      'src/components/*.js',
      'src/utils/*.js',
    ],
  },
  // TypeScript/TSX block
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
        ecmaVersion: 2020,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      react: reactPlugin,
      'react-native': reactNativePlugin,
    },
    rules: {
      'react-native/no-inline-styles': 'warn',
      'react-native/no-unused-styles': 'warn',
      'react-native/split-platform-components': 'off',
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  // JS/JSX and other files block
  {
    files: ['src/**/*.js', 'src/**/*.jsx'],
    languageOptions: {
      parser: babelParser,
      parserOptions: { requireConfigFile: false },
      ecmaVersion: 2020,
      sourceType: 'module',
    },
    plugins: {
      react: reactPlugin,
      'react-native': reactNativePlugin,
    },
    rules: {
      'react-native/no-inline-styles': 'warn',
      'react-native/no-unused-styles': 'warn',
      'react-native/split-platform-components': 'off',
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
];
