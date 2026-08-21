import { AbortEventHandlingException, DisplayMode, ExecuteAction, Group } from '@dynamicforms/vue-forms';
import { Action } from '@dynamicforms/vuetify-inputs';
import { mount } from '@vue/test-utils';
import { vi } from 'vitest';
import { nextTick } from 'vue';
import { createVuetify } from 'vuetify';
import * as vuetifyComponents from 'vuetify/components';

import DfModal from './df-modal.component.vue';
import DialogSize from './dialog-size';
import dialogTracker from './top-modal-tracker';

const stubs = {
  VDialog: {
    props: ['modelValue', 'width', 'fullscreen'],
    template:
      '<div class="dialog" :data-shown="String(modelValue)" :data-width="String(width)"' +
      ' :data-fullscreen="String(fullscreen)"><slot /></div>',
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
  size?: DialogSize;
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

// Vuetify teleports an overlay into .v-overlay-container and orders the ones on screen by the z-index its stack
// hands out. The VDialog stub renders none of that, so the dialog's own overlay is one of the elements built here.
function openOverlay(className: string, zIndex: number) {
  let container = document.querySelector('.v-overlay-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'v-overlay-container';
    document.body.appendChild(container);
  }
  const overlay = document.createElement('div');
  overlay.className = `v-overlay v-overlay--active ${className}`;
  overlay.style.zIndex = String(zIndex);
  container.appendChild(overlay);
  return overlay;
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

  it('re-emits a close that comes from the dialog itself and drops it off the stack', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    // no dialogId: a template-driven dialog, the one whose stack entry <df-modal> owns
    const wrapper = mountModal({ modelValue: true });
    expect(isShown(wrapper)).toBe(true);

    wrapper.findComponent(stubs.VDialog).vm.$emit('update:model-value', false);
    await nextTick();

    expect(wrapper.emitted('update:model-value')).toEqual([[false]]);
    expect(dialogTracker.currentRef.value).toBeNull();
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();

    wrapper.unmount();
    warn.mockRestore();
    error.mockRestore();
  });

  it('leaves an api-owned dialog on the stack when it unmounts', () => {
    // api.ts owns the entry it pushed, along with the modalDefinitions entry and the promise that go with it
    const dialogId = Symbol('api');
    dialogTracker.push(dialogId);

    mountModal({ modelValue: true, dialogId }).unmount();

    expect(dialogTracker.currentRef.value).toBe(dialogId);
    dialogTracker.remove(dialogId);
  });

  it('takes the template dialog it pushed off the stack when it unmounts', () => {
    const wrapper = mountModal({ modelValue: true });
    expect(dialogTracker.currentRef.value).not.toBeNull();

    wrapper.unmount();
    expect(dialogTracker.currentRef.value).toBeNull();
  });

  describe('size', () => {
    const viewport = window.innerWidth;

    afterEach(() => {
      window.innerWidth = viewport;
    });

    // useDisplay() reads window.innerWidth when the plugin is created, so the viewport is set before the mount
    function mountAtViewport(width: number, size?: DialogSize) {
      window.innerWidth = width;
      return mountModal({ modelValue: true, size });
    }

    function dialog(wrapper: ReturnType<typeof mountModal>) {
      const attrs = wrapper.find('.dialog').attributes();
      return { width: attrs['data-width'], fullscreen: attrs['data-fullscreen'] };
    }

    it.each([
      [DialogSize.SMALL, 800, '400'],
      [DialogSize.MEDIUM, 1000, '600'],
      [DialogSize.LARGE, 1400, '800'],
      [DialogSize.X_LARGE, 2000, '1140'],
    ])('takes its width from the size where the viewport carries it', (size, viewportWidth, width) => {
      const wrapper = mountAtViewport(viewportWidth, size);
      expect(dialog(wrapper)).toEqual({ width, fullscreen: 'false' });
      wrapper.unmount();
    });

    it.each([
      [DialogSize.SMALL, 500],
      [DialogSize.MEDIUM, 800],
      [DialogSize.LARGE, 1000],
      [DialogSize.X_LARGE, 1400],
    ])('goes fullscreen below the breakpoint its size names', (size, viewportWidth) => {
      const wrapper = mountAtViewport(viewportWidth, size);
      expect(dialog(wrapper)).toEqual({ width: 'unset', fullscreen: 'true' });
      wrapper.unmount();
    });

    it('leaves the width to the content at DialogSize.DEFAULT, whatever the viewport', () => {
      const wide = mountAtViewport(2000);
      expect(dialog(wide)).toEqual({ width: 'unset', fullscreen: 'false' });
      wide.unmount();

      const narrow = mountAtViewport(400);
      expect(dialog(narrow)).toEqual({ width: 'unset', fullscreen: 'false' });
      narrow.unmount();
    });
  });

  describe('the close button', () => {
    it('carries none for a dialog that states no way of rejecting itself', () => {
      const wrapper = mountModal({ modelValue: true });
      expect(wrapper.find('button').exists()).toBe(false);
      wrapper.unmount();
    });

    it('carries none where the only reject action is one the keyboard cannot reach', () => {
      const reject = actionWithSpy({ label: 'Cancel', defaultReject: true });
      reject.action.enabled = false;
      const wrapper = mountModal({ modelValue: true, actions: [reject.action] });

      expect(wrapper.find('button').exists()).toBe(false);
      wrapper.unmount();
    });

    it('carries one for the action Escape reaches', () => {
      const reject = actionWithSpy({ label: 'Cancel', defaultReject: true });
      const wrapper = mountModal({ modelValue: true, actions: [reject.action] });

      expect(wrapper.find('button').exists()).toBe(true);
      wrapper.unmount();
    });

    it('runs that action when clicked, as the keystroke would', async () => {
      const reject = actionWithSpy({ label: 'Cancel', defaultReject: true });
      const wrapper = mountModal({ modelValue: true, dialogId: Symbol('api'), actions: [reject.action] });

      await wrapper.find('button').trigger('click');

      // the action settles the dialog through whatever owns it; the component states nothing itself
      expect(reject.spy).toHaveBeenCalledTimes(1);
      expect(wrapper.emitted('update:model-value')).toBeUndefined();
      wrapper.unmount();
    });
  });

  describe('keyboard shortcuts', () => {
    let dialogId: symbol;

    beforeEach(() => {
      dialogId = Symbol('kbd');
      dialogTracker.push(dialogId);
    });

    afterEach(() => {
      dialogTracker.remove(dialogId);
      document.querySelector('.v-overlay-container')?.remove();
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
      // <df-actions> draws an INVISIBLE action with `visibility: hidden`: it holds its space and takes no click,
      // so the keyboard does not reach it either.
      const invisible = actionWithSpy({ label: 'Close', defaultReject: true });
      invisible.action.visibility = DisplayMode.INVISIBLE;

      const wrapper = mountModal({
        modelValue: true,
        dialogId,
        actions: [disabled.action, hidden.action, invisible.action],
      });

      press('Enter');
      press('Escape');

      expect(disabled.spy).not.toHaveBeenCalled();
      expect(hidden.spy).not.toHaveBeenCalled();
      expect(invisible.spy).not.toHaveBeenCalled();
      wrapper.unmount();
    });

    it('leaves the keystroke to a non-persistent overlay open above the dialog', () => {
      const confirm = actionWithSpy({ label: 'Save', defaultConfirm: true });
      const reject = actionWithSpy({ label: 'Cancel', defaultReject: true });
      const wrapper = mountModal({ modelValue: true, dialogId, actions: [confirm.action, reject.action] });

      openOverlay('df-modal', 2000);
      // a <df-select> menu open inside the dialog: VOverlay closes it on Escape without calling preventDefault()
      const menu = openOverlay('v-menu', 2010);

      press('Escape');
      press('Enter');
      expect(reject.spy).not.toHaveBeenCalled();
      expect(confirm.spy).not.toHaveBeenCalled();

      // the menu is gone, so the next Escape is the dialog's own
      menu.remove();
      press('Escape');
      press('Enter');
      expect(reject.spy).toHaveBeenCalledTimes(1);
      expect(confirm.spy).toHaveBeenCalledTimes(1);

      wrapper.unmount();
    });

    it('marks its own overlay, which is what tells it apart from one opened above it', async () => {
      // Every other case here stubs <v-dialog>, so nothing else asserts that the marker the overlay scan looks
      // for reaches the rendered overlay at all. Without it the scan finds no overlay of the dialog's own and
      // answers the keyboard whatever stands above it.
      Object.defineProperty(window, 'visualViewport', {
        value: {
          addEventListener() {},
          removeEventListener() {},
          width: 1280,
          height: 800,
          offsetLeft: 0,
          offsetTop: 0,
          scale: 1,
        },
        configurable: true,
      });
      const host = document.createElement('div');
      document.body.appendChild(host);

      const wrapper = mount(DfModal, {
        props: { modelValue: true, dialogId },
        attachTo: host,
        global: {
          plugins: [createVuetify({ components: vuetifyComponents })],
          stubs: { MessagesWidget: { template: '<span />' } },
        },
      });
      await nextTick();

      const overlay = document.querySelector<HTMLElement>('.v-overlay-container .v-overlay--active.df-modal');
      expect(overlay).not.toBeNull();
      // the stack hands out the index the scan compares
      expect(Number.parseFloat(overlay!.style.zIndex)).toBeGreaterThan(0);

      wrapper.unmount();
      host.remove();
    });

    it('answers the keyboard under a snackbar or a tooltip, which take no keystroke', () => {
      const reject = actionWithSpy({ label: 'Cancel', defaultReject: true });
      const wrapper = mountModal({ modelValue: true, dialogId, actions: [reject.action] });

      openOverlay('df-modal', 2000);
      // Vuetify raises the z-index of these two above the dialog and then keeps them out of the stack that orders
      // the rest, so a raised index alone does not mean the overlay stands between the dialog and the keyboard
      openOverlay('v-snackbar', 2010);
      openOverlay('v-tooltip', 2020);

      press('Escape');
      expect(reject.spy).toHaveBeenCalledTimes(1);

      wrapper.unmount();
    });

    it('does not reach an action inside a disabled container', () => {
      const inner = actionWithSpy({ label: 'Save', defaultConfirm: true });
      // the action itself is untouched: what makes it unreachable is the section above it
      const section = new Group({ save: inner.action });
      section.enabled = false;
      expect(inner.action.enabled).toBe(true);

      const wrapper = mountModal({ modelValue: true, dialogId, actions: [inner.action] });

      press('Enter');
      expect(inner.spy).not.toHaveBeenCalled();
      wrapper.unmount();
    });

    it('starts one run while a handler has yet to settle', async () => {
      const action = new Action({ value: { label: 'Save', defaultConfirm: true } });
      let release: () => void = () => {};
      const spy = vi.fn();
      action.registerAction(
        new ExecuteAction(() => {
          spy();
          return new Promise<void>((resolve) => {
            release = resolve;
          });
        }),
      );

      const wrapper = mountModal({ modelValue: true, dialogId, actions: [action] });

      press('Enter');
      await nextTick();
      press('Enter');
      expect(spy).toHaveBeenCalledTimes(1);

      release();
      await nextTick();
      wrapper.unmount();
    });

    it('routes a failing handler to the app error handler instead of leaving a rejection unhandled', async () => {
      const failure = new Error('handler blew up');
      const action = new Action({ value: { label: 'Save', defaultConfirm: true } });
      action.registerAction(
        new ExecuteAction(() => {
          throw failure;
        }),
      );

      const errorHandler = vi.fn();
      const wrapper = mount(DfModal, {
        props: { modelValue: true, dialogId, actions: [action] },
        global: { stubs, plugins: [createVuetify()], config: { errorHandler } },
      });

      press('Enter');
      await nextTick();
      await nextTick();

      expect(errorHandler).toHaveBeenCalledWith(failure, expect.anything(), 'df-modal keyboard shortcut');
      wrapper.unmount();
    });

    it('reports a failing handler on the console where the app declares no error handler', async () => {
      const failure = new Error('handler blew up');
      const action = new Action({ value: { label: 'Save', defaultConfirm: true } });
      action.registerAction(
        new ExecuteAction(() => {
          throw failure;
        }),
      );
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});

      const wrapper = mountModal({ modelValue: true, dialogId, actions: [action] });

      press('Enter');
      await nextTick();
      await nextTick();

      expect(error).toHaveBeenCalledWith(failure);
      error.mockRestore();
      wrapper.unmount();
    });

    it('reports nothing where an asynchronous handler ends the chain', async () => {
      const action = new Action({ value: { label: 'Save', defaultConfirm: true } });
      const spy = vi.fn();
      action.registerAction(
        new ExecuteAction(async () => {
          spy();
          throw new AbortEventHandlingException('not this time');
        }),
      );

      const errorHandler = vi.fn();
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      const wrapper = mount(DfModal, {
        props: { modelValue: true, dialogId, actions: [action] },
        global: { stubs, plugins: [createVuetify()], config: { errorHandler } },
      });

      press('Enter');
      await nextTick();
      await nextTick();

      expect(spy).toHaveBeenCalledTimes(1);
      // execute() answers with the abort instead of rejecting with it, so the catch branch never sees it
      expect(errorHandler).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();

      error.mockRestore();
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
