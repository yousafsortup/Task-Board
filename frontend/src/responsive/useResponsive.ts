import { useMemo } from 'react';
import { Platform, useWindowDimensions } from 'react-native';

import {
  isAtLeast,
  resolveBreakpoint,
  resolveLayoutMode,
  resolveResponsiveValue,
  type Breakpoint,
  type LayoutMode,
  type ResponsiveValue,
} from './breakpoints';

export interface ResponsiveInfo {
  readonly width: number;
  readonly height: number;
  readonly breakpoint: Breakpoint;
  readonly layoutMode: LayoutMode;
  readonly orientation: 'portrait' | 'landscape';

  readonly isCompact: boolean;
  readonly isMedium: boolean;
  readonly isExpanded: boolean;
  readonly isWide: boolean;

  /** `true` from `medium` up — i.e. there is room for a persistent sidebar. */
  readonly hasSidebar: boolean;
  /** `true` from `expanded` up — i.e. detail can live beside the list. */
  readonly hasDetailPane: boolean;

  /**
   * Input capability, not operating system. Drives hover states, denser
   * hit targets and keyboard hints — the things that should follow the
   * *pointer*, not the platform badge.
   */
  readonly pointerFine: boolean;
  readonly supportsHover: boolean;

  atLeast(target: Breakpoint): boolean;
  select<T>(value: ResponsiveValue<T>): T | undefined;
}

/**
 * `useWindowDimensions` is live on every target: it tracks device rotation on
 * iOS and window resizing on desktop, so the same hook powers both.
 */
export const useResponsive = (): ResponsiveInfo => {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const breakpoint = resolveBreakpoint(width);
    const layoutMode = resolveLayoutMode(breakpoint);
    const pointerFine = Platform.OS === 'web' || Platform.OS === 'macos';

    return {
      width,
      height,
      breakpoint,
      layoutMode,
      orientation: width >= height ? 'landscape' : 'portrait',

      isCompact: breakpoint === 'compact',
      isMedium: breakpoint === 'medium',
      isExpanded: breakpoint === 'expanded',
      isWide: breakpoint === 'wide',

      hasSidebar: isAtLeast(breakpoint, 'medium'),
      hasDetailPane: isAtLeast(breakpoint, 'expanded'),

      pointerFine,
      supportsHover: pointerFine,

      atLeast: (target: Breakpoint) => isAtLeast(breakpoint, target),
      select: <T,>(value: ResponsiveValue<T>) =>
        resolveResponsiveValue(value, breakpoint),
    };
  }, [width, height]);
};

/** Ergonomic shorthand: `useResponsiveValue({ compact: 16, expanded: 32 })`. */
export const useResponsiveValue = <T,>(
  value: ResponsiveValue<T>,
): T | undefined => {
  const { breakpoint } = useResponsive();
  return useMemo(
    () => resolveResponsiveValue(value, breakpoint),
    [value, breakpoint],
  );
};
