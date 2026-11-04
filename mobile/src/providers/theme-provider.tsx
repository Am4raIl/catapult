import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Appearance } from 'react-native';

import { AppPalette, palettes, ThemePreference } from '@/theme/tokens';

const STORAGE_KEY = '@catapult/theme';
const subscribeAppearance = (onChange: () => void) => {
  const subscription = Appearance.addChangeListener(onChange);
  return () => subscription.remove();
};

type ThemeContextValue = {
  colors: AppPalette;
  isDark: boolean;
  preference: ThemePreference;
  setPreference: (value: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function AppThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useSyncExternalStore(subscribeAppearance, Appearance.getColorScheme, () => null);
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (value === 'light' || value === 'dark' || value === 'system') setPreferenceState(value);
    }).catch(() => undefined);
  }, []);

  const setPreference = (value: ThemePreference) => {
    setPreferenceState(value);
    AsyncStorage.setItem(STORAGE_KEY, value).catch(() => undefined);
  };

  const isDark = preference === 'system' ? systemScheme === 'dark' : preference === 'dark';
  const colors = isDark ? palettes.dark : palettes.light;
  const navigationTheme = useMemo(() => ({
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.surface,
      text: colors.textPrimary,
      border: colors.border,
      primary: colors.accent,
      notification: colors.danger,
    },
  }), [colors, isDark]);

  return (
    <ThemeContext.Provider value={{ colors, isDark, preference, setPreference }}>
      <NavigationThemeProvider value={navigationTheme}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        {children}
      </NavigationThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useAppTheme must be used inside AppThemeProvider');
  return context;
}
