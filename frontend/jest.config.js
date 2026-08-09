/**
 * Jest runs the *shared* code — domain, data and feature layers — exactly as
 * the apps do. There is no separate "test build" of the business logic.
 */
module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['<rootDir>/jest.setup.js'],
  // The integration suite renders the whole app; on a cold Babel cache the
  // first render can exceed Jest's 5s default.
  testTimeout: 20000,
  testMatch: ['<rootDir>/__tests__/**/*.test.ts', '<rootDir>/__tests__/**/*.test.tsx'],
  transformIgnorePatterns: [
    'node_modules/(?!(?:@react-native|react-native|react-native-safe-area-context|zustand)/)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/index.ts',
    '!src/**/*.d.ts',
  ],
  coverageReporters: ['text-summary', 'lcov'],
};
