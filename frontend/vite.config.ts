import { defineConfig, type Plugin } from 'vite';
import path from 'path';

// The `css` package, which the HTML sanitizer uses to parse mail CSS, is a
// Node library. Its source-map support needs fs, path and url and only runs
// with `stringify(ast, { sourcemap: true })`, which the sanitizer never asks
// for. Swap it for an empty module so the source-map libraries stay out of
// the bundle.
const dropCssSourceMaps: Plugin = {
  name: 'drop-css-source-maps',
  enforce: 'pre',
  resolveId(source, importer) {
    if (source === './source-map-support' && importer?.includes('/node_modules/css/')) {
      return '\0css-source-map-support';
    }
  },
  load(id) {
    if (id === '\0css-source-map-support') {
      return 'module.exports = function () {};';
    }
  },
};

export default defineConfig({
  plugins: [dropCssSourceMaps],
  resolve: {
    alias: {
      'lit': path.resolve(import.meta.dirname, './node_modules/lit'),
      '@lit': path.resolve(import.meta.dirname, './node_modules/@lit'),
      'openpgp': path.resolve(import.meta.dirname, './node_modules/openpgp'),
      'rrule': path.resolve(import.meta.dirname, './node_modules/rrule')
    }
  },
  server: {
    proxy: {
      '^/(mailboxes|messages|quota|bimi|attachments|session|events|proxy|settings|accounts|password|webauthn|contacts|managesieve|gpg|calendar)': {
        target: 'http://localhost:1323',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('openpgp')) {
              return 'openpgp';
            }
            if (id.includes('@tiptap') || id.includes('prosemirror')) {
              return 'editor';
            }
            // Its own chunk, and not for tidiness: the emoji table is the
            // single largest dependency here, and it is reachable only from
            // the composer. Left in `vendor` it is welded to packages the
            // first paint DOES need, and a chunk is only as lazy as its
            // most eager member — so all of it shipped to every load.
            if (id.includes('unicode-emoji')) {
              return 'emoji';
            }
            if (id.includes('lit')) {
              return 'lit';
            }
            return 'vendor';
          }
        }
      }
    }
  }
});
