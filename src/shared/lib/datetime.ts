const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

/**
 * Compact relative time ("just now", "4m", "3d") for list rows, where space
 * is tight and precision is not the point.
 */
export const formatRelativeTime = (
  timestamp: number,
  now: number = Date.now(),
): string => {
  const elapsed = Math.max(0, now - timestamp);

  if (elapsed < MINUTE) {
    return 'just now';
  }
  if (elapsed < HOUR) {
    return `${Math.floor(elapsed / MINUTE)}m ago`;
  }
  if (elapsed < DAY) {
    return `${Math.floor(elapsed / HOUR)}h ago`;
  }
  if (elapsed < WEEK) {
    return `${Math.floor(elapsed / DAY)}d ago`;
  }
  return `${Math.floor(elapsed / WEEK)}w ago`;
};

/**
 * Full date/time for the detail pane, where there is room to be precise.
 * Falls back gracefully if `Intl` is unavailable on the JS engine.
 */
export const formatAbsoluteDateTime = (timestamp: number): string => {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(timestamp));
  } catch {
    return new Date(timestamp).toISOString().replace('T', ' ').slice(0, 16);
  }
};

/** "Tuesday, 9 August" — the greeting line on the board header. */
export const formatDayHeadline = (timestamp: number = Date.now()): string => {
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date(timestamp));
  } catch {
    return new Date(timestamp).toDateString();
  }
};
