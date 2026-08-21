import * as Form from '@dynamicforms/vue-forms';
import { Action } from '@dynamicforms/vuetify-inputs';
import { computed, nextTick, ref } from 'vue';

import DialogSize from './dialog-size';
import dialogTracker from './top-modal-tracker';

// Any vue-forms Action: <df-actions> draws a button from the action's value, and the subclass
// @dynamicforms/vuetify-inputs exports is what an action needs to render responsively, not to be drawn at all.
export type FormActions = Record<string, Form.Action>;

export interface CloseablePromise<T> extends Promise<T> {
  close: (value: T) => void;
  dialogId: symbol;
  /**
   * What the executor of the action that settled the dialog returned, once it has. The dialog resolves with the
   * key of that action - a string a `switch` reads - and this is where anything the action produced besides that
   * key is found: the record a save handler answered with, the row a picker chose.
   *
   * It is `undefined` until the dialog settles, so it is read off the promise after awaiting it rather than off
   * the awaited value:
   *
   * ```typescript
   * const dialog = modal.message('Edit', 'change what you need', { form, actions: { save } });
   * const answer = await dialog;        // 'save'
   * const record = dialog.payload;      // what the save executor returned
   * ```
   *
   * A dialog settled through `close(value)` carries none, and so does one settled by an action that produced
   * nothing: an action with no executor of its own answers `null`, which is read here as no payload. Where that
   * distinction matters, `await action.execute()` hands back the chain's answer untouched.
   */
  payload?: unknown;
}

export interface ModalOptions {
  form?: Form.Group;
  size?: DialogSize;
  /**
   * The dialog's buttons, keyed by name, merged over the defaults it would otherwise state.
   *
   * The dialog resolves with the name of the action that settled it, and an action can carry two: the field name
   * it has inside `form`, and the key it is written under here. Where one action is reachable both ways - which
   * is how a form member is also stated as a dialog button - the field name is the one the dialog resolves with:
   *
   * ```typescript
   * const form = new Form.Group({ submit });   // field name: 'submit'
   * await modal.message(title, body, { form, actions: { send: submit } });   // resolves with 'submit'
   * ```
   */
  actions?: FormActions;
  color?: string;
  icon?: string;
  /**
   * Components the dialog body may name, over the ones `<modal-view>` supplies. A layout - the one generated from
   * `form`, or one a `FormBuilder` in the body states - resolves a component name against this map first, so an
   * application's own component is reachable from `modal.custom()` without being registered globally.
   */
  components?: Record<string | symbol, any>;
}

export interface ModalData extends ModalOptions {
  dialogId: symbol;
  title: Form.RenderableValue;
  message: Form.RenderableValue;
  size: DialogSize;
  resolve: (value: string) => void;
}

const modalDefinitions = {} as Record<symbol, ModalData>;
// The mounted <modal-view> instances, in the order they mounted. One dialog stack is drawn by one view, so the
// first of these draws and the rest render nothing; a view that leaves hands the drawing to the next one still up.
export const mountedViews = ref<symbol[]>([]);
// counted, not a flag: one <modal-view> unmounting must not report the modal system as gone while another is
// still mounted
export const installedCount = computed(() => mountedViews.value.length);
export const installed = computed(() => installedCount.value > 0);

class ModalAPI {
  isTop(promise: CloseablePromise<any>) {
    return dialogTracker.isTop(promise.dialogId).value;
  }

  isInstalled() {
    return installed.value;
  }

  yesNo(
    title: Form.RenderContent | Form.RenderableValue,
    message: Form.RenderContent | Form.RenderableValue,
    options?: ModalOptions,
  ): CloseablePromise<string> {
    const hasAction = this.hasOwnAction(options);

    const yes = Action.yesAction({ value: { defaultConfirm: true } });
    const no = Action.noAction({ value: { defaultReject: true } });

    return this.messageInternal(title, message, hasAction ? {} : { yes, no }, options);
  }

  message(
    title: Form.RenderContent | Form.RenderableValue,
    message: Form.RenderContent | Form.RenderableValue,
    options?: ModalOptions,
  ): CloseablePromise<string> {
    const hasAction = this.hasOwnAction(options);

    const close = Action.closeAction({ value: { defaultConfirm: true, defaultReject: true } });

    return this.messageInternal(title, message, hasAction ? {} : { close }, options);
  }

  custom(
    title: Form.RenderContent,
    componentName: string,
    componentProps: Record<any, any>,
    options?: ModalOptions,
  ): CloseablePromise<string> {
    return this.message(title, <Form.SimpleComponentDef>{ componentName, componentProps }, options);
  }

  // Whether the caller states buttons of its own, and so whether the dialog adds its default ones. Only an action
  // the user can reach counts, which is the read <df-modal>'s keyboard makes: <df-actions> leaves out an action at
  // SUPPRESS and draws one at HIDDEN as `d-none` and one at INVISIBLE as `visibility: hidden`, so none of the three
  // takes a click, and the keyboard answers FULL alone. A dialog counting one of them would be on screen with no
  // way out of it.
  // The visibility is the one the action carries as the dialog opens. The default actions are decided once, at
  // that moment: an action raised to FULL or dropped below it later neither removes the dialog's own buttons nor
  // adds them.
  private hasOwnAction(options?: ModalOptions): boolean {
    const drawn = (action: Form.Action) => action.visibility === Form.DisplayMode.FULL;
    if (Object.values(options?.actions ?? {}).some(drawn)) return true;
    return Object.keys(options?.form?.fields ?? []).some((fieldName) => {
      const field = options?.form?.field(fieldName);
      return field instanceof Form.Action && drawn(field);
    });
  }

