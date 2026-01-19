import React, { createContext, useContext, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import { darkColors, lightColors } from "./colors";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme(); // 'dark' | 'light' | null
  const [mode, setMode] = useState("system"); // 'system' | 'light' | 'dark'

  const isDark =
    mode === "dark" || (mode === "system" && systemScheme === "dark");

  const colors = isDark ? darkColors : lightColors;

  const value = useMemo(
    () => ({
      colors,
      mode,
      setMode, // pas async
      isDark,
    }),
    [colors, mode, isDark]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useAppTheme must be used within ThemeProvider");
  return ctx;
}
