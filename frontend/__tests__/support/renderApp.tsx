import React from 'react';
import { Dimensions } from 'react-native';
import { render } from '@testing-library/react-native';

import { App } from '../../src/app/App';
import { appConfig } from '../../src/app/config/appConfig';
import { createPreferencesStore } from '../../src/app/preferences/preferences';
import type { Services } from '../../src/app/services/createServices';
import { LocalTaskRepository } from '../../src/data/repositories/LocalTaskRepository';
import { createInMemoryKeyValueStore } from '../../src/data/storage/inMemoryKeyValueStore';

export const PHONE = { width: 390, height: 844 };
export const TABLET = { width: 834, height: 1112 };
export const DESKTOP = { width: 1440, height: 900 };

/**
 * Builds a complete, isolated service graph backed by memory. This is the same
 * `Services` shape the real app builds in `createServices()` — only the
 * storage driver differs, which is exactly the seam the architecture exists
 * to provide.
 */
export const createTestServices = (): Services => {
  const keyValueStore = createInMemoryKeyValueStore();
  return {
    taskRepository: new LocalTaskRepository({ store: keyValueStore }),
    preferences: createPreferencesStore(keyValueStore),
    config: appConfig,
  };
};

export interface RenderAppOptions {
  readonly viewport?: { width: number; height: number };
  readonly services?: Services;
}

/**
 * Renders the real application at a chosen viewport size.
 *
 * Driving the window size — rather than stubbing a "isPhone" flag — is what
 * makes these tests meaningful: they exercise the same responsive code path
 * that a resized desktop window goes through.
 */
export const renderApp = ({
  viewport = PHONE,
  services = createTestServices(),
}: RenderAppOptions = {}) => {
  jest.spyOn(Dimensions, 'get').mockReturnValue({
    ...viewport,
    scale: 2,
    fontScale: 1,
  });

  return { services, ...render(<App services={services} />) };
};
