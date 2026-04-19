import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();
const DEFAULT_THEME = 'light';
const DEFAULT_COLOR_SCHEME = 'blue';
const THEME_MODES = ['light', 'dark', 'auto'];

const colorSchemes = {
  blue: {
    name: 'Blue',
    primary: 'bg-blue-600',
    primaryHex: '#2563eb',
    primaryHover: 'hover:bg-blue-700',
    primaryLight: 'bg-blue-50',
    primaryText: 'text-blue-600',
    accent: 'bg-blue-500',
    accentHover: 'hover:bg-blue-600',
    secondary: 'bg-green-600',
    secondaryHover: 'hover:bg-green-700',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    success: 'bg-green-500',
  },
  purple: {
    name: 'Purple',
    primary: 'bg-purple-600',
    primaryHex: '#9333ea',
    primaryHover: 'hover:bg-purple-700',
    primaryLight: 'bg-purple-50',
    primaryText: 'text-purple-600',
    accent: 'bg-purple-500',
    accentHover: 'hover:bg-purple-600',
    secondary: 'bg-indigo-600',
    secondaryHover: 'hover:bg-indigo-700',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    success: 'bg-green-500',
  },
  green: {
    name: 'Green',
    primary: 'bg-green-600',
    primaryHex: '#16a34a',
    primaryHover: 'hover:bg-green-700',
    primaryLight: 'bg-green-50',
    primaryText: 'text-green-600',
    accent: 'bg-green-500',
    accentHover: 'hover:bg-green-600',
    secondary: 'bg-blue-600',
    secondaryHover: 'hover:bg-blue-700',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    success: 'bg-emerald-500',
  },
  orange: {
    name: 'Orange',
    primary: 'bg-orange-600',
    primaryHex: '#ea580c',
    primaryHover: 'hover:bg-orange-700',
    primaryLight: 'bg-orange-50',
    primaryText: 'text-orange-600',
    accent: 'bg-orange-500',
    accentHover: 'hover:bg-orange-600',
    secondary: 'bg-blue-600',
    secondaryHover: 'hover:bg-blue-700',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    success: 'bg-green-500',
  },
  pink: {
    name: 'Pink',
    primary: 'bg-pink-600',
    primaryHex: '#db2777',
    primaryHover: 'hover:bg-pink-700',
    primaryLight: 'bg-pink-50',
    primaryText: 'text-pink-600',
    accent: 'bg-pink-500',
    accentHover: 'hover:bg-pink-600',
    secondary: 'bg-purple-600',
    secondaryHover: 'hover:bg-purple-700',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    success: 'bg-green-500',
  },
  teal: {
    name: 'Teal',
    primary: 'bg-teal-600',
    primaryHex: '#0d9488',
    primaryHover: 'hover:bg-teal-700',
    primaryLight: 'bg-teal-50',
    primaryText: 'text-teal-600',
    accent: 'bg-teal-500',
    accentHover: 'hover:bg-teal-600',
    secondary: 'bg-cyan-600',
    secondaryHover: 'hover:bg-cyan-700',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    success: 'bg-emerald-500',
  },
  indigo: {
    name: 'Indigo',
    primary: 'bg-indigo-600',
    primaryHex: '#4f46e5',
    primaryHover: 'hover:bg-indigo-700',
    primaryLight: 'bg-indigo-50',
    primaryText: 'text-indigo-600',
    accent: 'bg-indigo-500',
    accentHover: 'hover:bg-indigo-600',
    secondary: 'bg-blue-600',
    secondaryHover: 'hover:bg-blue-700',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    success: 'bg-green-500',
  },
  rose: {
    name: 'Rose',
    primary: 'bg-rose-600',
    primaryHex: '#e11d48',
    primaryHover: 'hover:bg-rose-700',
    primaryLight: 'bg-rose-50',
    primaryText: 'text-rose-600',
    accent: 'bg-rose-500',
    accentHover: 'hover:bg-rose-600',
    secondary: 'bg-pink-600',
    secondaryHover: 'hover:bg-pink-700',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    success: 'bg-green-500',
  },
  cyan: {
    name: 'Cyan',
    primary: 'bg-cyan-600',
    primaryHex: '#0891b2',
    primaryHover: 'hover:bg-cyan-700',
    primaryLight: 'bg-cyan-50',
    primaryText: 'text-cyan-600',
    accent: 'bg-cyan-500',
    accentHover: 'hover:bg-cyan-600',
    secondary: 'bg-blue-600',
    secondaryHover: 'hover:bg-blue-700',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    success: 'bg-teal-500',
  },
  emerald: {
    name: 'Emerald',
    primary: 'bg-emerald-600',
    primaryHex: '#059669',
    primaryHover: 'hover:bg-emerald-700',
    primaryLight: 'bg-emerald-50',
    primaryText: 'text-emerald-600',
    accent: 'bg-emerald-500',
    accentHover: 'hover:bg-emerald-600',
    secondary: 'bg-teal-600',
    secondaryHover: 'hover:bg-teal-700',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    success: 'bg-green-500',
  }
};

