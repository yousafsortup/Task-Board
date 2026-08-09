import {
  DEFAULT_TASK_FILTER,
  isTaskFilter,
  TASK_SORT_ORDERS,
  type TaskFilter,
  type TaskSortOrder,
} from '../../domain';
import type { KeyValueStore } from '../../data/storage/keyValueStore';
import type { ThemeMode } from '../../design-system';

/**
 * Small, non-critical UI state that should survive a restart: the filter the
 * user last looked at, how they sort, and their appearance choice.
 *
 * Deliberately separate from task data — different lifecycle, different
 * consequences if it is ever lost.
 */
export interface AppPreferences {
  readonly filter: TaskFilter;
  readonly sortOrder: TaskSortOrder;
  readonly themeMode: ThemeMode;
}

export const DEFAULT_PREFERENCES: AppPreferences = {
  filter: DEFAULT_TASK_FILTER,
  sortOrder: 'smart',
  themeMode: 'system',
};

export interface PreferencesStore {
  load(): Promise<AppPreferences>;
  save(patch: Partial<AppPreferences>): Promise<void>;
}

const PREFERENCES_KEY = 'taskboard.preferences.v1';

const isSortOrder = (value: unknown): value is TaskSortOrder =>
  typeof value === 'string' &&
  (TASK_SORT_ORDERS as readonly string[]).includes(value);

const isThemeMode = (value: unknown): value is ThemeMode =>
  value === 'system' || value === 'light' || value === 'dark';

export const createPreferencesStore = (
  store: KeyValueStore,
): PreferencesStore => {
  let cache: AppPreferences | null = null;

  return {
    async load() {
      if (cache) {
        return cache;
      }
      try {
        const raw = await store.get(PREFERENCES_KEY);
        const parsed: unknown = raw ? JSON.parse(raw) : null;
        const record = (parsed ?? {}) as Record<string, unknown>;

        cache = {
          filter: isTaskFilter(record.filter)
            ? record.filter
            : DEFAULT_PREFERENCES.filter,
          sortOrder: isSortOrder(record.sortOrder)
            ? record.sortOrder
            : DEFAULT_PREFERENCES.sortOrder,
          themeMode: isThemeMode(record.themeMode)
            ? record.themeMode
            : DEFAULT_PREFERENCES.themeMode,
        };
      } catch {
        cache = DEFAULT_PREFERENCES;
      }
      return cache;
    },

    async save(patch) {
      const current = cache ?? (await this.load());
      cache = { ...current, ...patch };
      try {
        await store.set(PREFERENCES_KEY, JSON.stringify(cache));
      } catch {
        // Preferences are a nicety — never let them break the app.
      }
    },
  };
};
