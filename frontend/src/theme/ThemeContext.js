import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME_KEY = "ui_theme"; // "light" | "dark"

const ThemeContext = createContext(null);

const themes = {
  light: {
    mode: "light",
    colors: {
      background: "#FFFFFF",
      card: "#F3F4F6",
      text: "#111827",
      mutedText: "#6B7280",
      border: "#E5E7EB",
      primary: "#2563EB",
    },
  },
  dark: {
    mode: "dark",
    colors: {
      background: "#0B1220",
      card: "#111A2E",
      text: "#E5E7EB",
      mutedText: "#9CA3AF",
      border: "#1F2A44",
      primary: "#60A5FA",
    },
  },
};

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_KEY);
        if (saved === "light" || saved === "dark") setMode(saved);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const setTheme = async (nextMode) => {
    setMode(nextMode);
    try {
      await AsyncStorage.setItem(THEME_KEY, nextMode);
    } catch {}
  };

  const toggleTheme = async () => {
    const next = mode === "light" ? "dark" : "light";
    await setTheme(next);
  };

  const value = useMemo(() => {
    const theme = themes[mode];
    return { mode, theme, colors: theme.colors, toggleTheme, setTheme, ready };
  }, [mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
