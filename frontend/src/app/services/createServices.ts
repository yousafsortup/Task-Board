import { appConfig, type AppConfig } from '../config/appConfig';
import { createPreferencesStore, type PreferencesStore } from '../preferences/preferences';
import { HttpTaskRepository } from '../../data/repositories/HttpTaskRepository';
import { LocalTaskRepository } from '../../data/repositories/LocalTaskRepository';
import {
  createKeyValueStore,
  type KeyValueStore,
} from '../../data/storage/keyValueStore';
import type { TaskRepository } from '../../domain';

export interface Services {
  readonly taskRepository: TaskRepository;
  readonly preferences: PreferencesStore;
  readonly config: AppConfig;
}

export interface CreateServicesOptions {
  readonly config?: AppConfig;
  /** Overridable for tests and previews. */
  readonly keyValueStore?: KeyValueStore;
  readonly taskRepository?: TaskRepository;
}

/**
 * The composition root — the one place in the codebase that knows which
 * concrete implementations exist.
 *
 * `createKeyValueStore` resolves to AsyncStorage on iOS/Android and to
 * `localStorage` in the desktop build, chosen by the bundler through the
 * `.web.ts` file extension. Nothing above this function can tell the
 * difference, which is what keeps the shared code genuinely shared.
 */
export const createServices = (
  options: CreateServicesOptions = {},
): Services => {
  const config = options.config ?? appConfig;
  const keyValueStore = options.keyValueStore ?? createKeyValueStore();

  const taskRepository =
    options.taskRepository ??
    (config.dataSource === 'http'
      ? new HttpTaskRepository({ baseUrl: config.apiBaseUrl })
      : new LocalTaskRepository({ store: keyValueStore }));

  return {
    taskRepository,
    preferences: createPreferencesStore(keyValueStore),
    config,
  };
};
