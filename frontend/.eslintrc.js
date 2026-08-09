module.exports = {
  root: true,
  extends: '@react-native',

  // Build output, native projects and vendored code are not ours to lint.
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'release/',
    'coverage/',
    'ios/',
    'android/',
    'vendor/',
  ],

  rules: {
    /*
     * `void somePromise()` is the explicit way to say "this is fire-and-forget,
     * and that is deliberate" — clearer than an empty `.catch()` and easier to
     * spot in review than a bare floating promise.
     */
    'no-void': 'off',

    /*
     * Styles in this codebase are derived from the active theme and from
     * interaction state, so they cannot be hoisted into a static
     * `StyleSheet.create` block. The rule targets hard-coded literals, which
     * the design system already prevents — components reference semantic
     * tokens, never raw values.
     */
    'react-native/no-inline-styles': 'off',
  },

  overrides: [
    {
      // Node-side tooling: the Electron main process, the API, and scripts.
      files: [
        'electron/**/*.js',
        'scripts/**/*.js',
        'server/**/*.js',
        '*.config.js',
        'jest.setup.js',
      ],
      env: { node: true, browser: false },
      rules: {
        'no-undef': 'off',
      },
    },
    {
      files: ['__tests__/**/*.{ts,tsx}'],
      env: { jest: true },
    },
  ],
};
