import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Touchable, type TouchableState } from './Touchable';
import { Text } from './Text';
import { Icon, type IconName } from './Icon';
import { useTheme } from '../theme/ThemeContext';
import type { Palette } from '../theme/palettes';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  readonly label: string;
  readonly onPress: () => void;
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly icon?: IconName;
  readonly disabled?: boolean;
  readonly busy?: boolean;
  readonly fullWidth?: boolean;
  readonly testID?: string;
  readonly accessibilityLabel?: string;
  readonly style?: StyleProp<ViewStyle>;
}

const SIZE_SPEC: Record<
  ButtonSize,
  { height: number; paddingH: number; gap: number; icon: number; variant: 'label' | 'bodyStrong' }
> = {
  sm: { height: 32, paddingH: 12, gap: 6, icon: 14, variant: 'label' },
  md: { height: 40, paddingH: 16, gap: 8, icon: 16, variant: 'bodyStrong' },
  lg: { height: 48, paddingH: 20, gap: 10, icon: 18, variant: 'bodyStrong' },
};

interface VariantColors {
  background: keyof Palette | 'transparent';
  backgroundHover: keyof Palette | 'transparent';
  backgroundPressed: keyof Palette | 'transparent';
  foreground: keyof Palette;
  border?: keyof Palette;
}

const VARIANT_COLORS: Record<ButtonVariant, VariantColors> = {
  primary: {
    background: 'accent',
    backgroundHover: 'accentHover',
    backgroundPressed: 'accentPressed',
    foreground: 'onAccent',
  },
  secondary: {
    background: 'surface',
    backgroundHover: 'surfaceHover',
    backgroundPressed: 'surfacePressed',
    foreground: 'textPrimary',
    border: 'border',
  },
  ghost: {
    background: 'transparent',
    backgroundHover: 'surfaceHover',
    backgroundPressed: 'surfacePressed',
    foreground: 'textSecondary',
  },
  danger: {
    background: 'danger',
    backgroundHover: 'dangerHover',
    backgroundPressed: 'dangerHover',
    foreground: 'textInverse',
  },
};

export const Button = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  disabled = false,
  busy = false,
  fullWidth = false,
  testID,
  accessibilityLabel,
  style,
}: ButtonProps) => {
  const theme = useTheme();
  const spec = SIZE_SPEC[size];
  const palette = VARIANT_COLORS[variant];
  const isInert = disabled || busy;

  const resolve = useCallback(
    (key: keyof Palette | 'transparent') =>
      key === 'transparent' ? 'transparent' : theme.colors[key],
    [theme],
  );

  const buildStyle = useCallback(
    ({ pressed, hovered }: TouchableState): StyleProp<ViewStyle> => [
      {
        height: spec.height,
        paddingHorizontal: spec.paddingH,
        borderRadius: theme.radii.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spec.gap,
        alignSelf: fullWidth ? 'stretch' : 'flex-start',
        borderWidth: palette.border ? 1 : 0,
        borderColor: palette.border ? theme.colors[palette.border] : undefined,
        backgroundColor: resolve(
          pressed
            ? palette.backgroundPressed
            : hovered
              ? palette.backgroundHover
              : palette.background,
        ),
        opacity: isInert ? 0.5 : 1,
        transform: [{ scale: pressed && !isInert ? 0.985 : 1 }],
      },
      variant === 'primary' && !isInert ? theme.elevation.low : null,
      style,
    ],
    [spec, theme, fullWidth, palette, resolve, isInert, variant, style],
  );

  return (
    <Touchable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isInert, busy }}
      disabled={isInert}
      onPress={onPress}
      style={buildStyle}>
      {busy ? (
        <ActivityIndicator size="small" color={theme.colors[palette.foreground]} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={spec.icon} color={palette.foreground} /> : null}
          <Text variant={spec.variant} color={palette.foreground}>
            {label}
          </Text>
        </>
      )}
    </Touchable>
  );
};
