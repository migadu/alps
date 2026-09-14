import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // The same pinning as vite.config.ts. Plugin sources live in ../plugins,
  // outside this root, and would otherwise resolve `lit` against a
  // node_modules that does not exist beside them.
  resolve: {
    alias: {
      lit: path.resolve(__dirname, './node_modules/lit'),
      '@lit': path.resolve(__dirname, './node_modules/@lit'),
      openpgp: path.resolve(__dirname, './node_modules/openpgp'),
      rrule: path.resolve(__dirname, './node_modules/rrule'),
    },
  },
  // Vite's dev server refuses to read outside the inferred root, which would
  // fail any test importing a plugin file with "Denied ID".
  server: { fs: { allow: ['..'] } },
  test: {
    // jsdom rather than a browser: these tests pin logic and render decisions,
    // not layout or paint.
    environment: 'jsdom',
    include: ['test/**/*.test.ts'],
    setupFiles: ['test/helpers/setup.ts'],
  },
});
