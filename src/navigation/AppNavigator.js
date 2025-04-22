import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import * as Linking from 'expo-linking';
import * as NavigationBar from 'expo-navigation-bar';
import DebugUtil from '../utils/debug';
import CustomTabBar from '../components/navigation/CustomTabBar';
import { Text } from 'react-native';

// Navigation configurations
import linking from './linking';
import {
  fadeTransition,
  slideTransition,
  scaleTransition,
  bottomSheetTransition,
  tabBarAnimation,
} from './transitions';

// Screens
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import PetInteractionScreen from '../screens/pet/PetInteractionScreen';
import MindfulnessScreen from '../screens/mindfulness/MindfulnessScreen';
import CommunityScreen from '../screens/social/CommunityScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import ARPetView from '../components/ar/ARPetView';
import StoreScreen from '../screens/store/StoreScreen';
import HomeScreen from '../screens/HomeScreen';
import { PetSelectionScreen } from '../screens/PetSelectionScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Define allowed navigation transitions for validation
const allowedTransitions = {
  Onboarding: ['Main', 'PetSelection'],
  PetSelection: ['MainTabs'],
  MainTabs: ['AR', 'Store'],
  AR: ['MainTabs'],
  Store: ['MainTabs'],
  PetInteraction: ['Store', 'AR'],
  Mindfulness: ['MainTabs', 'AR'],
  Community: ['MainTabs', 'AR'],
  Profile: ['MainTabs', 'Store'],
  Home: ['PetDetail'],
};

const HomeStack = () => (
  <Stack.Navigator
    screenOptions={{
      ...slideTransition,
      headerShown: false,
      cardStyle: { backgroundColor: 'transparent' },
    }}
  >
    <Stack.Screen 
      name="PetInteraction" 
      component={PetInteractionScreen}
      listeners={{
        focus: () => {
          DebugUtil.logNavigation('HomeStack', 'PetInteraction');
        },
      }}
    />
    <Stack.Screen 
      name="Store" 
      component={StoreScreen}
      options={{
        ...scaleTransition,
        headerShown: true,
        headerTransparent: true,
        title: 'Pet Store',
      }}
      listeners={{
        focus: () => {
          DebugUtil.logNavigation('HomeStack', 'Store');
        },
      }}
    />
    <Stack.Screen 
      name="Home" 
      component={HomeScreen} 
      listeners={{
        focus: () => {
          DebugUtil.logNavigation('HomeStack', 'Home');
        },
      }}
    />

  </Stack.Navigator>
);

const MainTabs = () => {
  const pet = useSelector(state => state.pet);
  
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        tabBarStyle: {
          ...tabBarAnimation.tabBarStyle,
          borderTopWidth: 0,
          elevation: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#999',
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: true,
      }}
      screenListeners={{
        tabPress: e => {
          DebugUtil.logNavigation('MainTabs', e.target?.split('-')[0]);
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Icon name="paw" size={size} color={color} />
          ),
          tabBarBadge: pet.needsAttention ? '!' : undefined,
          tabBarTestID: 'home-tab',
        }}
      />
      <Tab.Screen
        name="Mindfulness"
        component={MindfulnessScreen}
        options={{
          headerTransparent: true,
          tabBarIcon: ({ color, size }) => (
            <Icon name="meditation" size={size} color={color} />
          ),
          tabBarTestID: 'mindfulness-tab',
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityScreen}
        options={{
          headerTransparent: true,
          tabBarIcon: ({ color, size }) => (
            <Icon name="account-group" size={size} color={color} />
          ),
          tabBarTestID: 'community-tab',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerTransparent: true,
          tabBarIcon: ({ color, size }) => (
            <Icon name="account" size={size} color={color} />
          ),
          tabBarTestID: 'profile-tab',
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const isFirstLaunch = useSelector(state => state.app?.isFirstLaunch);

  useEffect(() => {
    // Initialize debug utilities
    DebugUtil.init();

    // Set navigation bar appearance
    NavigationBar.setBackgroundColorAsync('rgba(255, 255, 255, 0.9)');
    NavigationBar.setButtonStyleAsync('dark');
  }, []);

  return (
    <NavigationContainer
      linking={linking}
      fallback={<Text>Loading...</Text>}
      onStateChange={(state) => {
        // Track navigation state changes
        const currentRoute = state?.routes[state.routes.length - 1];
        const previousRoute = state?.routes[state.routes.length - 2];

        if (currentRoute) {
          // Validate navigation transition
          if (previousRoute) {
            DebugUtil.validateNavigation(
              previousRoute.name,
              currentRoute.name,
              allowedTransitions
            );
          }
          DebugUtil.logNavigation('AppNavigator', currentRoute.name);
        }
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          ...fadeTransition,
        }}
      >
        {isFirstLaunch && (
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={fadeTransition}
            listeners={{
              focus: () => {
                DebugUtil.logNavigation('Initial', 'Onboarding');
              },
            }}
          />
        )}
        <Stack.Screen name="PetSelection" component={PetSelectionScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen
          name="AR"
          component={ARPetView}
          options={{
            ...bottomSheetTransition,
            gestureEnabled: true,
            headerShown: true,
            headerTransparent: true,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
