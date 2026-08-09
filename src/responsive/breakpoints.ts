/**
 * Breakpoints are expressed in density-independent pixels and are deliberately
 * content-driven rather than device-driven: `medium` is "there is room for a
 * navigation rail beside the list", `expanded` is "there is room for a third
 * pane". A large iPad in landscape gets the desktop layout; a narrow desktop
 * window gets the phone layout. That is the point.
 */
export const BREAKPOINTS = {
  compact: 0,
  medium: 700,
  expanded: 1000,
  wide: 1360,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

export const BREAKPOINT_ORDER: readonly Breakpoint[] = [
  'compact',
  'medium',
  'expanded',
  'wide',
];

export const resolveBreakpoint = (width: number): Breakpoint => {
  if (width >= BREAKPOINTS.wide) {
    return 'wide';
  }
  if (width >= BREAKPOINTS.expanded) {
    return 'expanded';
  }
  if (width >= BREAKPOINTS.medium) {
    return 'medium';
  }
  return 'compact';
};

export const breakpointRank = (breakpoint: Breakpoint): number =>
  BREAKPOINT_ORDER.indexOf(breakpoint);

export const isAtLeast = (current: Breakpoint, target: Breakpoint): boolean =>
  breakpointRank(current) >= breakpointRank(target);

/**
 * How many panes the shell should show. Derived once, here, so no component
 * has to re-derive "am I on desktop?" with its own ad-hoc threshold.
 */
export type LayoutMode = 'stack' | 'split' | 'triptych';

export const resolveLayoutMode = (breakpoint: Breakpoint): LayoutMode => {
  switch (breakpoint) {
    case 'compact':
      return 'stack';
    case 'medium':
      return 'split';
    default:
      return 'triptych';
  }
};

/** Values that cascade *down* from the largest defined breakpoint. */
export type ResponsiveValue<T> = T | Partial<Record<Breakpoint, T>>;

const isResponsiveMap = <T>(
  value: ResponsiveValue<T>,
): value is Partial<Record<Breakpoint, T>> =>
  typeof value === 'object' &&
  value !== null &&
  BREAKPOINT_ORDER.some(bp => bp in (value as object));

/**
 * Picks the value for `breakpoint`, falling back to the closest smaller
 * breakpoint that defines one — the familiar mobile-first cascade.
 */
export const resolveResponsiveValue = <T>(
  value: ResponsiveValue<T>,
  breakpoint: Breakpoint,
): T | undefined => {
  if (!isResponsiveMap(value)) {
    return value as T;
  }

  for (let index = breakpointRank(breakpoint); index >= 0; index -= 1) {
    const candidate = value[BREAKPOINT_ORDER[index]];
    if (candidate !== undefined) {
      return candidate;
    }
  }
  return undefined;
};
