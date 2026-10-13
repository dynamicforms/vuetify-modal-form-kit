import * as Form from '@dynamicforms/vue-forms';
import { Action, type RenderContent, RenderableValue, type SimpleComponentDef } from '@dynamicforms/vuetify-inputs';
import { computed, inject, type InjectionKey, nextTick, ref, shallowReactive } from 'vue';

import { defaultDialogSize, type DialogSize, type DialogSizeName, resolveDialogSize } from './dialog-size';
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
  /** The properties of the dialog, to read and change while it is open. See {@link DialogProps}. */
  props: DialogProps;
}

export interface ModalOptions {
  form?: Form.Group;
  size?: DialogSizeName;
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

/**
 * The properties of a dialog the modal service opened. Each one is reactive: a read in a render function, `computed`
 * or `watch` follows it, and a write changes the dialog on screen.
 *
 * `actions` is the set of actions the dialog states: the default ones the dialog was opened with (`close`, or `yes` /
 * `no`) merged under `ModalOptions.actions`. The dialog draws it together with the `Action` members of `form` whose
 * name it does not hold. Writing `actions` replaces the set; the default actions are not added to it again.
 */
export interface DialogProps {
  get title(): RenderableValue;
  set title(value: RenderContent | RenderableValue);
  get message(): RenderableValue;
  set message(value: RenderContent | RenderableValue);
  get size(): DialogSize;
  /** A value that names no size is `'default'`, as in `ModalOptions.size`. */
  set size(value: DialogSizeName);
  form: Form.Group | undefined;
  actions: FormActions;
  color: string | undefined;
  icon: string | undefined;
  components: Record<string | symbol, any> | undefined;
}

interface DialogState {
  title: RenderableValue;
  message: RenderableValue;
  size: DialogSize;
  form: Form.Group | undefined;
  actions: FormActions;
  color: string | undefined;
  icon: string | undefined;
  components: Record<string | symbol, any> | undefined;
}

function toRenderable(content: RenderContent | RenderableValue): RenderableValue {
  return content instanceof RenderableValue ? content : new RenderableValue(content);
}

// The actions a dialog draws, and every action that settles it with the name it settles it under. A member of the
// form is drawn unless `actions` holds its name; then the action under that name is drawn, and the member still
// settles the dialog when it executes. The members come first: an action reachable both ways settles the dialog
// with its field name.
function composeActions(actions: FormActions, form: Form.Group | undefined) {
  const drawn: FormActions = { ...actions };
  const settling: [Form.Action, string][] = [];
  Object.keys(form?.fields ?? []).forEach((fieldName) => {
    const action = form?.field(fieldName);
    if (!(action instanceof Form.Action)) return;
    if (drawn[fieldName]) settling.push([action, fieldName]);
    else drawn[fieldName] = action;
  });
  Object.entries(drawn).forEach(([name, action]) => settling.push([action, name]));
  return { drawn, settling };
}

export class DialogPropsImpl implements DialogProps {
  // shallow: a form, an action or a RenderableValue held here is the caller's object, not a proxy of it, so the
  // identity checks the dialog makes on them hold
  private readonly state: DialogState;

  // the actions the dialog draws, recomposed whenever `form` or `actions` is written
  readonly drawn = shallowReactive<{ actions: FormActions }>({ actions: {} });

  constructor(
    state: DialogState,
    private readonly onActionsChange: (settling: [Form.Action, string][]) => void,
  ) {
    this.state = shallowReactive(state);
    this.recompose();
  }

  get title(): RenderableValue {
    return this.state.title;
  }

  set title(value: RenderContent | RenderableValue) {
    this.state.title = toRenderable(value);
  }

  get message(): RenderableValue {
    return this.state.message;
  }

  set message(value: RenderContent | RenderableValue) {
    this.state.message = toRenderable(value);
  }

  get size(): DialogSize {
    return this.state.size;
  }

  set size(value: DialogSizeName) {
    this.state.size = resolveDialogSize(value);
  }

  get form(): Form.Group | undefined {
    return this.state.form;
  }

  set form(value: Form.Group | undefined) {
    this.state.form = value;
    this.recompose();
  }

  get actions(): FormActions {
    return this.state.actions;
  }

  set actions(value: FormActions) {
    this.state.actions = value;
    this.recompose();
  }

  get color(): string | undefined {
    return this.state.color;
  }

  set color(value: string | undefined) {
    this.state.color = value;
  }

  get icon(): string | undefined {
    return this.state.icon;
  }

  set icon(value: string | undefined) {
    this.state.icon = value;
  }

  get components(): Record<string | symbol, any> | undefined {
    return this.state.components;
  }

  set components(value: Record<string | symbol, any> | undefined) {
    this.state.components = value;
  }

