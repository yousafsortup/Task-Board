import { PersistenceError } from '../../domain';
import type { KeyValueStore } from './keyValueStore';

export type { KeyValueStore };

/**
 * Desktop (react-native-web inside Electron) implementation.
 *
 * Note this is a *driven adapter* swap, not a business-logic fork: the
 * repository, the store and every screen above it are byte-identical across
 * platforms — only the bytes-in/bytes-out primitive changes.
 */
const memoryFallback = new Map<string, string>();

const hasLocalStorage = (): boolean => {
  try {
    return typeof globalThis.localStorage !== 'undefined';
  } catch {
    return false;
  }
};

export const createKeyValueStore = (): KeyValueStore => {
  const useLocalStorage = hasLocalStorage();

  return {
    async get(key) {
      try {
        return useLocalStorage
          ? globalThis.localStorage.getItem(key)
          : (memoryFallback.get(key) ?? null);
      } catch (cause) {
        throw new PersistenceError(`Failed to read "${key}".`, cause);
      }
    },
    async set(key, value) {
      try {
        if (useLocalStorage) {
          globalThis.localStorage.setItem(key, value);
        } else {
          memoryFallback.set(key, value);
        }
      } catch (cause) {
        throw new PersistenceError(`Failed to write "${key}".`, cause);
      }
    },
    async remove(key) {
      try {
        if (useLocalStorage) {
          globalThis.localStorage.removeItem(key);
        } else {
          memoryFallback.delete(key);
        }
      } catch (cause) {
        throw new PersistenceError(`Failed to remove "${key}".`, cause);
      }
    },
  };
};

export const STORAGE_DRIVER = 'local-storage';
