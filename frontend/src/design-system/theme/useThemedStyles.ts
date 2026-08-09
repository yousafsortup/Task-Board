import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { useTheme } from './ThemeContext';
import type { Theme } from './theme';

type NamedStyles<T> = { [P in keyof T]: object };

/**
 * `StyleSheet.create` that is aware of the active theme, memoised per theme
 * object. Keeps colour lookups out of render bodies while still allowing the
 * whole tree to re-skin instantly when the scheme flips.
 *
 *   const styles = useThemedStyles(createStyles);
 *   const createStyles = (t: Theme) => StyleSheet.create({ … });
 */
export const useThemedStyles = <T extends NamedStyles<T>>(
  factory: (theme: Theme) => T,
): T => {
  const theme = useTheme();
  return useMemo(() => StyleSheet.create(factory(theme)), [factory, theme]);
};

export type { Theme };
