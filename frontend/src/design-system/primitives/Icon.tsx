import React from 'react';
import { View, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/ThemeContext';
import type { Palette } from '../theme/palettes';

export type IconName =
  | 'check'
  | 'plus'
  | 'close'
  | 'trash'
  | 'chevronRight'
  | 'chevronDown'
  | 'contrast'
  | 'dot'
  | 'inbox'
  | 'pencil';

export interface IconProps {
  readonly name: IconName;
  readonly size?: number;
  readonly color?: keyof Palette;
  readonly strokeWidth?: number;
}

/**
 * Icons drawn from layout primitives rather than an icon font or SVG package.
 *
 * Rationale: fonts need per-platform asset linking and SVG needs a native
 * module plus a web shim. Composed views render pixel-identically on iOS and
 * in the desktop build, add zero dependencies, and inherit theme colours for
 * free — which matters more here than an exhaustive glyph set.
 */
export const Icon = ({
  name,
  size = 16,
  color = 'textPrimary',
  strokeWidth,
}: IconProps) => {
  const theme = useTheme();
  const tint = theme.colors[color];
  const stroke = strokeWidth ?? Math.max(1.5, Math.round(size / 9));

  const frame: ViewStyle = {
    width: size,
    height: size,
    alignItems: 'center',
    justifyContent: 'center',
  };

  switch (name) {
    case 'check':
      return (
        <View style={frame}>
          <View
            style={{
              width: size * 0.42,
              height: size * 0.72,
              borderRightWidth: stroke,
              borderBottomWidth: stroke,
              borderColor: tint,
              transform: [{ rotate: '42deg' }, { translateY: -size * 0.06 }],
            }}
          />
        </View>
      );

    case 'plus':
      return (
        <View style={frame}>
          <View
            style={{
              position: 'absolute',
              width: size * 0.78,
              height: stroke,
              borderRadius: stroke,
              backgroundColor: tint,
            }}
          />
          <View
            style={{
              position: 'absolute',
              width: stroke,
              height: size * 0.78,
              borderRadius: stroke,
              backgroundColor: tint,
            }}
          />
        </View>
      );

    case 'close':
      return (
        <View style={frame}>
          {['45deg', '-45deg'].map(rotate => (
            <View
              key={rotate}
              style={{
                position: 'absolute',
                width: size * 0.72,
                height: stroke,
                borderRadius: stroke,
                backgroundColor: tint,
                transform: [{ rotate }],
              }}
            />
          ))}
        </View>
      );

    case 'trash':
      return (
        <View style={frame}>
          <View
            style={{
              width: size * 0.72,
              height: stroke,
              borderRadius: stroke,
              backgroundColor: tint,
            }}
          />
          <View
            style={{
              width: size * 0.3,
              height: stroke,
              marginTop: -size * 0.18,
              marginBottom: size * 0.08,
              borderTopLeftRadius: stroke,
              borderTopRightRadius: stroke,
              backgroundColor: tint,
            }}
          />
          <View
            style={{
              width: size * 0.56,
              height: size * 0.56,
              borderWidth: stroke,
              borderTopWidth: 0,
              borderColor: tint,
              borderBottomLeftRadius: size * 0.12,
              borderBottomRightRadius: size * 0.12,
            }}
          />
        </View>
      );

    case 'chevronRight':
    case 'chevronDown':
      return (
        <View style={frame}>
          <View
            style={{
              width: size * 0.42,
              height: size * 0.42,
              borderRightWidth: stroke,
              borderTopWidth: stroke,
              borderColor: tint,
              transform: [
                { rotate: name === 'chevronRight' ? '45deg' : '135deg' },
                { translateX: name === 'chevronRight' ? -size * 0.06 : 0 },
              ],
            }}
          />
        </View>
      );

    case 'contrast':
      return (
        <View style={frame}>
          <View
            style={{
              width: size * 0.84,
              height: size * 0.84,
              borderRadius: size * 0.42,
              borderWidth: stroke,
              borderColor: tint,
              overflow: 'hidden',
              flexDirection: 'row',
            }}>
            <View style={{ flex: 1, backgroundColor: tint }} />
            <View style={{ flex: 1 }} />
          </View>
        </View>
      );

    case 'dot':
      return (
        <View style={frame}>
          <View
            style={{
              width: size * 0.4,
              height: size * 0.4,
              borderRadius: size * 0.2,
              backgroundColor: tint,
            }}
          />
        </View>
      );

    case 'pencil':
      return (
        <View style={frame}>
          <View
            style={{
              width: size * 0.26,
              height: size * 0.74,
              borderWidth: stroke,
              borderColor: tint,
              borderRadius: stroke,
              transform: [{ rotate: '45deg' }],
            }}
          />
        </View>
      );

    case 'inbox':
    default:
      return (
        <View style={frame}>
          <View
            style={{
              width: size * 0.86,
              height: size * 0.7,
              borderWidth: stroke,
              borderColor: tint,
              borderRadius: size * 0.14,
              justifyContent: 'center',
              alignItems: 'center',
              gap: Math.max(2, size * 0.1),
              paddingHorizontal: size * 0.14,
            }}>
            <View
              style={{
                height: stroke,
                alignSelf: 'stretch',
                backgroundColor: tint,
                borderRadius: stroke,
              }}
            />
            <View
              style={{
                height: stroke,
                width: '60%',
                alignSelf: 'flex-start',
                backgroundColor: tint,
                borderRadius: stroke,
              }}
            />
          </View>
        </View>
      );
  }
};
