import * as Form from '@dynamicforms/vue-forms';
import { Action } from '@dynamicforms/vuetify-inputs';
import { mount } from '@vue/test-utils';
import { vi } from 'vitest';
import { computed, defineComponent, h, nextTick, ref, watch } from 'vue';
import { createVuetify } from 'vuetify';

import { DfModal, modal, ModalView } from '../index';

// a settled dialog's promise resolves from a nextTick callback, so one flush is not enough to see it settle
async function settled<T>(promise: Promise<T>): Promise<T> {
  await nextTick();
  await nextTick();
  return promise;
}

// what Vuetify renders is stubbed; <df-modal> and <modal-view> themselves are the real components
const stubs = {
  VDialog: { props: ['modelValue'], template: '<div class="dialog" :data-shown="String(modelValue)"><slot /></div>' },
  VCard: { template: '<div><slot /></div>' },
  VCardTitle: { template: '<div><slot /></div>' },
  VCardText: { template: '<div><slot /></div>' },
  VCardActions: { template: '<div><slot /></div>' },
  VSheet: { template: '<div><slot /></div>' },
  VIcon: { template: '<i />' },
  VBtn: { template: '<button><slot /></button>' },
  DfActions: { props: ['actions'], template: '<div class="df-actions" />' },
  MessagesWidget: { template: '<span class="message" />' },
  FormRender: { props: ['layout', 'components'], template: '<div class="form-render" />' },
};

function mountWithStubs(component: any, props?: Record<string, any>) {
  return mount(component, { props, global: { stubs, plugins: [createVuetify()] } });
}

// a template-driven dialog: <df-modal v-model="shown"> in an app component
function mountTemplateDialog(initiallyShown: boolean) {
  const shown = ref(initiallyShown);
  const Host = defineComponent({
    setup() {
      return () =>
        h(DfModal, {
          modelValue: shown.value,
          'onUpdate:modelValue': (value: boolean) => {
            shown.value = value;
          },
        });
    },
  });
  const wrapper = mountWithStubs(Host);
  return { shown, wrapper };
}

