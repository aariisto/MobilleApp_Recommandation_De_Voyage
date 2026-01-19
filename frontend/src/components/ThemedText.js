import React from 'react';
import { Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function ThemedText({ style, secondary, children, ...props }) {
  const { theme } = useTheme();
  const color = secondary ? theme.textSecondary : theme.text;

  return (
    <Text style={[{ color }, style]} {...props}>
      {children}
    </Text>
  );
}
