import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'DynamicForms Vuetify modal form kit',
  description: 'One dialog onscreen at any one time plus a programmatic (vs template) form builder.',
  themeConfig: {
    logo: '/logo.png',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/examples/index' }
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
      '/examples/': [
        {
          text: 'API with Examples',
          items: [
            { text: 'form builder - simple', link: '/examples/form-builder' },
            { text: 'form builder - responsive', link: '/examples/form-builder-responsive' },
            { text: 'modal', link: '/examples/dialog-basic' },
          ]
        }
      ]
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/velis74/dynamicforms-vuetify-inputs' }
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025 Jure Erznožnik'
    }
  }
});

