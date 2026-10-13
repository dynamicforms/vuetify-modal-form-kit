// @vitest-environment node
import { renderToString } from '@vue/server-renderer';
import { describe, expect, it, vi } from 'vitest';
import { createSSRApp, h, type Component } from 'vue';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

import { DfModal, DynamicFormsModalFormKit, FormBuilder, FormRender, modal, ModalView } from '@/index';

function render(
  component: Component,
  props: Record<string, unknown> = {},
  ssr: boolean | { clientWidth: number } = true,
) {
  const app = createSSRApp({ render: () => h(component, props, { title: () => 'Title', body: () => 'Body' }) });
  app.use(createVuetify({ ssr, components, directives }));
  app.use(DynamicFormsModalFormKit);
  return renderToString(app);
}

function responsiveLayout() {
  const form = new FormBuilder();
  form.simple().generic('span', { class: 'base' });
  form.breakpoint('md', (bp) => {
    bp.simple().generic('span', { class: 'md' });
    return bp;
  });
  return form;
}

describe('server-side rendering', () => {
  it('renders the base layout where Vuetify is given no client width', async () => {
    const html = await render(FormRender, { layout: responsiveLayout() });

    expect(html).toContain('class="base"');
    expect(html).not.toContain('class="md"');
  });

  it('renders the layout of the breakpoint of the client width Vuetify is given', async () => {
    const html = await render(FormRender, { layout: responsiveLayout() }, { clientWidth: 1000 });

    expect(html).toContain('class="md"');
    expect(html).not.toContain('class="base"');
  });

  it('renders no dialog of the modal service', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const dialog = modal.message('Server dialog', 'Body');
    try {
      expect(await render(ModalView)).not.toContain('Server dialog');
    } finally {
      dialog.close('close');
      warn.mockRestore();
    }
  });

  it('renders no template dialog', async () => {
    expect(await render(DfModal, { modelValue: true })).not.toContain('Title');
  });
});