  private getRenderableMessage(message: Form.RenderContent | Form.RenderableValue): Form.RenderableValue {
    return message instanceof Form.RenderableValue ? message : new Form.RenderableValue(message);
  }

  private messageInternal(
    title: Form.RenderContent | Form.RenderableValue,
    message: Form.RenderContent | Form.RenderableValue,
    defaultActions: FormActions,
    options?: ModalOptions,
  ): CloseablePromise<string> {
    if (!installed.value) {
      // deferred to the end of the tick: opening a dialog from a setup() that runs before the sibling
      // <modal-view> mounts is supported, and the dialog on the stack is picked up as soon as the view is there
      nextTick(() => {
        if (installed.value) return;
        // the dialog goes onto the stack regardless, but with nothing rendering it there is no action to resolve it
        console.warn(
          'No <modal-view> (ModalView) is mounted, so this dialog is not displayed and no action can resolve it: ' +
            'the returned promise settles only through its own .close(value). Mount <modal-view> once, somewhere ' +
            'in the app, to render dialogs.',
        );
      });
    }

    let resolvePromise: (value: string, payload?: unknown) => void;

    const id = Symbol('modalstack');
    const actions: FormActions = { ...defaultActions, ...(options?.actions ?? {}) };

    // A registration belongs to the element's declaration, so one chain serves every binding of it and every
    // dialog opened over one. This handler settles the dialog when the element that executed is the binding the
    // dialog holds and the dialog is the one on screen. Both are asked after the chain has run, because that is
    // where settling is decided: an executor may take a while, and the dialog may be closed from the outside
    // through promise.close() while it does. The handler is dropped again when the dialog settles, so nothing
    // accumulates over repeated openings.
    const registered: [Form.Action, Form.ExecuteAction][] = [];
    const attached = new Set<Form.Action>();
    const attachResolver = (target: Form.Action, name: string) => {
      // one registration per action: an action reachable both as a member of the form and under a key of
      // options.actions would otherwise settle the dialog twice
      if (attached.has(target)) return;
      attached.add(target);
      const handler = new Form.ExecuteAction(async (field, supr, ...params) => {
        const mine = field === target;
        let answer;
        try {
          answer = await supr(field, ...params);
        } catch (error) {
          // an abort is an answer: the run ends, the dialog stays open, and the caller reads the exception off
          // what execute() resolves with rather than off a rejection
          if (mine && error instanceof Form.AbortEventHandlingException) return error;
          throw error;
        }
        if (mine && !(answer instanceof Form.AbortEventHandlingException) && dialogTracker.currentRef.value === id) {
          resolvePromise(field.fieldName || name, answer);
        }
        // the answer the chain reached, not this handler's own: an action handed to a dialog goes on reporting
        // what its own executor returned
        return answer;
      });
      target.registerAction(handler);
      registered.push([target, handler]);
    };

    Object.keys(options?.form?.fields ?? []).forEach((fieldName) => {
      const action = options?.form?.field(fieldName);
      if (!(action instanceof Form.Action)) return;
      if (!actions[fieldName]) {
        actions[fieldName] = action;
        return; // the loop below attaches the resolver, with the rest of the rendered set
      }
      // a name the caller's own `actions` already holds: the form's action is not in the set below, and still
      // settles the dialog when it executes
      attachResolver(action, fieldName);
    });
    Object.entries(actions).forEach(([name, action]) => attachResolver(action, name));

    const promise = new Promise<string>((resolve) => {
      resolvePromise = (value: string, payload?: unknown) => {
        dialogTracker.remove(id);
        delete modalDefinitions[id];
        registered.forEach(([target, handler]) => target.unregisterAction(handler));
        // read off the promise once it has settled: the dialog resolves with the key, which stays a string.
        // `null` is what a chain with no executor answers, and is no payload.
        promise.payload = payload ?? undefined;
        // Use nextTick to ensure Vue updates the DOM before cleanup
        // This prevents race conditions when opening a new dialog immediately after closing one
        nextTick(() => resolve(value));
      };
      dialogTracker.push(id);
      modalDefinitions[id] = {
        dialogId: id,
        title: this.getRenderableMessage(title),
        message: this.getRenderableMessage(message),
        form: options?.form,
        size: options?.size ?? DialogSize.DEFAULT,
        actions,
        // the wrapper, not the bare resolver: settling without it leaves the dialog on the stack forever
        resolve: (value: string) => resolvePromise(value),
        color: options?.color,
        icon: options?.icon,
        components: options?.components,
      };
    }) as CloseablePromise<string>;

    promise.close = (value: string) => resolvePromise(value);
    promise.dialogId = id;

    return promise;
  }
}

const modal = new ModalAPI();
export default modal;

export const currentModal = computed(() => {
  const currentId = dialogTracker.currentRef.value;
  return currentId ? modalDefinitions[currentId] : null;
});
