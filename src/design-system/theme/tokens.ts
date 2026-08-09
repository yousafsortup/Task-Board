import { Platform } from 'react-native';

/**
 * Primitive design tokens — the raw scales. Semantic meaning is applied one
 * layer up, in `palettes.ts` / `theme.ts`, so a component never reaches for a
 * raw value like `#5B5BD6` directly.
 */

export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  giant: 56,
} as const;

export type SpacingToken = keyof typeof spacing;

export const radii = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

export type RadiusToken = keyof typeof radii;

/**
 * `undefined` on Apple platforms lets the OS pick San Francisco (including
 * its optical sizing); on web we spell out an equivalent system stack.
 */
const systemFontFamily = Platform.select({
  web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, "Helvetica Neue", Arial, sans-serif',
  default: undefined,
});

export const typography = {
  display: {
    fontFamily: systemFontFamily,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  title: {
    fontFamily: systemFontFamily,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  heading: {
    fontFamily: systemFontFamily,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: systemFontFamily,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  bodyStrong: {
    fontFamily: systemFontFamily,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  label: {
    fontFamily: systemFontFamily,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    letterSpacing: 0,
  },
  caption: {
    fontFamily: systemFontFamily,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  overline: {
    fontFamily: systemFontFamily,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
} as const;

export type TypographyToken = keyof typeof typography;

export const motion = {
  instant: 0,
  fast: 120,
  normal: 200,
  slow: 320,
} as const;

/** Touch targets stay >= 44pt on phones; desktop can be denser. */
export const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 } as const;

export const layout = {
  minTouchTarget: 44,
  minPointerTarget: 32,
  sidebarWidth: 264,
  detailPaneWidth: 380,
  contentMaxWidth: 760,
} as const;
