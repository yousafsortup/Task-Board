import {
  BREAKPOINTS,
  isAtLeast,
  resolveBreakpoint,
  resolveLayoutMode,
  resolveResponsiveValue,
} from '../../src/responsive/breakpoints';

/**
 * These pure functions decide the entire cross-platform layout story, so they
 * are pinned down independently of any component.
 */
describe('resolveBreakpoint', () => {
  it.each([
    [320, 'compact'],
    [390, 'compact'],
    [699, 'compact'],
    [700, 'medium'],
    [999, 'medium'],
    [1000, 'expanded'],
    [1359, 'expanded'],
    [1360, 'wide'],
    [2560, 'wide'],
  ])('maps %ipx to "%s"', (width, expected) => {
    expect(resolveBreakpoint(width)).toBe(expected);
  });

  it('treats every boundary as inclusive of the larger tier', () => {
    expect(resolveBreakpoint(BREAKPOINTS.medium)).toBe('medium');
    expect(resolveBreakpoint(BREAKPOINTS.medium - 1)).toBe('compact');
  });
});

describe('resolveLayoutMode', () => {
  it('gives a phone one column and a desktop three panes', () => {
    expect(resolveLayoutMode('compact')).toBe('stack');
    expect(resolveLayoutMode('medium')).toBe('split');
    expect(resolveLayoutMode('expanded')).toBe('triptych');
    expect(resolveLayoutMode('wide')).toBe('triptych');
  });
});

describe('isAtLeast', () => {
  it('orders the breakpoints', () => {
    expect(isAtLeast('expanded', 'medium')).toBe(true);
    expect(isAtLeast('medium', 'medium')).toBe(true);
    expect(isAtLeast('compact', 'medium')).toBe(false);
  });
});

describe('resolveResponsiveValue', () => {
  it('returns a plain value untouched', () => {
    expect(resolveResponsiveValue(16, 'wide')).toBe(16);
  });

  it('cascades down from the nearest smaller breakpoint', () => {
    const value = { compact: 16, expanded: 32 };

    expect(resolveResponsiveValue(value, 'compact')).toBe(16);
    expect(resolveResponsiveValue(value, 'medium')).toBe(16);
    expect(resolveResponsiveValue(value, 'expanded')).toBe(32);
    expect(resolveResponsiveValue(value, 'wide')).toBe(32);
  });

  it('is undefined when no smaller breakpoint defines a value', () => {
    expect(resolveResponsiveValue({ expanded: 32 }, 'compact')).toBeUndefined();
  });
});
