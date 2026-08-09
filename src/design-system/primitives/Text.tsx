import React, { useMemo } from 'react';
import {
  Text as RNText,
  type StyleProp,
  type TextProps as RNTextProps,
  type TextStyle,
} from 'react-native';

import { useTheme } from '../theme/ThemeContext';
import type { Palette } from '../theme/palettes';
import type { TypographyToken } from '../theme/tokens';

export interface TextProps extends Omit<RNTextProps, 'style'> {
  readonly variant?: TypographyToken;
  /** Semantic palette key — components never pass raw hex values. */
  readonly color?: keyof Palette;
  readonly align?: TextStyle['textAlign'];
  readonly strikethrough?: boolean;
  readonly style?: StyleProp<TextStyle>;
}

/**
 * The only text component in the app. Centralising the typographic scale here
 * is what keeps iOS and desktop visually identical without duplicated styles.
 */
export const Text = ({
  variant = 'body',
  color = 'textPrimary',
  align,
  strikethrough = false,
  style,
  ...rest
}: TextProps) => {
  const theme = useTheme();

  const composed = useMemo<StyleProp<TextStyle>>(
    () => [
      theme.typography[variant] as TextStyle,
      {
        color: theme.colors[color],
        textAlign: align,
        textDecorationLine: strikethrough ? 'line-through' : 'none',
      },
      style,
    ],
    [theme, variant, color, align, strikethrough, style],
  );

  return <RNText {...rest} style={composed} />;
};
