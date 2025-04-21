import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

const CustomTabBar = ({ state, descriptors, navigation, position }) => {
  const insets = useSafeAreaInsets();

  return (
    <BlurView intensity={80} style={[styles.container, { paddingBottom: insets.bottom }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        // Get icon component from options
        const IconComponent = options.tabBarIcon;

        // Calculate input range for animations
        const inputRange = state.routes.map((_, i) => i);

        // Scale animation
        const scale = position.interpolate({
          inputRange,
          outputRange: inputRange.map(i => (i === index ? 1.2 : 1)),
        });

        // Color interpolation
        const color = position.interpolate({
          inputRange,
          outputRange: inputRange.map(i =>
            i === index ? '#4CAF50' : '#999999'
          ),
        });

        // Background opacity for active tab
        const bgOpacity = position.interpolate({
          inputRange,
          outputRange: inputRange.map(i => (i === index ? 1 : 0)),
        });

        return (
          <TouchableOpacity
            key={index}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabButton}
          >
            <Animated.View
              style={[
                styles.activeBackground,
                {
                  opacity: bgOpacity,
                  transform: [{ scale }],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  transform: [{ scale }],
                },
              ]}
            >
              {IconComponent && (
                <IconComponent
                  color={color}
                  size={24}
                  focused={isFocused}
                />
              )}
              <Animated.Text
                style={[
                  styles.label,
                  {
                    color,
                    opacity: isFocused ? 1 : 0.7,
                  },
                ]}
              >
                {label}
              </Animated.Text>
            </Animated.View>
            {options.tabBarBadge && (
              <View style={styles.badge}>
                <Animated.Text style={[styles.badgeText]}>
                  {options.tabBarBadge}
                </Animated.Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    width: width,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeBackground: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 16,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: '25%',
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default CustomTabBar;
