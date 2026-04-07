import React, { createContext, useContext, useState, useEffect } from 'react';
import { StorageService, STORAGE_KEYS } from '../services/storage';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return StorageService.get(STORAGE_KEYS.SETTINGS)?.theme || 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    const settings = StorageService.get(STORAGE_KEYS.SETTINGS) || {};
    StorageService.set(STORAGE_KEYS.SETTINGS, { ...settings, theme });
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
