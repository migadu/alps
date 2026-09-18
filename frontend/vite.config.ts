import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      'lit': path.resolve(__dirname, './node_modules/lit'),
      '@lit': path.resolve(__dirname, './node_modules/@lit'),
      'openpgp': path.resolve(__dirname, './node_modules/openpgp'),
      'rrule': path.resolve(__dirname, './node_modules/rrule')
    }
  },
  server: {
    proxy: {
      '^/(mailboxes|messages|bimi|attachments|session|proxy|settings|accounts|password|webauthn|contacts|managesieve|gpg|calendar)': {
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
