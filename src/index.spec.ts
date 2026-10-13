import { createApp } from 'vue';

import * as VuetifyComponents from './vuetify-components';

import { DynamicFormsModalFormKit } from '@/index';

describe('DynamicFormsModalFormKit', () => {
  it('registers the Vuetify components the app has not registered, and keeps those it has', () => {
    const own = { name: 'OwnBtn', render: () => null };
    const app = createApp({ render: () => null });
    app.component('VBtn', own);

    app.use(DynamicFormsModalFormKit, { registerVuetifyComponents: true });

    expect(app.component('VBtn')).toBe(own);
    expect(app.component('VCard')).toBe(VuetifyComponents.VCard);
  });
});
