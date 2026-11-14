/// <reference types="vitest" />
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { visualizer } from 'rollup-plugin-visualizer';

/** @type {import('vite').UserConfig} */
export default defineConfig({
  plugins: [
    vue(),
    dts({
      tsconfigPath: './tsconfig.build.json',
      rollupTypes: true,
      // fails the build when the generated declarations import a type by a node_modules path,
      // which does not resolve in a consumer's installation
      afterBuild: (emittedFiles) => {
        const paths = [...emittedFiles]
          .filter(([file]) => /\.d\.[cm]?ts$/.test(file))
          .flatMap(([, content]) => content.match(/(?:from |import\()['"][^'"]*node_modules[^'"]*['"]/g) ?? []);
        if (paths.length) throw new Error(`declarations import from node_modules paths: ${paths.join(', ')}`);
      },
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
      '@': resolve(import.meta.dirname, './src'),
      '~': resolve(import.meta.dirname, '../../node_modules'),
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
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'dynamicforms-vuetify-modal-form-kit',
    },
    rollupOptions: {
      external: [
        '@dynamicforms/translatable',
        '@dynamicforms/vue-forms',
        '@dynamicforms/vuetify-inputs',
        'lodash-es',
        'vue',
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