  private recompose() {
    const { drawn, settling } = composeActions(this.state.actions, this.state.form);
    this.drawn.actions = drawn;
    this.onActionsChange(settling);
  }
}

export interface ModalData {
  dialogId: symbol;
  props: DialogPropsImpl;
  dialog: CloseablePromise<string>;
  resolve: (value: string) => void;
}

// Provided by <modal-view> to the body of the dialog it draws; read by useDialog().
export const dialogKey: InjectionKey<{ readonly value: CloseablePromise<string> | undefined }> = Symbol('dialog');

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
    title: RenderContent | RenderableValue,
    message: RenderContent | RenderableValue,
    options?: ModalOptions,
  ): CloseablePromise<string> {
    const hasAction = this.hasOwnAction(options);

    const yes = Action.yesAction({ value: { defaultConfirm: true } });
    const no = Action.noAction({ value: { defaultReject: true } });

    return this.messageInternal(title, message, hasAction ? {} : { yes, no }, options);
  }

  message(
    title: RenderContent | RenderableValue,
    message: RenderContent | RenderableValue,
    options?: ModalOptions,
  ): CloseablePromise<string> {
    const hasAction = this.hasOwnAction(options);

    const close = Action.closeAction({ value: { defaultConfirm: true, defaultReject: true } });

    return this.messageInternal(title, message, hasAction ? {} : { close }, options);
  }

  custom(
    title: RenderContent,
    componentName: string,
    componentProps: Record<any, any>,
    options?: ModalOptions,
  ): CloseablePromise<string> {
    return this.message(title, <SimpleComponentDef>{ componentName, componentProps }, options);
  }

  // Whether the caller states buttons of its own, and so whether the dialog adds its default ones. Only an action
  // the user can reach counts, which is the read <df-modal>'s keyboard makes: <df-actions> leaves out an action at
  // 'suppress' and draws one at 'hidden' as `d-none` and one at 'invisible' as `visibility: hidden`, so none of the
  // three takes a click, and the keyboard answers 'full' alone. A dialog counting one of them would be on screen
  // with no way out of it.
  // The visibility is the one the action carries as the dialog opens. The default actions are decided once, at
  // that moment: an action raised to 'full' or dropped below it later neither removes the dialog's own buttons nor
  // adds them.
  private hasOwnAction(options?: ModalOptions): boolean {
    const drawn = (action: Form.Action) => action.visibility === 'full';
    if (Object.values(options?.actions ?? {}).some(drawn)) return true;
    return Object.keys(options?.form?.fields ?? []).some((fieldName) => {
      const field = options?.form?.field(fieldName);
      return field instanceof Form.Action && drawn(field);
    });
  }

  private messageInternal(
    title: RenderContent | RenderableValue,
    message: RenderContent | RenderableValue,
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
    let isSettled = false;

    const id = Symbol('modalstack');

    // A registration belongs to the element's declaration, so one chain serves every binding of it and every
    // dialog opened over one. This handler settles the dialog when the element that executed is the binding the
    // dialog holds and the dialog is the one on screen. Both are asked after the chain has run, because that is
    // where settling is decided: an executor may take a while, and the dialog may be closed from the outside
    // through promise.close() while it does. The handler is dropped when the action stops settling the dialog and
    // when the dialog settles, so nothing accumulates over repeated openings.
    const registered = new Map<Form.Action, Form.ExecuteAction>();
    const attachResolver = (target: Form.Action, name: string) => {
      const handler = new Form.ExecuteAction(async (field, supr, ...params) => {
        const answer = await supr(field, ...params);
        // the guard settles this dialog only for the binding it holds and only while it is the dialog on screen.
        // A refused run reaches nothing here: an abort travels the chain as a throw, and only the trigger turns it
        // into the answer execute() resolves with, so the dialog stays open.
        if (field === target && dialogTracker.currentRef.value === id) {
          resolvePromise(field.fieldName || name, answer);
        }
        // the answer the chain reached, not this handler's own: an action handed to a dialog goes on reporting
        // what its own executor returned
        return answer;
      });
      target.registerAction(handler);
      registered.set(target, handler);
    };
    const detachResolvers = (keep: Set<Form.Action>) => {
      registered.forEach((handler, target) => {
        if (keep.has(target)) return;
        target.unregisterAction(handler);
        registered.delete(target);
      });
    };
    const syncResolvers = (settling: [Form.Action, string][]) => {
      if (isSettled) return;
      detachResolvers(new Set(settling.map(([action]) => action)));
      // one registration per action: an action reachable both as a member of the form and under a key of
      // `actions` would otherwise settle the dialog twice
      settling.forEach(([action, name]) => {
        if (!registered.has(action)) attachResolver(action, name);
      });
    };

    const props = new DialogPropsImpl(
      {
        title: toRenderable(title),
        message: toRenderable(message),
        size: resolveDialogSize(options?.size ?? defaultDialogSize),
        form: options?.form,
        actions: { ...defaultActions, ...(options?.actions ?? {}) },
        color: options?.color,
        icon: options?.icon,
        components: options?.components,
      },
      syncResolvers,
    );

    const promise = new Promise<string>((resolve) => {
      resolvePromise = (value: string, payload?: unknown) => {
        isSettled = true;
        dialogTracker.remove(id);
        delete modalDefinitions[id];
        detachResolvers(new Set());
        // read off the promise once it has settled: the dialog resolves with the key, which stays a string.
        // `null` is what a chain with no executor answers, and is no payload.
        promise.payload = payload ?? undefined;
        // Use nextTick to ensure Vue updates the DOM before cleanup
        // This prevents race conditions when opening a new dialog immediately after closing one
        nextTick(() => resolve(value));
      };
    }) as CloseablePromise<string>;

    promise.close = (value: string) => resolvePromise(value);
    promise.dialogId = id;
    promise.props = props;

    dialogTracker.push(id);
    modalDefinitions[id] = {
      dialogId: id,
      props,
      dialog: promise,
      // the wrapper, not the bare resolver: settling without it leaves the dialog on the stack forever
      resolve: (value: string) => resolvePromise(value),
    };

    return promise;
  }
}

const modal = new ModalAPI();
export default modal;

export const currentModal = computed(() => {
  const currentId = dialogTracker.currentRef.value;
  return currentId ? modalDefinitions[currentId] : null;
});

/**
 * The dialog whose body the calling component is rendered in: the promise the modal service returned for it, with
 * its `props` and `close()`. `undefined` outside the body of a dialog `<modal-view>` draws, e.g. in a `<df-modal>`
 * used directly. Called in `setup()`.
 */
export function useDialog(): CloseablePromise<string> | undefined {
  return inject(dialogKey, undefined)?.value;
}
