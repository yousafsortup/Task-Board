import { useEffect, useRef } from 'react';

import type { KeyboardShortcut } from './useKeyboardShortcut';

export type { KeyboardShortcut };

const isTextEntry = (target: EventTarget | null): boolean => {
  const element = target as HTMLElement | null;
  if (!element) {
    return false;
  }
  const tag = element.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || element.isContentEditable;
};

/**
 * Desktop implementation: real ⌘/Ctrl shortcuts.
 *
 * The handler list is held in a ref so callers can pass inline closures
 * without re-binding the DOM listener on every render.
 */
export const useKeyboardShortcut = (shortcuts: KeyboardShortcut[]): void => {
  const latest = useRef(shortcuts);
  latest.current = shortcuts;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of latest.current) {
        if (shortcut.enabled === false) {
          continue;
        }
        if (event.key.toLowerCase() !== shortcut.key.toLowerCase()) {
          continue;
        }
        if (shortcut.meta && !(event.metaKey || event.ctrlKey)) {
          continue;
        }
        // Let people type an "n" into a field without summoning the composer.
        if (!shortcut.meta && isTextEntry(event.target)) {
          continue;
        }

        event.preventDefault();
        shortcut.handler();
        return;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
};
