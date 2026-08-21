import * as Form from '@dynamicforms/vue-forms';
import { Action } from '@dynamicforms/vuetify-inputs';
import { mount } from '@vue/test-utils';
import { vi } from 'vitest';
import { nextTick } from 'vue';
import { createVuetify } from 'vuetify';

import { FormBuilder } from '../core/form-layout';

import modal, { currentModal } from './api';
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

// A view that draws its dialog with the real <df-modal>, with what Vuetify renders stubbed instead. What a
// <df-modal> does to the dialog stack as it mounts and unmounts is the subject of the cases below, and a stubbed
// one does none of it.
const modalStubs = {
  VDialog: { props: ['modelValue'], template: '<div class="dialog" :data-shown="String(modelValue)"><slot /></div>' },
  VCard: { template: '<div><slot /></div>' },
  VCardTitle: { template: '<div><slot /></div>' },
  VCardText: { template: '<div><slot /></div>' },
  VCardActions: { template: '<div><slot /></div>' },
  VSheet: { template: '<div><slot /></div>' },
  VIcon: { template: '<i />' },
  VBtn: { template: '<button><slot /></button>' },
  DfActions: stubs.DfActions,
  MessagesWidget: stubs.MessagesWidget,
  FormRender: stubs.FormRender,
};

function mountView() {
  return mount(ModalView, { global: { stubs, plugins: [createVuetify()] } });
}

function mountViewWithModal() {
  return mount(ModalView, { global: { stubs: modalStubs, plugins: [createVuetify()] } });
}

function shownDialogs(wrapper: ReturnType<typeof mountViewWithModal>) {
  return wrapper.findAll('.dialog').filter((dialog) => dialog.attributes('data-shown') === 'true').length;
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
    const labels = layout.toJSON().rows.map((row) => row.columns[0].components[0].props?.label);
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

  it('leaves a suppressed member out of the layout it generates', async () => {
    const wrapper = mountView();
    const form = new Form.Group({
      name: new Form.Field({ value: '' }),
      internalId: new Form.Field({ value: '', visibility: Form.DisplayMode.SUPPRESS }),
    });

    const promise = modal.message('Details', 'fill this in', { form });
    await nextTick();

    // a suppressed field draws nothing, so a row of its own would be an empty gutter gap
    const layout = wrapper.findComponent(stubs.FormRender).props('layout') as FormBuilder;
    const labels = layout.toJSON().rows.map((row) => row.columns[0].components[0].props?.label);
    expect(labels).toEqual(['Name']);

    promise.close('close');
    await nextTick();
    await promise;
    wrapper.unmount();
  });

  it('resolves a component the caller named over the ones it supplies', async () => {
    const wrapper = mountView();
    const Custom = { name: 'CustomPanel', template: '<div class="custom-panel" />' };
    const form = new Form.Group({ name: new Form.Field({ value: '' }) });

    const promise = modal.message('Details', 'fill this in', { form, components: { 'df-input': Custom } });
    await nextTick();

    const components = wrapper.findComponent(stubs.FormRender).props('components') as Record<string, unknown>;
    // the caller's name wins over the built-in of the same name, and the rest of the built-in map is under it
    expect(components['df-input']).toBe(Custom);
    expect(components['df-select']).toBeDefined();

    promise.close('close');
    await nextTick();
    await promise;
    wrapper.unmount();
  });

  it('draws the dialog in one view, whatever is mounted', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const first = mountViewWithModal();
    const second = mountViewWithModal();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('renders nothing'));
    warn.mockRestore();

    const promise = modal.message('Once over', 'one dialog, two views');
    await nextTick();

    // one stack is drawn by one view: the second renders nothing, which is what its mount warning announces
    expect(shownDialogs(first)).toBe(1);
    expect(shownDialogs(second)).toBe(0);

    // and the one still up takes the drawing over when the one that had it leaves
    first.unmount();
    await nextTick();
    expect(shownDialogs(second)).toBe(1);

    promise.close('close');
    await nextTick();
    await promise;
    second.unmount();
  });

  it('leaves an api-owned dialog on the stack when the view drawing it unmounts', async () => {
    const first = mountViewWithModal();
    const promise = modal.message('Still here', 'the view goes away under it');
    await nextTick();
    expect(shownDialogs(first)).toBe(1);

    first.unmount();
    await nextTick();

    // the dialog belongs to the api, which holds its definition and its unsettled promise, so the stack entry
    // outlives the <df-modal> that drew it
    expect(currentModal.value!.dialogId).toBe(promise.dialogId);

    const second = mountViewWithModal();
    await nextTick();
    expect(shownDialogs(second)).toBe(1);

    // and it is the dialog it was: the action it opened with still settles the promise the caller holds
    await currentModal.value!.actions!.close.execute(null);
    await nextTick();
    expect(await promise).toBe('close');
    second.unmount();
  });
});
