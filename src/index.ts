import { App } from 'vue';

import * as Components from './dynamicforms-components';
import { type DfModalDefaults, type ModalTranslationSettings, setDfModalDefaults } from './modal';
import { modalTranslationSettingsKey } from './modal/translations';
import * as VuetifyComponents from './vuetify-components';

export * from './core';
export * from './layout';
export * from './modal';

export interface DynamicFormsModalFormKitOptions extends ModalTranslationSettings {
  registerComponents: boolean;
  registerVuetifyComponents: boolean;
  modalDefaults: Partial<DfModalDefaults>;
}

export const DynamicFormsModalFormKit = {
  install: (app: App, options?: Partial<DynamicFormsModalFormKitOptions>) => {
    if (options?.registerComponents ?? false) {
      Object.entries(Components).forEach(([name, component]) => app.component(name, component));
    }
    if (options?.registerVuetifyComponents ?? false) {
      // a component the app has registered under the same name keeps its registration
      Object.entries(VuetifyComponents).forEach(([name, component]) => {
        if (!app.component(name)) app.component(name, component);
      });
    }
    if (options?.modalDefaults) setDfModalDefaults(options.modalDefaults);
    app.provide(modalTranslationSettingsKey, {
      translate: options?.translate,
      translateNamespace: options?.translateNamespace,
    });
  },
};
