import AsyncStorage from '@react-native-async-storage/async-storage';

import { PersistenceError } from '../../domain';

/**
 * The only storage primitive the app depends on. Everything above this line
 * is platform-agnostic; everything below it is swapped per platform by
 * Metro/Vite module resolution (`keyValueStore.web.ts` wins on desktop).
 */
export interface KeyValueStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

/** Default (iOS / Android): AsyncStorage. */
export const createKeyValueStore = (): KeyValueStore => ({
  async get(key) {
    try {
      return await AsyncStorage.getItem(key);
    } catch (cause) {
      throw new PersistenceError(`Failed to read "${key}".`, cause);
    }
  },
  async set(key, value) {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (cause) {
      throw new PersistenceError(`Failed to write "${key}".`, cause);
    }
  },
  async remove(key) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (cause) {
      throw new PersistenceError(`Failed to remove "${key}".`, cause);
    }
  },
});

export const STORAGE_DRIVER = 'async-storage';
