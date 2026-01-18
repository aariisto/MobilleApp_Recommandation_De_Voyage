import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { darkColors, lightColors } from "./colors";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme(); // 'dark' | 'light' | null
  const [mode, setMode] = useState("system"); // 'system' | 'light' | 'dark'

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("theme_mode");
      if (saved) setMode(saved);
    })();
  }, []);

  const isDark = mode === "dark" || (mode === "system" && systemScheme === "dark");
  const colors = isDark ? darkColors : lightColors;

  const value = useMemo(
    () => ({
      colors,
      mode,
      setMode: async (next) => {
        setMode(next);
        await AsyncStorage.setItem("theme_mode", next);
      },
      isDark,
    }),
    [colors, mode, isDark]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useAppTheme must be used within ThemeProvider");
  return ctx;
}

