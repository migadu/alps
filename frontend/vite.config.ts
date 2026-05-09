import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      'lit': path.resolve(__dirname, './node_modules/lit'),
      '@lit': path.resolve(__dirname, './node_modules/@lit')
    }
  },
  server: {
    proxy: {
      '^/(mailboxes|messages|bimi|attachments|session|proxy|settings|accounts|password|webauthn|contacts)': {
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
            if (id.includes('@tiptap') || id.includes('prosemirror')) {
              return 'editor';
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
