/// <reference types="vitest" />
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import eslint from 'vite-plugin-eslint';
import dts from 'vite-plugin-dts';
import { visualizer } from 'rollup-plugin-visualizer';

/** @type {import('vite').UserConfig} */
export default defineConfig({
  plugins: [
    vue(),
    {
      ...eslint({
        failOnWarning: false,
        failOnError: false,
      }),
      apply: 'serve',
      enforce: 'post',
    },
    dts({
      tsconfigPath: './tsconfig.build.json',
      rollupTypes: true
    }),
    visualizer({
      open: false,
      filename: 'coverage/stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '~': resolve(__dirname, '../../node_modules'),
    },
    extensions: [
      '.js',
      '.mjs',
      '.ts',
    ],
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'dynamicforms-vuetify-modal-form-kit',
    },
    rollupOptions: {
      external: [
        '@dynamicforms/vue-forms',
        '@dynamicforms/vuetify-inputs',
        'lodash-es',
        'vue',
        'vue-markdown-render',
        'vuetify',
        /^vuetify\/.*/,
      ],
    }
  },
  test: {
    // the artifact spec is not one of these: it loads dist/, which `npm test` runs before there is
    include: ['src/**/*.spec.ts'],
    coverage: {
      // istanbul, not v8: the v8 provider reports `ERR_INSPECTOR_NOT_CONNECTED` over this suite
      provider: 'istanbul',
      include: [
        'src/**/*'
      ],
      exclude: [
        '**/index.ts',
      ],
    },
    server: {
      deps: {
        inline: [/vuetify/]
      },
    },
    globals: true,
    environment: 'jsdom',
  },
});
