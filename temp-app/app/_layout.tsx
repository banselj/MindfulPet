import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

import React, { useState } from 'react';
import Onboarding from './Onboarding';
import { SubscriptionProvider, useSubscription } from '../context/SubscriptionContext';
import PaywallScreen from '../components/ui/PaywallScreen';

function MainApp() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const { loading, isSubscribed } = useSubscription();

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (loading || !loaded) return null; // Optionally show a splash or loader
  if (!isSubscribed) return <PaywallScreen />;
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [showOnboarding, setShowOnboarding] = useState(true);
  if (showOnboarding) {
    return <Onboarding onFinish={() => setShowOnboarding(false)} />;
  }
  return (
    <SubscriptionProvider>
      <MainApp />
    </SubscriptionProvider>
  );
}
