/// <reference types="vitest" />
import { defineConfig } from 'vite';

// The artifact check, kept out of `npm test`: it loads dist/, which does not exist until `npm run build`.
export default defineConfig({
  test: {
    include: ['scripts/verify-artifact.spec.mjs'],
    globals: true,
    environment: 'jsdom',
    // the artifact drags in its peers, CKEditor among them, and transforming them costs more than the default
    testTimeout: 60000,
    hookTimeout: 60000,
    server: {
      deps: {
        inline: [/vuetify/],
      },
    },
  },
});
