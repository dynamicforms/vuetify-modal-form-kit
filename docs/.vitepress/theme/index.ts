import { DynamicFormsInputs } from '@dynamicforms/vuetify-inputs';
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { DynamicFormsModalFormKit } from '../../../src';
import '@dynamicforms/vuetify-inputs/styles.css';

import { errorText } from './error-text';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    const vuetify = createVuetify({
      ssr: true,
      components,
      directives,
      theme: {
        defaultTheme: 'light'
      }
    })

    app.use(vuetify);
    app.use(DynamicFormsModalFormKit);
    app.use(DynamicFormsInputs, { registerComponents: true, errorText });
  },
} satisfies Theme
