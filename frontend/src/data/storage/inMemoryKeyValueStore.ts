import type { KeyValueStore } from './keyValueStore';

/**
 * Test double. Also doubles as the safety net when a platform has no
 * persistent storage available at all.
 */
export const createInMemoryKeyValueStore = (
  seed: Record<string, string> = {},
): KeyValueStore & { snapshot(): Record<string, string> } => {
  const store = new Map<string, string>(Object.entries(seed));

  return {
    async get(key) {
      return store.get(key) ?? null;
    },
    async set(key, value) {
      store.set(key, value);
    },
    async remove(key) {
      store.delete(key);
    },
    snapshot() {
      return Object.fromEntries(store);
    },
  };
};
