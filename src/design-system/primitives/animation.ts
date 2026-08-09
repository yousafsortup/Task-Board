import { Platform } from 'react-native';

/**
 * The native animation driver does not exist under react-native-web, where
 * animations run on the browser's own compositor instead. Declaring the flag
 * once here keeps the rest of the codebase free of rendering-engine checks.
 */
export const USE_NATIVE_DRIVER = Platform.OS !== 'web';
