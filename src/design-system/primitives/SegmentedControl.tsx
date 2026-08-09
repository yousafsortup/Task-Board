import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from './Text';
import { Touchable } from './Touchable';
import { USE_NATIVE_DRIVER } from './animation';
import { useTheme } from '../theme/ThemeContext';

export interface SegmentOption<TValue extends string> {
  readonly value: TValue;
  readonly label: string;
  readonly badge?: number;
}

export interface SegmentedControlProps<TValue extends string> {
  readonly options: readonly SegmentOption<TValue>[];
  readonly value: TValue;
  readonly onChange: (value: TValue) => void;
  readonly accessibilityLabel?: string;
  readonly testID?: string;
  readonly style?: StyleProp<ViewStyle>;
}

const PADDING = 3;

/**
 * iOS-style segmented control with a sliding indicator. Used as the filter
 * switch in the compact layout, where a full sidebar would not fit.
 */
export const SegmentedControl = <TValue extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  testID,
  style,
}: SegmentedControlProps<TValue>) => {
  const theme = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const indicator = useRef(new Animated.Value(0)).current;

  const selectedIndex = Math.max(
    0,
    options.findIndex(option => option.value === value),
  );
  const segmentWidth =
    trackWidth > 0 ? (trackWidth - PADDING * 2) / options.length : 0;

  useEffect(() => {
    Animated.spring(indicator, {
      toValue: selectedIndex * segmentWidth,
      useNativeDriver: USE_NATIVE_DRIVER,
      speed: 22,
      bounciness: 4,
    }).start();
  }, [indicator, selectedIndex, segmentWidth]);

  const handleLayout = useCallback(
    (event: { nativeEvent: { layout: { width: number } } }) => {
      setTrackWidth(event.nativeEvent.layout.width);
    },
    [],
  );

  return (
    <View
      testID={testID}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      onLayout={handleLayout}
      style={[
        {
          flexDirection: 'row',
          padding: PADDING,
          borderRadius: theme.radii.md,
          backgroundColor: theme.colors.backgroundSunken,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        style,
      ]}>
      {segmentWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: PADDING,
            left: PADDING,
            bottom: PADDING,
            width: segmentWidth,
            borderRadius: theme.radii.sm + 2,
            backgroundColor: theme.colors.surface,
            transform: [{ translateX: indicator }],
            ...theme.elevation.low,
          }}
        />
      ) : null}

      {options.map(option => {
        const selected = option.value === value;
        return (
          <Touchable
            key={option.value}
            testID={`${testID ?? 'segment'}-${option.value}`}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={
              option.badge === undefined
                ? option.label
                : `${option.label}, ${option.badge}`
            }
            onPress={() => onChange(option.value)}
            style={({ hovered }) => ({
              flex: 1,
              minHeight: 34,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: theme.spacing.xs + 2,
              borderRadius: theme.radii.sm + 2,
              backgroundColor:
                hovered && !selected ? theme.colors.surfaceHover : 'transparent',
            })}>
            <Text
              variant="label"
              color={selected ? 'textPrimary' : 'textSecondary'}>
              {option.label}
            </Text>
            {option.badge !== undefined ? (
              <Text
                variant="caption"
                color={selected ? 'accent' : 'textTertiary'}>
                {option.badge}
              </Text>
            ) : null}
          </Touchable>
        );
      })}
    </View>
  );
};
