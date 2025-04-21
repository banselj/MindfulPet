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

export default function App() {
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
    return <LoadingScreen />;
  }

  return (
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
