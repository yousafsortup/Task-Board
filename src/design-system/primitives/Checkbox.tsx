import React, { useCallback } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon } from './Icon';
import { Touchable, type TouchableState } from './Touchable';
import { useTheme } from '../theme/ThemeContext';
import { useResponsive } from '../../responsive/useResponsive';

export interface CheckboxProps {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly accessibilityLabel: string;
  readonly size?: number;
  readonly disabled?: boolean;
  readonly testID?: string;
  readonly style?: StyleProp<ViewStyle>;
}

/**
 * The completion affordance.
 *
 * The visible box keeps a constant size while the *pressable* area grows on
 * touch devices — so the control looks identical everywhere but never becomes
 * a 22pt tap target on a phone.
 */
export const Checkbox = ({
  checked,
  onChange,
  accessibilityLabel,
  size = 22,
  disabled = false,
  testID,
  style,
}: CheckboxProps) => {
  const theme = useTheme();
  const { pointerFine } = useResponsive();
  const target = pointerFine ? size + 10 : theme.layout.minTouchTarget;

  const handlePress = useCallback(() => {
    onChange(!checked);
  }, [checked, onChange]);

  const containerStyle = useCallback(
    (): StyleProp<ViewStyle> => [
      {
        width: target,
        height: target,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.5 : 1,
      },
      style,
    ],
    [target, disabled, style],
  );

  const boxStyle = useCallback(
    ({ hovered, pressed }: TouchableState): ViewStyle => ({
      width: size,
      height: size,
      borderRadius: theme.radii.xs + 3,
      borderWidth: checked ? 0 : 1.6,
      borderColor: hovered ? theme.colors.accent : theme.colors.borderStrong,
      backgroundColor: checked
        ? theme.colors.success
        : hovered
          ? theme.colors.surfaceHover
          : 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
      transform: [{ scale: pressed ? 0.9 : 1 }],
    }),
    [size, theme, checked],
  );

  return (
    <Touchable
      testID={testID}
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={handlePress}
      style={containerStyle}>
      {state => (
        <View style={boxStyle(state)}>
          {checked ? (
            <Icon
              name="check"
              size={size * 0.62}
              color="textInverse"
              strokeWidth={2.2}
            />
          ) : null}
        </View>
      )}
    </Touchable>
  );
};
