import React, { createContext, useContext, useState, useEffect } from 'react';
import { StorageService, STORAGE_KEYS } from '../services/storage';
import toast from 'react-hot-toast';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return StorageService.get(STORAGE_KEYS.SETTINGS)?.theme || 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    console.log('[ThemeContext] Applying theme class:', theme);
    if (theme === 'dark') {
      root.classList.add('dark');
      console.log('[ThemeContext] Added .dark class to html');
    } else {
      root.classList.remove('dark');
      console.log('[ThemeContext] Removed .dark class from html');
    }
    
    // Debug: set a global variable to check state in console
    window.__STUDYOS_THEME__ = theme;

    const settings = StorageService.get(STORAGE_KEYS.SETTINGS) || {};
    StorageService.set(STORAGE_KEYS.SETTINGS, { ...settings, theme });
  }, [theme]);

  const toggleTheme = () => {
    console.log('[ThemeContext] Button clicked. Current theme:', theme);
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      console.log('[ThemeContext] Setting theme to:', next);
      toast.success(`${next.charAt(0).toUpperCase() + next.slice(1)} mode enabled`, {
        icon: next === 'dark' ? '🌙' : '☀️',
        id: 'theme-toggle'
      });
      return next;
    });
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
