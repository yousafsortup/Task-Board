import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { useColorScheme } from 'react-native';

import {
  getTheme,
  resolveColorScheme,
  type ColorSchemeName,
  type Theme,
  type ThemeMode,
} from './theme';

interface ThemeContextValue {
  readonly theme: Theme;
  readonly mode: ThemeMode;
  readonly scheme: ColorSchemeName;
  setMode(mode: ThemeMode): void;
  /** Cycles system → light → dark → system, for the header toggle. */
  cycleMode(): void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps extends PropsWithChildren {
  readonly initialMode?: ThemeMode;
  /** Persists the choice; injected so the provider stays storage-agnostic. */
  readonly onModeChange?: (mode: ThemeMode) => void;
}

const NEXT_MODE: Record<ThemeMode, ThemeMode> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
};

export const ThemeProvider = ({
  children,
  initialMode = 'system',
  onModeChange,
}: ThemeProviderProps) => {
  const systemScheme: ColorSchemeName =
    useColorScheme() === 'dark' ? 'dark' : 'light';
  const [mode, setModeState] = useState<ThemeMode>(initialMode);

  const setMode = useCallback(
    (next: ThemeMode) => {
      setModeState(next);
      onModeChange?.(next);
    },
    [onModeChange],
  );

  const cycleMode = useCallback(() => {
    setModeState(current => {
      const next = NEXT_MODE[current];
      onModeChange?.(next);
      return next;
    });
  }, [onModeChange]);

  const value = useMemo<ThemeContextValue>(() => {
    const scheme = resolveColorScheme(mode, systemScheme);
    return { theme: getTheme(scheme), mode, scheme, setMode, cycleMode };
  }, [mode, systemScheme, setMode, cycleMode]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useThemeContext = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (context === null) {
    throw new Error('useThemeContext must be used inside a <ThemeProvider>.');
  }
  return context;
};

/** The hook components actually reach for. */
export const useTheme = (): Theme => useThemeContext().theme;
