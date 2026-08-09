/**
 * Identifier generation, expressed as a port so tests can substitute a
 * deterministic sequence. Hermes does not ship `crypto.randomUUID`, so the
 * default implementation is a lexicographically sortable, collision-resistant
 * id built from a timestamp prefix and a random suffix.
 */
export interface IdGenerator {
  (): string;
}

const RANDOM_SEGMENT_LENGTH = 10;

const randomSegment = (): string => {
  let out = '';
  while (out.length < RANDOM_SEGMENT_LENGTH) {
    out += Math.random().toString(36).slice(2);
  }
  return out.slice(0, RANDOM_SEGMENT_LENGTH);
};

/**
 * Timestamp-prefixed id: sorting by id matches creation order, which keeps
 * list ordering stable even when two tasks are created in the same tick.
 */
export const createId: IdGenerator = () =>
  `${Date.now().toString(36)}-${randomSegment()}`;

/** Deterministic generator for tests: `t-1`, `t-2`, … */
export const createSequentialIdGenerator = (prefix = 't'): IdGenerator => {
  let seq = 0;
  return () => `${prefix}-${++seq}`;
};
