/**
 * Time, as an injectable port. Keeping `Date.now()` out of the domain means
 * every timestamp-sensitive rule is testable without freezing globals.
 */
export interface Clock {
  /** Current time in epoch milliseconds. */
  now(): number;
}

export const systemClock: Clock = {
  now: () => Date.now(),
};

/** Fixed clock for tests; `advance` moves it forward deterministically. */
export const createFixedClock = (startedAt = 0) => {
  let current = startedAt;
  return {
    now: () => current,
    advance: (ms: number) => {
      current += ms;
    },
    set: (ms: number) => {
      current = ms;
    },
  };
};
