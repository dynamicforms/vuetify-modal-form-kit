import { DynamicFormsInputs } from '@dynamicforms/vuetify-inputs';
import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { DynamicFormsModalFormKit } from '../../../src';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    const vuetify = createVuetify({
      components,
      directives,
      theme: {
        defaultTheme: 'light'
      }
    })

    app.use(vuetify);
    app.use(DynamicFormsModalFormKit);
    app.use(DynamicFormsInputs, { registerComponents: true });
  },
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // lahko dodamo custom slote za layout, če bo potrebno
    })
  }
} satisfies Theme
