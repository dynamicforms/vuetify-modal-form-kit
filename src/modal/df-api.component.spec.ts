import * as Form from '@dynamicforms/vue-forms';
import { Action } from '@dynamicforms/vuetify-inputs';
import { mount } from '@vue/test-utils';
import { vi } from 'vitest';
import { nextTick } from 'vue';
import { createVuetify } from 'vuetify';

import { FormBuilder } from '../core/form-layout';

import modal from './api';
import ModalView from './df-api.component.vue';

const stubs = {
  DfModal: {
    props: ['modelValue', 'formControl', 'actions', 'title'],
    template: '<div class="df-modal" :data-open="String(modelValue)"><slot name="body" /><slot name="actions" /></div>',
  },
  DfActions: { props: ['actions'], template: '<div class="df-actions" :data-count="actions.length" />' },
  MessagesWidget: { template: '<span class="message" />' },
  FormRender: { props: ['layout', 'components'], template: '<div class="form-render" />' },
};

function mountView() {
  return mount(ModalView, { global: { stubs, plugins: [createVuetify()] } });
}

describe('ModalView', () => {
  it('reports the modal system as installed only while it is mounted', () => {
    expect(modal.isInstalled()).toBe(false);

    // the second instance warns; that warning is what this test sets up
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const first = mountView();
    const second = mountView();
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
    expect(modal.isInstalled()).toBe(true);

    // one instance leaving does not take the other one's registration with it
    second.unmount();
    expect(modal.isInstalled()).toBe(true);

    first.unmount();
    expect(modal.isInstalled()).toBe(false);
  });

  it('picks up a dialog that was opened before it mounted', async () => {
    const promise = modal.message('Already open', 'opened before mount');

    const wrapper = mountView();
    await nextTick();

    expect(wrapper.find('.df-modal').attributes('data-open')).toBe('true');
    expect(wrapper.find('.message').exists()).toBe(true);

    promise.close('close');
    await nextTick();
    await promise;
    wrapper.unmount();
  });

  it('renders a layout for the form fields and hands the actions to df-actions', async () => {
    const wrapper = mountView();
    const form = new Form.Group({
      name: new Form.Field({ value: '' }),
      close: new Action({ value: { label: 'Close' } }),
    });

    const promise = modal.message('Details', 'fill this in', { form });
    await nextTick();

    expect(wrapper.find('.form-render').exists()).toBe(true);
    // the Action member is a button, not a form field, so exactly one action reaches df-actions
    expect(wrapper.find('.df-actions').attributes('data-count')).toBe('1');

    promise.close('close');
    await nextTick();
    await promise;
    wrapper.unmount();
  });

  it('labels an input from the field, and falls back to the field name only where it carries none', async () => {
    const wrapper = mountView();
    const form = new Form.Group({
      // vuetify-inputs declares `label` on vue-forms' Extras, and a prop wins over what the element carries, so
      // a generated label would silently outrank this one
      fullName: new Form.Field({ value: '', label: 'Ime in priimek' }),
      vatId: new Form.Field({ value: '' }),
    });

    const promise = modal.message('Details', 'fill this in', { form });
    await nextTick();

    const layout = wrapper.findComponent(stubs.FormRender).props('layout') as FormBuilder;
    const labels = layout.toJSON().rows.map((row) => row.columns[0].components[0].props.label);
    expect(labels).toEqual(['Ime in priimek', 'Vat Id']);

    promise.close('close');
    await nextTick();
    await promise;
    wrapper.unmount();
  });

  it('warns about a form member it has no layout for, and leaves it out of the rendered set', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const wrapper = mountView();
    const form = new Form.Group({
      name: new Form.Field({ value: '' }),
      address: new Form.Group({ city: new Form.Field({ value: '' }) }),
    });

    const promise = modal.message('Details', 'fill this in', { form });
    await nextTick();

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('address'));
    // the nested group reaches neither the layout nor the actions
    expect(wrapper.find('.df-actions').attributes('data-count')).toBe('1');
    warn.mockRestore();

    promise.close('close');
    await nextTick();
    await promise;
    wrapper.unmount();
  });
});