const isValidThemeMode = (theme) => THEME_MODES.includes(theme);
const isValidColorScheme = (scheme) => Object.prototype.hasOwnProperty.call(colorSchemes, scheme);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Get saved theme from localStorage or default to 'light'
    const savedTheme = localStorage.getItem('theme');
    return isValidThemeMode(savedTheme) ? savedTheme : DEFAULT_THEME;
  });

  const [colorScheme, setColorScheme] = useState(() => {
    // Get saved color scheme from localStorage or default to 'blue'
    const savedScheme = localStorage.getItem('colorScheme');
    return isValidColorScheme(savedScheme) ? savedScheme : DEFAULT_COLOR_SCHEME;
  });

  const normalizedTheme = isValidThemeMode(theme) ? theme : DEFAULT_THEME;
  const normalizedColorScheme = isValidColorScheme(colorScheme) ? colorScheme : DEFAULT_COLOR_SCHEME;

  // Available themes (computed based on colorScheme)
  const getThemes = () => {
    const colorName = colorSchemes[normalizedColorScheme].primary.split('-')[1]; // e.g., 'blue' from 'bg-blue-600'
    return {
      light: {
        name: 'Light',
        background: 'bg-gray-50',
        surface: 'bg-white',
        surfaceSecondary: 'bg-gray-100',
        text: 'text-gray-900',
        textSecondary: 'text-gray-600',
        textMuted: 'text-gray-500',
        border: 'border-gray-300',
        borderSecondary: 'border-gray-400',
        shadow: 'shadow-md',
        hover: 'hover:bg-gray-50',
        focus: `focus:ring-${colorName}-500`,
      },
      dark: {
        name: 'Dark',
        background: 'bg-gray-900',
        surface: 'bg-gray-800',
        surfaceSecondary: 'bg-gray-700',
        text: 'text-white',
        textSecondary: 'text-gray-300',
        textMuted: 'text-gray-400',
        border: 'border-gray-700',
        borderSecondary: 'border-gray-600',
        shadow: 'shadow-lg shadow-gray-900/50',
        hover: 'hover:bg-gray-700',
        focus: `focus:ring-${colorName}-400`,
      },
      auto: {
        name: 'Auto',
        // Will be determined by system preference
      }
    };
  };

  const themes = getThemes();

  // Get current theme (handle auto mode)
  const getCurrentTheme = () => {
    if (normalizedTheme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? themes.dark : themes.light;
    }
    return themes[normalizedTheme];
  };

  useEffect(() => {
    if (theme !== normalizedTheme) {
      setTheme(normalizedTheme);
    }
    if (colorScheme !== normalizedColorScheme) {
      setColorScheme(normalizedColorScheme);
    }
  }, [theme, colorScheme, normalizedTheme, normalizedColorScheme]);

  // Apply theme to document
  useEffect(() => {
    const currentThemeObj = getCurrentTheme();
    const root = document.documentElement;
    const currentColorScheme = colorSchemes[normalizedColorScheme];

    // Apply dark mode class
    if (currentThemeObj.name === 'Dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply CSS custom properties for dynamic color scheme
    if (currentColorScheme.primaryHex) {
      root.style.setProperty('--color-primary', currentColorScheme.primaryHex);
    }

    // Save to localStorage
    localStorage.setItem('theme', normalizedTheme);
  }, [normalizedTheme, normalizedColorScheme]);

  // Apply color scheme
  useEffect(() => {
    localStorage.setItem('colorScheme', normalizedColorScheme);
  }, [normalizedColorScheme]);

  // Listen for system theme changes when in auto mode
  useEffect(() => {
    if (normalizedTheme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        const root = document.documentElement;
        if (mediaQuery.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      };
      
      handleChange(); // Run immediately
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [normalizedTheme]);

  const toggleTheme = () => {
    const currentIndex = THEME_MODES.indexOf(normalizedTheme);
    const nextIndex = (currentIndex + 1) % THEME_MODES.length;
    setTheme(THEME_MODES[nextIndex]);
  };

  const setThemeMode = (newTheme) => {
    if (isValidThemeMode(newTheme)) {
      setTheme(newTheme);
    }
  };

  const setColorSchemeMode = (newScheme) => {
    if (isValidColorScheme(newScheme)) {
      setColorScheme(newScheme);
    }
  };

  const value = {
    theme: normalizedTheme,
    colorScheme: normalizedColorScheme,
    currentTheme: getCurrentTheme(),
    currentColorScheme: colorSchemes[normalizedColorScheme],
    themes,
    colorSchemes,
    toggleTheme,
    setThemeMode,
    setColorSchemeMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};