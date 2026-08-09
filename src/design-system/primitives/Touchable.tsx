import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

export interface TouchableState {
  readonly pressed: boolean;
  readonly hovered: boolean;
}

export interface TouchableProps
  extends Omit<PressableProps, 'style' | 'children'> {
  readonly style?:
    | StyleProp<ViewStyle>
    | ((state: TouchableState) => StyleProp<ViewStyle>);
  readonly children?: React.ReactNode | ((state: TouchableState) => React.ReactNode);
}

/**
 * `Pressable` with hover folded into the same state object as press.
 *
 * React Native routes `onHoverIn`/`onHoverOut` from real pointer devices
 * (desktop browser, macOS, iPad trackpad) and simply never fires them on
 * touch — so components get desktop affordances for free without a single
 * `Platform.OS` check.
 */
export const Touchable = ({
  style,
  children,
  onHoverIn,
  onHoverOut,
  disabled,
  ...rest
}: TouchableProps) => {
  const [hovered, setHovered] = useState(false);

  const handleHoverIn = useCallback<NonNullable<PressableProps['onHoverIn']>>(
    event => {
      setHovered(true);
      onHoverIn?.(event);
    },
    [onHoverIn],
  );

  const handleHoverOut = useCallback<NonNullable<PressableProps['onHoverOut']>>(
    event => {
      setHovered(false);
      onHoverOut?.(event);
    },
    [onHoverOut],
  );

  const resolvedStyle = useMemo(
    () =>
      typeof style === 'function'
        ? ({ pressed }: { pressed: boolean }) =>
            style({ pressed, hovered: hovered && !disabled })
        : style,
    [style, hovered, disabled],
  );

  return (
    <Pressable
      {...rest}
      disabled={disabled}
      onHoverIn={handleHoverIn}
      onHoverOut={handleHoverOut}
      style={resolvedStyle}>
      {typeof children === 'function'
        ? ({ pressed }) => children({ pressed, hovered: hovered && !disabled })
        : children}
    </Pressable>
  );
};
