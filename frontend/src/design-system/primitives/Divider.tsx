import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/ThemeContext';

export interface DividerProps {
  readonly orientation?: 'horizontal' | 'vertical';
  readonly inset?: number;
  readonly style?: StyleProp<ViewStyle>;
}

export const Divider = ({
  orientation = 'horizontal',
  inset = 0,
  style,
}: DividerProps) => {
  const theme = useTheme();

  return (
    <View
      accessibilityRole="none"
      style={[
        orientation === 'horizontal'
          ? {
              height: 1,
              alignSelf: 'stretch',
              marginHorizontal: inset,
              backgroundColor: theme.colors.divider,
            }
          : {
              width: 1,
              alignSelf: 'stretch',
              marginVertical: inset,
              backgroundColor: theme.colors.divider,
            },
        style,
      ]}
    />
  );
};