describe('modal.openCount', () => {
  // dialogs opened while no <modal-view> is mounted warn about it; <df-modal> may log while it is stubbed
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is 0 when no dialog is open', () => {
    expect(modal.openCount).toBe(0);
  });

  it('counts a dialog opened with message(), yesNo() or custom() until it settles', async () => {
    const message = modal.message('Done', 'Your changes have been saved.');
    expect(modal.openCount).toBe(1);
    message.close('close');
    await settled(message);
    expect(modal.openCount).toBe(0);

    const yesNo = modal.yesNo('Delete item', 'Continue?');
    expect(modal.openCount).toBe(1);
    yesNo.close('no');
    await settled(yesNo);
    expect(modal.openCount).toBe(0);

    const custom = modal.custom('Settings', 'MySettingsPanel', { userId: 42 });
    expect(modal.openCount).toBe(1);
    custom.close('close');
    await settled(custom);
    expect(modal.openCount).toBe(0);
  });

  it('counts every dialog on the stack, not only the one on top', async () => {
    const first = modal.message('First', 'first');
    const second = modal.yesNo('Second', 'second');
    const third = modal.custom('Third', 'MySettingsPanel', {});
    expect(modal.openCount).toBe(3);

    third.close('close');
    await settled(third);
    expect(modal.openCount).toBe(2);

    second.close('yes');
    await settled(second);
    expect(modal.openCount).toBe(1);

    first.close('close');
    await settled(first);
    expect(modal.openCount).toBe(0);
  });

  it('drops a dialog settled from under the top one', async () => {
    const lower = modal.message('Lower', 'lower');
    const upper = modal.message('Upper', 'upper');

    lower.close('cancelled');
    await settled(lower);
    expect(modal.openCount).toBe(1);
    expect(modal.isTop(upper)).toBe(true);

    upper.close('close');
    await settled(upper);
    expect(modal.openCount).toBe(0);
  });

  it('drops a dialog settled by one of its actions', async () => {
    const submit = new Action({ value: { label: 'Send', defaultConfirm: true } });
    const form = new Form.Group({ email: new Form.Field({ value: '' }), submit });

    const dialog = modal.message('Subscribe', 'Enter your email address:', { form });
    expect(modal.openCount).toBe(1);

    await submit.execute(null);
    expect(await settled(dialog)).toBe('submit');
    expect(modal.openCount).toBe(0);
  });

  it('keeps counting a dialog whose action refused to close it', async () => {
    const submit = new Action({ value: { label: 'Send' } });
    submit.registerAction(
      new Form.ExecuteAction(() => {
        throw new Form.AbortEventHandlingException('not yet');
      }),
    );
    const form = new Form.Group({ submit });

    const dialog = modal.message('Subscribe', 'Enter your email address:', { form });
    await submit.execute(null);
    await nextTick();
    await nextTick();
    expect(modal.openCount).toBe(1);

    dialog.close('cancelled');
    await settled(dialog);
    expect(modal.openCount).toBe(0);
  });

  it('does not count a dialog twice down when it is closed again after it settled', async () => {
    const kept = modal.message('Kept', 'kept');
    const dialog = modal.message('Once', 'once');

    dialog.close('close');
    await settled(dialog);
    dialog.close('again');
    await settled(dialog);

    expect(modal.openCount).toBe(1);

    kept.close('close');
    await settled(kept);
    expect(modal.openCount).toBe(0);
  });

  it('counts the dialogs opened while no <modal-view> is mounted', async () => {
    expect(modal.isInstalled()).toBe(false);

    const first = modal.message('First', 'first');
    const second = modal.message('Second', 'second');
    expect(modal.openCount).toBe(2);

    second.close('close');
    first.close('close');
    await settled(Promise.all([first, second]));
    expect(modal.openCount).toBe(0);
  });

  it('counts a dialog once while <modal-view> draws it', async () => {
    const view = mountWithStubs(ModalView);
    expect(modal.openCount).toBe(0);

    const dialog = modal.message('Drawn', 'drawn by the view');
    await nextTick();
    // the view draws it with a <df-modal> whose v-model is true: still one dialog
    expect(view.findAll('.dialog').some((d) => d.attributes('data-shown') === 'true')).toBe(true);
    expect(modal.openCount).toBe(1);

    const nested = modal.yesNo('Nested', 'on top');
    await nextTick();
    expect(modal.openCount).toBe(2);

    nested.close('no');
    await settled(nested);
    expect(modal.openCount).toBe(1);

    dialog.close('close');
    await settled(dialog);
    expect(modal.openCount).toBe(0);

    view.unmount();
  });

  it('keeps the count of a dialog opened before <modal-view> mounts and after it unmounts', async () => {
    const dialog = modal.message('Early', 'opened before mount');
    expect(modal.openCount).toBe(1);

    const view = mountWithStubs(ModalView);
    await nextTick();
    expect(modal.openCount).toBe(1);

    view.unmount();
    await nextTick();
    // the dialog stays on the stack until it settles
    expect(modal.openCount).toBe(1);

    dialog.close('close');
    await settled(dialog);
    expect(modal.openCount).toBe(0);
  });

  it('counts a <df-modal> used directly while its v-model is true', async () => {
    const { shown, wrapper } = mountTemplateDialog(true);
    await nextTick();
    expect(modal.openCount).toBe(1);

    shown.value = false;
    await nextTick();
    expect(modal.openCount).toBe(0);

    shown.value = true;
    await nextTick();
    expect(modal.openCount).toBe(1);

    wrapper.unmount();
    await nextTick();
    expect(modal.openCount).toBe(0);
  });

  it('does not count a <df-modal> used directly whose v-model is false', async () => {
    const { wrapper } = mountTemplateDialog(false);
    await nextTick();
    expect(modal.openCount).toBe(0);

    wrapper.unmount();
    await nextTick();
    expect(modal.openCount).toBe(0);
  });

  it('drops a <df-modal> used directly when it closes itself through its v-model', async () => {
    const { shown, wrapper } = mountTemplateDialog(true);
    await nextTick();
    expect(modal.openCount).toBe(1);

    // the dialog asks to close (e.g. outside click): the host's v-model follows
    wrapper.findComponent(stubs.VDialog).vm.$emit('update:model-value', false);
    await nextTick();
    expect(shown.value).toBe(false);
    expect(modal.openCount).toBe(0);

    wrapper.unmount();
  });

  it('adds the <df-modal> dialogs used directly to the ones the service opened', async () => {
    const first = mountTemplateDialog(true);
    const second = mountTemplateDialog(true);
    const hidden = mountTemplateDialog(false);
    await nextTick();
    expect(modal.openCount).toBe(2);

    const dialog = modal.message('Service', 'from code');
    expect(modal.openCount).toBe(3);

    hidden.shown.value = true;
    await nextTick();
    expect(modal.openCount).toBe(4);

    first.shown.value = false;
    await nextTick();
    expect(modal.openCount).toBe(3);

    dialog.close('close');
    await settled(dialog);
    expect(modal.openCount).toBe(2);

    second.wrapper.unmount();
    hidden.wrapper.unmount();
    first.wrapper.unmount();
    await nextTick();
    expect(modal.openCount).toBe(0);
  });

  it('re-evaluates a computed that reads it when a dialog opens or closes', async () => {
    const anyOpen = computed(() => modal.openCount > 0);
    const count = computed(() => modal.openCount);
    expect(anyOpen.value).toBe(false);
    expect(count.value).toBe(0);

    const first = modal.message('First', 'first');
    expect(anyOpen.value).toBe(true);
    expect(count.value).toBe(1);

    const second = modal.message('Second', 'second');
    expect(count.value).toBe(2);

    second.close('close');
    await settled(second);
    expect(count.value).toBe(1);

    first.close('close');
    await settled(first);
    expect(count.value).toBe(0);
    expect(anyOpen.value).toBe(false);
  });

  it('triggers a watch that reads it on every open and close', async () => {
    const seen: number[] = [];
    const stop = watch(
      () => modal.openCount,
      (value) => seen.push(value),
      { flush: 'sync' },
    );

    const first = modal.message('First', 'first');
    const second = modal.yesNo('Second', 'second');
    second.close('no');
    await settled(second);
    first.close('close');
    await settled(first);

    const { shown, wrapper } = mountTemplateDialog(true);
    await nextTick();
    shown.value = false;
    await nextTick();

    expect(seen).toEqual([1, 2, 1, 0, 1, 0]);

    stop();
    wrapper.unmount();
  });

  it('re-renders a render function that reads it', async () => {
    const Counter = defineComponent({ render: () => h('span', { class: 'count' }, String(modal.openCount)) });
    const counter = mount(Counter);
    expect(counter.text()).toBe('0');

    const dialog = modal.message('Open', 'open');
    await nextTick();
    expect(counter.text()).toBe('1');

    const { shown, wrapper } = mountTemplateDialog(true);
    await nextTick();
    expect(counter.text()).toBe('2');

    shown.value = false;
    await nextTick();
    expect(counter.text()).toBe('1');

    dialog.close('close');
    await settled(dialog);
    expect(counter.text()).toBe('0');

    wrapper.unmount();
    counter.unmount();
  });

  it('cannot be written', async () => {
    const dialog = modal.message('Open', 'open');

    expect(() => {
      (modal as any).openCount = 5;
    }).toThrow(TypeError);
    expect(modal.openCount).toBe(1);

    dialog.close('close');
    await settled(dialog);
    expect(modal.openCount).toBe(0);
  });
});
