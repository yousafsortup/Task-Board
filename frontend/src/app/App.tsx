import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StatusBar, View } from 'react-native';

import { AppProviders } from './providers/AppProviders';
import { ErrorBoundary } from './ErrorBoundary';
import { createServices, type Services } from './services/createServices';
import {
  DEFAULT_PREFERENCES,
  type AppPreferences,
} from './preferences/preferences';
import { useTheme } from '../design-system';
import { TaskBoardScreen } from '../features/tasks/screens/TaskBoardScreen';

/** Inside the providers, so it can colour the status bar from the theme. */
const AppShell = () => {
  const theme = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar
        barStyle={theme.scheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      <TaskBoardScreen />
    </View>
  );
};

export interface AppProps {
  /** Overridable so tests and previews can inject their own services. */
  readonly services?: Services;
}

/**
 * Application entry point, shared verbatim by every target: `index.js`
 * registers it with `AppRegistry` for iOS/Android and `index.web.tsx` mounts
 * the same component into the desktop shell.
 */
export const App = ({ services: injectedServices }: AppProps = {}) => {
  const services = useMemo(
    () => injectedServices ?? createServices(),
    [injectedServices],
  );

  // Preferences gate the first paint so the app never flashes the wrong theme.
  const [preferences, setPreferences] = useState<AppPreferences | null>(null);

  useEffect(() => {
    let cancelled = false;
    services.preferences
      .load()
      .then(loaded => {
        if (!cancelled) {
          setPreferences(loaded);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPreferences(DEFAULT_PREFERENCES);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [services]);

  if (preferences === null) {
    return (
      <View
        testID="app-boot"
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F4F5F7',
        }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <AppProviders services={services} preferences={preferences}>
        <AppShell />
      </AppProviders>
    </ErrorBoundary>
  );
};

export default App;
