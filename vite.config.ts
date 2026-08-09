import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Desktop bundler configuration.
 *
 * Two lines do all the cross-platform work:
 *  - the `react-native` → `react-native-web` alias, so every shared component
 *    renders to DOM primitives instead of native views;
 *  - the `.web.*` resolver priority, which is how the *driven adapters*
 *    (storage, keyboard shortcuts) get swapped without any code branching.
 */
export default defineConfig(({ mode }) => ({
  // Relative base so the production bundle also loads over `file://`
  // inside the packaged Electron app.
  base: './',

  plugins: [react()],

  resolve: {
    alias: {
      'react-native': 'react-native-web',
    },
    extensions: [
      '.web.tsx',
      '.web.ts',
      '.web.jsx',
      '.web.js',
      '.tsx',
      '.ts',
      '.jsx',
      '.js',
      '.json',
    ],
  },

  define: {
    // React Native's development flag, and a `process.env` shim for libraries
    // that expect Node globals.
    __DEV__: JSON.stringify(mode !== 'production'),
    global: 'globalThis',
    'process.env': {},
  },

  optimizeDeps: {
    esbuildOptions: {
      resolveExtensions: ['.web.js', '.web.ts', '.web.tsx', '.js', '.ts', '.tsx'],
      // Some React Native packages ship JSX inside `.js` files.
      loader: { '.js': 'jsx' },
    },
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020',
    sourcemap: mode !== 'production',
  },

  server: {
    port: 5173,
    strictPort: true,
  },
}));
