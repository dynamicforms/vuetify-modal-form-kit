import { DisplayMode, ExecuteAction } from '@dynamicforms/vue-forms';
import { Action } from '@dynamicforms/vuetify-inputs';
import { mount } from '@vue/test-utils';
import { vi } from 'vitest';
import { createVuetify } from 'vuetify';

import DfModal from './df-modal.component.vue';
import dialogTracker from './top-modal-tracker';

const stubs = {
  VDialog: {
    props: ['modelValue'],
    template: '<div class="dialog" :data-shown="String(modelValue)"><slot /></div>',
  },
  VCard: { template: '<div><slot /></div>' },
  VCardTitle: { template: '<div><slot /></div>' },
  VCardText: { template: '<div><slot /></div>' },
  VCardActions: { template: '<div><slot /></div>' },
  VSheet: { template: '<div><slot /></div>' },
  VIcon: { template: '<i />' },
  VBtn: { template: '<button><slot /></button>' },
  MessagesWidget: { template: '<span />' },
};

interface ModalProps {
  modelValue: boolean;
  dialogId?: symbol;
  actions?: Action[];
}

function mountModal(props: ModalProps) {
  return mount(DfModal, { props, global: { stubs, plugins: [createVuetify()] } });
}

function isShown(wrapper: ReturnType<typeof mountModal>) {
  return wrapper.find('.dialog').attributes('data-shown') === 'true';
}

function actionWithSpy(value: Record<string, any>) {
  const action = new Action({ value });
  const spy = vi.fn();
  action.registerAction(
    new ExecuteAction((field, supr, ...params) => {
      spy();
      return supr(field, ...params);
    }),
  );
  return { action, spy };
}

function press(key: string, target?: HTMLElement) {
  (target ?? document.body).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

describe('DfModal', () => {
  it('follows a dialogId that changes while it stays mounted', async () => {
    const first = Symbol('first');
    const second = Symbol('second');
    dialogTracker.push(first);

    const wrapper = mountModal({ modelValue: true, dialogId: first });
    expect(isShown(wrapper)).toBe(true);

    // <modal-view> keeps one <df-modal> alive and swaps dialogId when the next dialog becomes the top one
    dialogTracker.push(second);
    await wrapper.setProps({ dialogId: second });
    expect(isShown(wrapper)).toBe(true);

    // the dialog underneath the top one is suspended, not closed
    await wrapper.setProps({ dialogId: first });
    expect(isShown(wrapper)).toBe(false);

    dialogTracker.remove(second);
    dialogTracker.remove(first);
    wrapper.unmount();
  });

  describe('keyboard shortcuts', () => {
    let dialogId: symbol;

    beforeEach(() => {
      dialogId = Symbol('kbd');
      dialogTracker.push(dialogId);
    });

    afterEach(() => {
      dialogTracker.remove(dialogId);
    });

    it('executes the defaultConfirm action on Enter and the defaultReject one on Esc', () => {
      const confirm = actionWithSpy({ label: 'Save', defaultConfirm: true });
      const reject = actionWithSpy({ label: 'Cancel', defaultReject: true });

      const wrapper = mountModal({ modelValue: true, dialogId, actions: [confirm.action, reject.action] });

      press('Enter');
      expect(confirm.spy).toHaveBeenCalledTimes(1);

      press('Escape');
      expect(reject.spy).toHaveBeenCalledTimes(1);

      wrapper.unmount();
    });

    it('leaves Enter alone inside a textarea', () => {
      const confirm = actionWithSpy({ label: 'Save', defaultConfirm: true });
      const wrapper = mountModal({ modelValue: true, dialogId, actions: [confirm.action] });

      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      press('Enter', textarea);
      textarea.remove();

      expect(confirm.spy).not.toHaveBeenCalled();
      wrapper.unmount();
    });

    it('does not reach an action the user could not click', () => {
      const disabled = actionWithSpy({ label: 'Save', defaultConfirm: true });
      disabled.action.enabled = false;
      const hidden = actionWithSpy({ label: 'Cancel', defaultReject: true });
      hidden.action.visibility = DisplayMode.HIDDEN;

      const wrapper = mountModal({ modelValue: true, dialogId, actions: [disabled.action, hidden.action] });

      press('Enter');
      press('Escape');

      expect(disabled.spy).not.toHaveBeenCalled();
      expect(hidden.spy).not.toHaveBeenCalled();
      wrapper.unmount();
    });

    it('stops listening once unmounted', () => {
      const confirm = actionWithSpy({ label: 'Save', defaultConfirm: true });
      mountModal({ modelValue: true, dialogId, actions: [confirm.action] }).unmount();

      press('Enter');
      expect(confirm.spy).not.toHaveBeenCalled();
    });
  });
});
