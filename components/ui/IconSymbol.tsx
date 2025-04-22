// This file is a fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { View } from 'react-native';
import { SymbolWeight } from 'expo-symbols';
import React from 'react';
import { OpaqueColorValue, StyleProp, ViewStyle, TextStyle } from 'react-native';

// Add your SFSymbol to MaterialIcons mappings here.
const MAPPING = {
  // See MaterialIcons here: https://icons.expo.fyi
  // See SF Symbols in the SF Symbols app on Mac.
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
} as Partial<
  Record<
    import('expo-symbols').SymbolViewProps['name'],
    React.ComponentProps<typeof MaterialIcons>['name']
  >
>;

export type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses native SFSymbols on iOS, and MaterialIcons on Android and web. This ensures a consistent look across platforms, and optimal resource usage.
 *
 * Icon `name`s are based on SFSymbols and require manual mapping to MaterialIcons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  // Accept any style for maximum compatibility with tab bars and platform-specific usages
  style?: StyleProp<TextStyle> | StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  // Accept both TextStyle and ViewStyle for cross-platform tab/icon use
  // If style is a ViewStyle, wrap in a View; otherwise, pass as TextStyle
  const iconName = MAPPING[name] || 'help';
  // Only pass style if it's a TextStyle, otherwise wrap in a View
  const isViewStyle = style && (Array.isArray(style)
    ? style.some(s => s && (s as any).flex !== undefined)
    : (style as any)?.flex !== undefined);
  if (isViewStyle) {
    return (
      <View style={style as ViewStyle}>
        <MaterialIcons name={iconName} size={size} color={color as string} />
      </View>
    );
  }
  // Only pass style if not undefined
  return (
    <MaterialIcons name={iconName} size={size} color={color as string} {...(style ? { style: style as TextStyle } : {})} />
  );
}
