import React, { useCallback, useMemo, type PropsWithChildren } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider, type ThemeMode } from '../../design-system';
import { TaskStoreProvider } from '../../features/tasks/state/TaskStoreProvider';
import { createTaskStore } from '../../features/tasks/state/taskStore';
import type { AppPreferences } from '../preferences/preferences';
import type { Services } from '../services/createServices';

export interface AppProvidersProps extends PropsWithChildren {
  readonly services: Services;
  readonly preferences: AppPreferences;
}

/**
 * Wires the object graph into React exactly once, at the root.
 *
 * The task store is built here from the injected repository rather than
 * imported as a singleton — so a test, a preview or a second window can each
 * mount the app over a different data source.
 */
export const AppProviders = ({
  services,
  preferences,
  children,
}: AppProvidersProps) => {
  const store = useMemo(
    () =>
      createTaskStore({
        repository: services.taskRepository,
        initialFilter: preferences.filter,
        initialSortOrder: preferences.sortOrder,
        onPreferencesChange: next => {
          void services.preferences.save(next);
        },
      }),
    [services, preferences.filter, preferences.sortOrder],
  );

  const handleThemeModeChange = useCallback(
    (themeMode: ThemeMode) => {
      void services.preferences.save({ themeMode });
    },
    [services],
  );

  return (
    <SafeAreaProvider>
      <ThemeProvider
        initialMode={preferences.themeMode}
        onModeChange={handleThemeModeChange}>
        <TaskStoreProvider store={store}>{children}</TaskStoreProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};
