import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from './src/store';
import { AuthProvider } from './src/contexts/AuthContext';
import { PetProvider } from './src/contexts/PetContext';
import { AchievementsProvider } from './src/contexts/AchievementsContext';
import AppNavigator from './src/navigation/AppNavigator';
import * as Font from 'expo-font';
import { MaterialCommunityIcons } from '@expo/vector-icons';

console.log('Starting app initialization...');

const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <Text style={styles.loadingText}>Loading MindfulPet...</Text>
    <ActivityIndicator size="large" color="#4CAF50" />
  </View>
);

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('Global error boundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={{ color: 'red', fontSize: 18 }}>An error occurred:</Text>
          <Text selectable style={{ color: 'red', fontSize: 14 }}>{String(this.state.error)}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  // DEBUG: Top-level banner
  if (typeof window !== 'undefined') {
    window.__MINDFULPET_DEBUG = true;
  }
  return (
    <View style={{ backgroundColor: 'yellow', padding: 12, zIndex: 9999 }}>
      <Text style={{ color: 'black', fontWeight: 'bold' }}>DEBUG: App.js is rendering</Text>
      {renderAppContent()}
    </View>
  );
}

function renderAppContent() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAssets() {
      try {
        await Font.loadAsync({
          ...MaterialCommunityIcons.font,
        });
      } catch (error) {
        console.error('Error loading fonts:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadAssets();
  }, []);

  if (isLoading) {
    console.log('App is loading...');
    return <LoadingScreen />;
  }
  console.log('App loaded, rendering providers and AppNavigator...');

  return (
    <GlobalErrorBoundary>
      <Provider store={store}>
        <SafeAreaProvider>
          <AuthProvider>
            <PetProvider>
              <AchievementsProvider>
                <AppNavigator />
              </AchievementsProvider>
            </PetProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </Provider>
    </GlobalErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#4CAF50',
    marginBottom: 16,
  },
});
