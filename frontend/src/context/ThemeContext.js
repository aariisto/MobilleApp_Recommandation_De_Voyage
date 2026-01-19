import React, { createContext, useContext, useMemo, useState } from 'react';

const ThemeContext = createContext(null);

export const themes = {
  light: {
    background: '#F9FAFB',
    card: '#FFFFFF',
    text: '#111111',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    primary: '#004aad',
    primaryLight: '#EBF5FF',
    shadow: 'rgba(0, 0, 0, 0.05)',
  },
  dark: {
    background: '#0B1120',
    card: '#1A2332',
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    border: '#2D3748',
    primary: '#3B82F6',
    primaryLight: '#1E3A5F',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
};

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  const value = useMemo(() => {
    const theme = isDark ? themes.dark : themes.light;
    const toggleTheme = () => setIsDark((prev) => !prev);
    
    return {
      theme,
      colors: theme,
      isDark,
      toggleTheme,
    };
  }, [isDark]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
