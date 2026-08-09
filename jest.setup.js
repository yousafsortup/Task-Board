/* eslint-env jest */

/**
 * Native modules that have no JS implementation under Jest.
 *
 * Note how small this file is. Because persistence sits behind the
 * `KeyValueStore` port, tests inject an in-memory store and never exercise
 * AsyncStorage at all — this stub exists purely so that *importing* the
 * module in the composition root does not blow up.
 */
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
    removeItem: jest.fn(async () => undefined),
    clear: jest.fn(async () => undefined),
  },
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const insets = { top: 0, right: 0, bottom: 0, left: 0 };
  const frame = { x: 0, y: 0, width: 390, height: 844 };
  const passthrough = ({ children }) =>
    React.createElement(React.Fragment, null, children);

  return {
    SafeAreaProvider: passthrough,
    SafeAreaView: passthrough,
    SafeAreaInsetsContext: React.createContext(insets),
    useSafeAreaInsets: () => insets,
    useSafeAreaFrame: () => frame,
    initialWindowMetrics: { frame, insets },
  };
});
