import * as Form from '@dynamicforms/vue-forms';
import { Action, dfInputComponentsByTag, type DfInputComponentTag } from '@dynamicforms/vuetify-inputs';
import { mount } from '@vue/test-utils';
import { vi } from 'vitest';
import { h, nextTick, ref } from 'vue';
import { createVuetify } from 'vuetify';

import { FormBuilder } from '../core/form-layout';

import modal, { type CloseablePromise, currentModal, useDialog } from './api';
import ModalView from './df-api.component.vue';

const stubs = {
  DfModal: {
    props: ['modelValue', 'formControl', 'actions', 'title', 'size'],
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

  it('does not warn about a member that is sent nowhere, since it is not validated either', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const wrapper = mountView();
    const form = new Form.Group({
      name: new Form.Field({ value: '' }),
      address: new Form.Group({ city: new Form.Field({ value: '' }) }, { access: 'disabled' }),
    });

    const promise = modal.message('Details', 'fill this in', { form });
    await nextTick();

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();

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
      internalId: new Form.Field({ value: '', visibility: 'suppress' }),
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

  it('draws a field as the component it states, and as a df-input where it states none', async () => {
    const wrapper = mountView();
    const form = new Form.Group({
      name: new Form.Field({ value: '' }),
      active: new Form.Field({ value: false, component: 'df-checkbox' }),
    });

    const promise = modal.message('Details', 'fill this in', { form });
    await nextTick();

    const layout = wrapper.findComponent(stubs.FormRender).props('layout') as FormBuilder;
    const names = layout.toJSON().rows.map((row) => row.columns[0].components[0].name);
    expect(names).toEqual(['df-input', 'df-checkbox']);

    promise.close('close');
    await nextTick();
    await promise;
    wrapper.unmount();
  });

  it('lays out a field stating a tag the builder has no method for', async () => {
    const wrapper = mountView();
    // a tag @dynamicforms/vuetify-inputs draws with before VuetifyInputsComponentBuilder has a method for it
    const futureTag = 'df-list' as string as DfInputComponentTag;
    const form = new Form.Group({ lines: new Form.Field({ value: [], component: futureTag }) });

    const promise = modal.message('Details', 'fill this in', { form });
    await nextTick();

    const layout = wrapper.findComponent(stubs.FormRender).props('layout') as FormBuilder;
    expect(layout.toJSON().rows[0].columns[0].components[0].name).toBe('df-list');

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
    // the caller's name wins over the peer's component of the same name, and the rest of the peer's map is under
    // it - every tag of it, `df-label` and `df-input-hint` included
    expect(components['df-input']).toBe(Custom);
    expect(components['df-select']).toBeDefined();
    expect(Object.keys(components)).toEqual(expect.arrayContaining(Object.keys(dfInputComponentsByTag)));

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
    await currentModal.value!.props.drawn.actions.close.execute(null);
    await nextTick();
    expect(await promise).toBe('close');
    second.unmount();
  });

  it('draws what is written to the props of the open dialog', async () => {
    const wrapper = mountView();
    const promise = modal.message('Details', 'fill this in', { size: 'small' });
    await nextTick();
    const dialog = wrapper.findComponent(stubs.DfModal);
    expect(dialog.props('size')).toBe('small');

    promise.props.size = 'x-large';
    promise.props.title = 'Step 2';
    promise.props.actions = { ...promise.props.actions, save: new Action({ value: { label: 'Save' } }) };
    await nextTick();

    expect(dialog.props('size')).toBe('x-large');
    expect(dialog.props('title').resolvedText).toBe('Step 2');
    expect(wrapper.find('.df-actions').attributes('data-count')).toBe('2');

    promise.close('close');
    await nextTick();
    await promise;
    wrapper.unmount();
  });

  it('hands a component in the dialog body its own dialog', async () => {
    const seen: (CloseablePromise<string> | undefined)[] = [];
    const DialogPanel = {
      setup() {
        const dialog = useDialog();
        seen.push(dialog);
        return () => h('div', { class: 'dialog-panel' }, dialog?.props.size);
      },
    };
    // the real widget, which renders the panel the dialog's message names
    const wrapper = mount(ModalView, {
      global: { stubs: { ...stubs, MessagesWidget: false }, components: { DialogPanel }, plugins: [createVuetify()] },
    });

    const first = modal.custom('First', 'DialogPanel', {});
    await nextTick();
    const second = modal.custom('Second', 'DialogPanel', {});
    await nextTick();
    expect(seen).toEqual([first, second]);

    second.props.size = 'large';
    await nextTick();
    expect(wrapper.find('.dialog-panel').text()).toBe('large');

    second.close('close');
    await nextTick();
    await second;
    await nextTick();
    // the panel of the dialog underneath is set up again, with its own dialog
    expect(seen).toEqual([first, second, first]);

    first.close('close');
    await nextTick();
    await first;
    wrapper.unmount();
  });

  it('hands no dialog to a component outside one', () => {
    let seen: CloseablePromise<string> | undefined = undefined;
    mount({
      setup() {
        seen = useDialog();
        return () => null;
      },
    }).unmount();
    expect(seen).toBeUndefined();
  });

  describe('custom()', () => {
    async function settle(promise: CloseablePromise<string>) {
      promise.close('close');
      await nextTick();
      await promise;
    }

    it('renders a component given as such, with its props, without a global registration', async () => {
      const wrapper = mountView();
      const Panel = { props: ['userId'], setup: (props: any) => () => h('div', { class: 'panel' }, props.userId) };

      const promise = modal.custom('Settings', Panel, { userId: 42 });
      await nextTick();
      expect(wrapper.find('.panel').text()).toBe('42');

      await settle(promise);
      wrapper.unmount();
    });

    it("resolves a name against the dialog's components", async () => {
      const wrapper = mountView();
      const Panel = { setup: () => () => h('div', { class: 'named-panel' }) };

      const promise = modal.custom('Settings', 'NamedPanel', {}, { components: { NamedPanel: Panel } });
      await nextTick();
      expect(wrapper.find('.named-panel').exists()).toBe(true);

      await settle(promise);
      wrapper.unmount();
    });

    it('binds the refs of model both ways', async () => {
      const wrapper = mountView();
      const Picker = {
        props: ['contactId'],
        emits: ['update:contactId'],
        setup:
          (props: any, { emit }: any) =>
          () =>
            h(
              'button',
              { class: 'picker', onClick: () => emit('update:contactId', props.contactId + 1) },
              props.contactId,
            ),
      };
      const contactId = ref(1);

      const promise = modal.custom('Contact', Picker, {}, { model: { contactId } });
      await nextTick();
      expect(wrapper.find('.picker').text()).toBe('1');

      await wrapper.find('.picker').trigger('click');
      expect(contactId.value).toBe(2);
      await nextTick();
      expect(wrapper.find('.picker').text()).toBe('2');

      contactId.value = 7;
      await nextTick();
      expect(wrapper.find('.picker').text()).toBe('7');

      await settle(promise);
      wrapper.unmount();
    });
  });
});
