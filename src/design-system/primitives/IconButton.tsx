import React, { useCallback } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { Icon, type IconName } from './Icon';
import { Touchable, type TouchableState } from './Touchable';
import { useTheme } from '../theme/ThemeContext';
import type { Palette } from '../theme/palettes';
import { useResponsive } from '../../responsive/useResponsive';

export type IconButtonTone = 'neutral' | 'accent' | 'danger';

export interface IconButtonProps {
  readonly name: IconName;
  readonly onPress: () => void;
  /** Required: icon-only controls are invisible to screen readers otherwise. */
  readonly accessibilityLabel: string;
  readonly tone?: IconButtonTone;
  readonly size?: number;
  readonly disabled?: boolean;
  readonly testID?: string;
  readonly style?: StyleProp<ViewStyle>;
}

const TONE: Record<IconButtonTone, { idle: keyof Palette; active: keyof Palette; wash: keyof Palette }> = {
  neutral: { idle: 'textSecondary', active: 'textPrimary', wash: 'surfaceHover' },
  accent: { idle: 'accent', active: 'accent', wash: 'accentSoft' },
  danger: { idle: 'textTertiary', active: 'danger', wash: 'dangerSoft' },
};

/**
 * Square control whose hit area follows the *input device*: 44pt on touch,
 * a tighter 32pt where there is a precise pointer. Same component, both feel
 * native.
 */
export const IconButton = ({
  name,
  onPress,
  accessibilityLabel,
  tone = 'neutral',
  size = 18,
  disabled = false,
  testID,
  style,
}: IconButtonProps) => {
  const theme = useTheme();
  const { pointerFine } = useResponsive();
  const target = pointerFine ? theme.layout.minPointerTarget : theme.layout.minTouchTarget;
  const palette = TONE[tone];

  const buildStyle = useCallback(
    ({ pressed, hovered }: TouchableState): StyleProp<ViewStyle> => [
      {
        width: target,
        height: target,
        borderRadius: theme.radii.sm,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor:
          pressed || hovered ? theme.colors[palette.wash] : 'transparent',
        opacity: disabled ? 0.4 : 1,
      },
      style,
    ],
    [target, theme, palette, disabled, style],
  );

  return (
    <Touchable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={buildStyle}>
      {({ hovered, pressed }) => (
        <Icon
          name={name}
          size={size}
          color={hovered || pressed ? palette.active : palette.idle}
        />
      )}
    </Touchable>
  );
};
