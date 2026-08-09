import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Touchable, useTheme } from '../../../design-system';

export interface FloatingActionButtonProps {
  readonly onPress: () => void;
  readonly accessibilityLabel?: string;
}

/**
 * Primary action for the compact layout, where there is no room for a
 * permanent composer. It sits above the home indicator via safe-area insets
 * rather than a hard-coded offset.
 */
export const FloatingActionButton = ({
  onPress,
  accessibilityLabel = 'Add a task',
}: FloatingActionButtonProps) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Touchable
      testID="fab-add-task"
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed, hovered }) => [
        {
          position: 'absolute',
          right: theme.spacing.xl,
          bottom: insets.bottom + theme.spacing.xl,
          width: 56,
          height: 56,
          borderRadius: 28,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: pressed
            ? theme.colors.accentPressed
            : hovered
              ? theme.colors.accentHover
              : theme.colors.accent,
          transform: [{ scale: pressed ? 0.94 : 1 }],
        },
        theme.elevation.high,
      ]}>
      <Icon name="plus" size={26} color="onAccent" strokeWidth={2.4} />
    </Touchable>
  );
};
