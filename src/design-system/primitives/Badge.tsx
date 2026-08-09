import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from './Text';
import { useTheme } from '../theme/ThemeContext';
import type { Palette } from '../theme/palettes';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'danger';

export interface BadgeProps {
  readonly label: string | number;
  readonly tone?: BadgeTone;
  readonly style?: StyleProp<ViewStyle>;
}

const TONE: Record<BadgeTone, { bg: keyof Palette; fg: keyof Palette }> = {
  neutral: { bg: 'backgroundSunken', fg: 'textSecondary' },
  accent: { bg: 'accentSoft', fg: 'accent' },
  success: { bg: 'successSoft', fg: 'success' },
  danger: { bg: 'dangerSoft', fg: 'danger' },
};

export const Badge = ({ label, tone = 'neutral', style }: BadgeProps) => {
  const theme = useTheme();
  const palette = TONE[tone];

  return (
    <View
      style={[
        {
          minWidth: 22,
          paddingHorizontal: theme.spacing.xs + 2,
          paddingVertical: 2,
          borderRadius: theme.radii.pill,
          backgroundColor: theme.colors[palette.bg],
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}>
      <Text variant="caption" color={palette.fg}>
        {label}
      </Text>
    </View>
  );
};
