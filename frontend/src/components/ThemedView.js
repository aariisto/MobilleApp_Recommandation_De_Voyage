import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function ThemedView({ style, children, ...props }) {
  const { theme } = useTheme();

  return (
    <View style={[{ backgroundColor: theme.background }, style]} {...props}>
      {children}
    </View>
  );
}
