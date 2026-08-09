import React, { useCallback } from 'react';

import { IconButton } from '../primitives/IconButton';
import { SegmentedControl } from '../primitives/SegmentedControl';
import { useThemeContext } from '../theme/ThemeContext';
import { THEME_MODES, type ThemeMode } from '../theme/theme';

const LABELS: Record<ThemeMode, string> = {
  system: 'Auto',
  light: 'Light',
  dark: 'Dark',
};

export interface ThemeModeControlProps {
  /** `icon` cycles through modes; `segmented` shows all three. */
  readonly variant?: 'icon' | 'segmented';
}

/**
 * Dark mode is a first-class preference, not a coin flip: `Auto` follows the
 * OS (and updates live when the user changes it), while `Light`/`Dark` pin it.
 */
export const ThemeModeControl = ({
  variant = 'icon',
}: ThemeModeControlProps) => {
  const { mode, setMode, cycleMode } = useThemeContext();

  const handleChange = useCallback(
    (next: ThemeMode) => setMode(next),
    [setMode],
  );

  if (variant === 'segmented') {
    return (
      <SegmentedControl
        testID="theme-mode"
        accessibilityLabel="Appearance"
        options={THEME_MODES.map(value => ({ value, label: LABELS[value] }))}
        value={mode}
        onChange={handleChange}
      />
    );
  }

  return (
    <IconButton
      name="contrast"
      testID="theme-mode-toggle"
      accessibilityLabel={`Appearance: ${LABELS[mode]}. Tap to change.`}
      onPress={cycleMode}
    />
  );
};
