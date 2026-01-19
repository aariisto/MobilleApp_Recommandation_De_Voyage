import React from "react";
import { Pressable, Text } from "react-native";
import { useTheme } from "../theme/ThemeContext";

export default function ThemeToggleButton() {
  const { mode, toggleTheme, colors } = useTheme();
  const icon = mode === "light" ? "🌙" : "☀️";

  return (
    <Pressable
      onPress={toggleTheme}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
      }}
      accessibilityRole="button"
      accessibilityLabel="Toggle theme"
    >
      <Text style={{ fontSize: 16 }}>{icon}</Text>
    </Pressable>
  );
}
