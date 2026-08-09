/**
 * Semantic colour palettes. Components only ever reference these names, which
 * is why dark mode is a data change rather than a code change.
 */
export interface Palette {
  /** App canvas, behind every surface. */
  background: string;
  /** Secondary canvas used by the desktop sidebar / sunken areas. */
  backgroundSunken: string;
  surface: string;
  surfaceElevated: string;
  surfaceHover: string;
  surfacePressed: string;

  border: string;
  borderStrong: string;
  divider: string;

  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;

  accent: string;
  accentHover: string;
  accentPressed: string;
  accentSoft: string;
  accentBorder: string;
  onAccent: string;

  success: string;
  successSoft: string;
  danger: string;
  dangerHover: string;
  dangerSoft: string;
  warning: string;

  focusRing: string;
  overlay: string;
  shadow: string;
  skeleton: string;
}

export const lightPalette: Palette = {
  background: '#F4F5F7',
  backgroundSunken: '#EDEFF3',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceHover: '#F5F6F8',
  surfacePressed: '#ECEEF2',

  border: '#E4E7EC',
  borderStrong: '#CFD4DC',
  divider: '#EDEFF3',

  textPrimary: '#101319',
  textSecondary: '#5B6474',
  textTertiary: '#8A93A3',
  textInverse: '#FFFFFF',

  accent: '#5B5BD6',
  accentHover: '#5151C6',
  accentPressed: '#4646B4',
  accentSoft: '#EEEEFC',
  accentBorder: '#D4D4F7',
  onAccent: '#FFFFFF',

  success: '#0E9F6E',
  successSoft: '#E6F6EF',
  danger: '#DC3F45',
  dangerHover: '#C6353B',
  dangerSoft: '#FDECEC',
  warning: '#D98207',

  focusRing: 'rgba(91, 91, 214, 0.45)',
  overlay: 'rgba(16, 19, 25, 0.45)',
  shadow: '#101319',
  skeleton: '#E9EBEF',
};

export const darkPalette: Palette = {
  background: '#0B0C10',
  backgroundSunken: '#0F1116',
  surface: '#15171D',
  surfaceElevated: '#1B1E26',
  surfaceHover: '#1F232C',
  surfacePressed: '#252A34',

  border: '#252932',
  borderStrong: '#343A46',
  divider: '#1E222A',

  textPrimary: '#ECEEF3',
  textSecondary: '#9AA3B2',
  textTertiary: '#6C7484',
  textInverse: '#0B0C10',

  accent: '#8A8AF5',
  accentHover: '#9B9BFB',
  accentPressed: '#7B7BEA',
  accentSoft: '#1C1D33',
  accentBorder: '#2E2F52',
  onAccent: '#0B0C10',

  success: '#3DD68C',
  successSoft: '#10281E',
  danger: '#FF6369',
  dangerHover: '#FF7A7F',
  dangerSoft: '#2E1417',
  warning: '#F5A524',

  focusRing: 'rgba(138, 138, 245, 0.55)',
  overlay: 'rgba(0, 0, 0, 0.62)',
  shadow: '#000000',
  skeleton: '#1E222A',
};
