import React, { useEffect, useRef } from 'react';
import { Animated, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/ThemeContext';

export interface ProgressBarProps {
  /** 0–1. Values outside the range are clamped. */
  readonly value: number;
  readonly height?: number;
  readonly accessibilityLabel?: string;
  readonly style?: StyleProp<ViewStyle>;
}

export const ProgressBar = ({
  value,
  height = 6,
  accessibilityLabel,
  style,
}: ProgressBarProps) => {
  const theme = useTheme();
  const clamped = Math.min(1, Math.max(0, value));
  const progress = useRef(new Animated.Value(clamped)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: clamped,
      duration: theme.motion.normal,
      // Width cannot be driven natively; the browser/compositor handles it.
      useNativeDriver: false,
    }).start();
  }, [progress, clamped, theme.motion.normal]);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ now: Math.round(clamped * 100), min: 0, max: 100 }}
      style={[
        {
          height,
          borderRadius: height / 2,
          backgroundColor: theme.colors.backgroundSunken,
          overflow: 'hidden',
        },
        style,
      ]}>
      <Animated.View
        style={{
          height: '100%',
          borderRadius: height / 2,
          backgroundColor: theme.colors.success,
          width: progress.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '100%'],
          }),
        }}
      />
    </View>
  );
};
