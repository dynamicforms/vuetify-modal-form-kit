import { App } from 'vue';

import * as Components from './dynamicforms-components';
import * as VuetifyComponents from './vuetify-components';

export * from './core';
export * from './layout';
export * from './modal';

export interface DynamicFormsModalFormKitOptions {
  registerComponents: boolean;
  registerVuetifyComponents: boolean;
}

export const DynamicFormsModalFormKit = {
  install: (app: App, options?: Partial<DynamicFormsModalFormKitOptions>) => {
    if (options?.registerComponents ?? false) {
      Object.entries(Components).map(([name, component]) => app.component(name, component));
    }
    if (options?.registerVuetifyComponents ?? false) {
      Object.entries(VuetifyComponents).map(([name, component]) => {
        try {
          return app.component(name, component);
        } catch (error: any) {
          if (!error.message.includes('already registered')) {
            throw error;
          }
        }
        return null;
      });
    }
  },
};
