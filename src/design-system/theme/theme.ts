import type { ViewStyle } from 'react-native';

import { darkPalette, lightPalette, type Palette } from './palettes';
import { layout, motion, radii, spacing, typography } from './tokens';

export type ColorSchemeName = 'light' | 'dark';

/** What the user picked; `system` defers to the OS. */
export type ThemeMode = 'system' | 'light' | 'dark';

export const THEME_MODES: readonly ThemeMode[] = ['system', 'light', 'dark'];

export type Elevation = 'none' | 'low' | 'medium' | 'high';

export interface Theme {
  readonly scheme: ColorSchemeName;
  readonly colors: Palette;
  readonly spacing: typeof spacing;
  readonly radii: typeof radii;
  readonly typography: typeof typography;
  readonly motion: typeof motion;
  readonly layout: typeof layout;
  readonly elevation: Record<Elevation, ViewStyle>;
}

/**
 * Shadow tokens.
 *
 * `boxShadow` is the modern cross-platform shadow property: React Native's
 * New Architecture renders it natively on iOS/Android and react-native-web
 * maps it straight onto CSS. One string per elevation covers every target —
 * no `shadow*`/`elevation` pairs, and no deprecation warnings on the desktop
 * build.
 */
const createElevation = (
  scheme: ColorSchemeName,
): Record<Elevation, ViewStyle> => {
  // Shadows have to work harder against a dark canvas to stay visible.
  const alpha = (base: number) => (scheme === 'dark' ? base * 2.4 : base);

  return {
    none: {},
    low: {
      boxShadow: `0px 1px 3px rgba(0, 0, 0, ${alpha(0.05).toFixed(3)})`,
    },
    medium: {
      boxShadow: `0px 6px 16px rgba(0, 0, 0, ${alpha(0.09).toFixed(3)})`,
    },
    high: {
      boxShadow: `0px 18px 38px rgba(0, 0, 0, ${alpha(0.16).toFixed(3)})`,
    },
  };
};

const buildTheme = (scheme: ColorSchemeName): Theme => ({
  scheme,
  colors: scheme === 'dark' ? darkPalette : lightPalette,
  spacing,
  radii,
  typography,
  motion,
  layout,
  elevation: createElevation(scheme),
});

export const lightTheme = buildTheme('light');
export const darkTheme = buildTheme('dark');

export const getTheme = (scheme: ColorSchemeName): Theme =>
  scheme === 'dark' ? darkTheme : lightTheme;

/** Resolves the user's preference against the OS setting. */
export const resolveColorScheme = (
  mode: ThemeMode,
  systemScheme: ColorSchemeName,
): ColorSchemeName => (mode === 'system' ? systemScheme : mode);
