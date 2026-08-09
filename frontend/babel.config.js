module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    /*
     * Metro has no `process.env` inlining of its own, so without this the
     * data-source switch would only work on the desktop build (where Vite's
     * `define` handles it). The allow-list is explicit — nothing else from
     * the build environment can leak into the bundle.
     */
    [
      'transform-inline-environment-variables',
      { include: ['TASKBOARD_DATA_SOURCE', 'TASKBOARD_API_URL'] },
    ],
  ],
};
