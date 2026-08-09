export interface KeyboardShortcut {
  /** Single character or key name, e.g. `'n'`, `'Escape'`. Case-insensitive. */
  readonly key: string;
  /** Requires ⌘ on Apple platforms or Ctrl elsewhere. */
  readonly meta?: boolean;
  readonly handler: () => void;
  readonly enabled?: boolean;
}

/**
 * Hardware-keyboard shortcuts.
 *
 * This is the *native* implementation and is intentionally a no-op: iOS has no
 * global key event stream for a plain RN view, and inventing one would be a
 * platform fork of behaviour rather than of plumbing. The desktop build picks
 * up `useKeyboardShortcut.web.ts` instead, so calling this hook is always safe.
 */
export const useKeyboardShortcut = (_shortcuts: KeyboardShortcut[]): void => {
  // Intentionally empty — see the note above.
};
