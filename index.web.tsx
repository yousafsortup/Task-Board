/**
 * Desktop entry point.
 *
 * The only difference from `index.js` (iOS/Android) is the last call:
 * `runApplication` mounts into a DOM node instead of waiting for a native
 * host to start the surface. The component tree that follows is identical.
 */
import { AppRegistry } from 'react-native';

import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);

const rootTag = document.getElementById('root');

if (!rootTag) {
  throw new Error('Root element "#root" is missing from index.html.');
}

AppRegistry.runApplication(appName, { rootTag });
