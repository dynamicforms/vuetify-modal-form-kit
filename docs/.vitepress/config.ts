import vuetify from 'vite-plugin-vuetify';
import { defineConfig } from 'vitepress';
import { crosslinksConfig } from 'vitepress-plugin-crosslinks';

import ssrCkeditorStub from './ssr-ckeditor-stub';

export default defineConfig({
  title: 'DynamicForms Vuetify modal form kit',
  description: 'One dialog onscreen at any one time plus a programmatic (vs template) form builder.',
  markdown: {
    config: crosslinksConfig({
      projects: {
        'vue-forms': 'https://docs.velis.si/dynamicforms/vue-forms',
        'vuetify-inputs': 'https://docs.velis.si/dynamicforms/vuetify-inputs',
      },
    }),
  },
  themeConfig: {
    logo: '/logo.png',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/' },
      { text: 'Examples', link: '/examples/' }
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Installation', link: '/guide/getting-started#installation' },
            { text: 'Basic Usage', link: '/guide/getting-started#basic-usage' },
          ]
        }
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' },
            { text: 'modal-view', link: '/api/modal-view' },
            { text: 'df-modal', link: '/api/df-modal' },
            { text: 'modal service', link: '/api/modal-service' },
            { text: 'FormBuilder', link: '/api/form-builder' },
          ]
        }
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'form builder - simple', link: '/examples/form-builder' },
            { text: 'form builder - responsive', link: '/examples/form-builder-responsive' },
            { text: 'modal', link: '/examples/dialog-basic' },
            { text: 'modal - template dialog', link: '/examples/dialog-template' },
          ]
        }
      ]
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/velis74/dynamicforms-vuetify-modal-form-kit' }
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025 Jure Erznožnik'
    }
  },
  vite: {
    plugins: [vuetify(), ssrCkeditorStub],
    optimizeDeps: {
      include: ['vuetify'],
    },
    ssr: {
      noExternal: [
        /vuetify/,
      ],
    }
  },
});

