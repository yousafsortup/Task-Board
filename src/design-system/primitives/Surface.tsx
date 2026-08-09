import React, { useMemo } from 'react';
import { View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/ThemeContext';
import type { Elevation } from '../theme/theme';
import type { RadiusToken, SpacingToken } from '../theme/tokens';

export interface SurfaceProps extends Omit<ViewProps, 'style'> {
  readonly elevation?: Elevation;
  readonly radius?: RadiusToken;
  readonly padding?: SpacingToken;
  readonly bordered?: boolean;
  readonly tone?: 'surface' | 'elevated' | 'sunken';
  readonly style?: StyleProp<ViewStyle>;
}

const TONE_COLOR = {
  surface: 'surface',
  elevated: 'surfaceElevated',
  sunken: 'backgroundSunken',
} as const;

/** A themed panel: background, radius, border and shadow in one place. */
export const Surface = ({
  elevation = 'none',
  radius = 'lg',
  padding,
  bordered = true,
  tone = 'surface',
  style,
  ...rest
}: SurfaceProps) => {
  const theme = useTheme();

  const composed = useMemo<StyleProp<ViewStyle>>(
    () => [
      {
        backgroundColor: theme.colors[TONE_COLOR[tone]],
        borderRadius: theme.radii[radius],
        borderWidth: bordered ? 1 : 0,
        borderColor: theme.colors.border,
        padding: padding ? theme.spacing[padding] : undefined,
      },
      theme.elevation[elevation],
      style,
    ],
    [theme, tone, radius, bordered, padding, elevation, style],
  );

  return <View {...rest} style={composed} />;
};
