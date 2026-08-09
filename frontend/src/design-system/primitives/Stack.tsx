import React, { useMemo } from 'react';
import { View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/ThemeContext';
import type { SpacingToken } from '../theme/tokens';

export interface StackProps extends Omit<ViewProps, 'style'> {
  readonly direction?: 'row' | 'column';
  readonly gap?: SpacingToken;
  readonly align?: ViewStyle['alignItems'];
  readonly justify?: ViewStyle['justifyContent'];
  readonly wrap?: boolean;
  readonly flex?: number;
  readonly padding?: SpacingToken;
  readonly paddingX?: SpacingToken;
  readonly paddingY?: SpacingToken;
  readonly style?: StyleProp<ViewStyle>;
}

/**
 * Layout primitive built on the `gap` property, which React Native supports on
 * every target — no margin hacks, no `:last-child` special-casing.
 */
export const Stack = ({
  direction = 'column',
  gap,
  align,
  justify,
  wrap = false,
  flex,
  padding,
  paddingX,
  paddingY,
  style,
  ...rest
}: StackProps) => {
  const theme = useTheme();

  const composed = useMemo<StyleProp<ViewStyle>>(
    () => [
      {
        flexDirection: direction,
        gap: gap ? theme.spacing[gap] : undefined,
        alignItems: align,
        justifyContent: justify,
        flexWrap: wrap ? 'wrap' : 'nowrap',
        flex,
        padding: padding ? theme.spacing[padding] : undefined,
        paddingHorizontal: paddingX ? theme.spacing[paddingX] : undefined,
        paddingVertical: paddingY ? theme.spacing[paddingY] : undefined,
      },
      style,
    ],
    [theme, direction, gap, align, justify, wrap, flex, padding, paddingX, paddingY, style],
  );

  return <View {...rest} style={composed} />;
};

export const HStack = (props: Omit<StackProps, 'direction'>) => (
  <Stack {...props} direction="row" />
);

export const VStack = (props: Omit<StackProps, 'direction'>) => (
  <Stack {...props} direction="column" />
);

/** Pushes siblings apart inside a flex container. */
export const Spacer = ({ size }: { readonly size?: SpacingToken }) => {
  const theme = useTheme();
  return <View style={size ? { width: theme.spacing[size], height: theme.spacing[size] } : { flex: 1 }} />;
};
