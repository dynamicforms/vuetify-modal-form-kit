import * as Form from '@dynamicforms/vue-forms';
import { Action, type RenderContent, RenderableValue, type SimpleComponentDef } from '@dynamicforms/vuetify-inputs';
import { type Component, computed, inject, type InjectionKey, nextTick, type Ref, ref, shallowReactive } from 'vue';

import { dialogAction } from './dialog-actions';
import { defaultDialogSize, type DialogSize, type DialogSizeName, resolveDialogSize } from './dialog-size';
import dialogTracker from './top-modal-tracker';

// Any vue-forms Action: <df-actions> draws a button from the action's value. The subclass @dynamicforms/vuetify-inputs
// exports adds per-breakpoint render options.
export type FormActions = Record<string, Form.Action>;

export interface CloseablePromise<T> extends Promise<T> {
  close: (value: T) => void;
  dialogId: symbol;
  /**
   * What the executor of the settling action returned; `undefined` until the dialog settles, after `close(value)`,
   * or when the executor returned `null`/nothing.
   */
  payload?: unknown;
  /** The properties of the dialog, to read and change while it is open. See {@link DialogProps}. */
  props: DialogProps;
}

export interface ModalOptions {
  form?: Form.Group;
  size?: DialogSizeName;
  /**
   * The dialog's buttons by name, merged over the default ones. An action that is also a member of `form` resolves
   * the dialog with its field name.
   */
  actions?: FormActions;
  color?: string;
  icon?: string;
  /**
   * Components the dialog body resolves names against, before the `df-*` components `<modal-view>` supplies: the
   * layout generated from `form`, and the component `custom()` names or a `SimpleComponentDef` at the top of
   * `message` names. A component given here needs no global registration. A component nested in the children of a
   * `SimpleComponentDef`, and one in `title`, resolve globally registered components only.
   */
  components?: Record<string | symbol, any>;
}

/** The options of `custom()`. */
export interface CustomOptions extends ModalOptions {
  /**
   * Two-way bound props of the component: each ref is passed as the prop of its key, and the component's
   * `update:<key>` event writes the ref.
   */
  model?: Record<string, Ref<any>>;
}

let lastCustomComponent = 0;

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

// injection key of the promise of the dialog whose body is rendering
export const dialogKey: InjectionKey<{ readonly value: CloseablePromise<string> | undefined }> = Symbol('dialog');

const modalDefinitions = {} as Record<symbol, ModalData>;
// The mounted <modal-view> instances, in the order they mounted. One dialog stack is drawn by one view, so the
// first of these draws and the rest render nothing; a view that leaves hands the drawing to the next one still up.
export const mountedViews = ref<symbol[]>([]);
// counted, not a flag: one <modal-view> unmounting must not report the modal system as gone while another is
// still mounted
const installedCount = computed(() => mountedViews.value.length);
export const installed = computed(() => installedCount.value > 0);

class ModalAPI {
  /**
   * The number of dialogs on the dialog stack: the ones this service opened that have not settled, and every
   * `<df-modal>` used directly whose `v-model` is `true`. Reactive.
   */
  get openCount(): number {
    return dialogTracker.size;
  }

  isTop(promise: CloseablePromise<any>) {
    return dialogTracker.currentRef.value === promise.dialogId;
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

    const yes = dialogAction('yes');
    const no = dialogAction('no');

    return this.messageInternal(title, message, hasAction ? {} : { yes, no }, options);
  }

  message(
    title: RenderContent | RenderableValue,
    message: RenderContent | RenderableValue,
    options?: ModalOptions,
  ): CloseablePromise<string> {
    const hasAction = this.hasOwnAction(options);

    const close = dialogAction('close');

    return this.messageInternal(title, message, hasAction ? {} : { close }, options);
  }

  custom(
    title: RenderContent | RenderableValue,
    component: string | Component,
    componentProps: Record<any, any>,
    options?: CustomOptions,
  ): CloseablePromise<string> {
    const { model, ...modalOptions } = options ?? {};
    // a component given as such is reached through the dialog's components, under a name of its own
    let componentName = component as string;
    if (typeof component !== 'string') {
      componentName = `df-modal-custom-${++lastCustomComponent}`;
      modalOptions.components = { ...modalOptions.components, [componentName]: component };
    }
    const props: Record<string, any> = { ...componentProps };
    Object.entries(model ?? {}).forEach(([key, value]) => {
      // a getter: the props are read while the body renders, so the component follows the ref
      Object.defineProperty(props, key, { get: () => value.value, enumerable: true, configurable: true });
      props[`onUpdate:${key}`] = (newValue: unknown) => {
        value.value = newValue;
      };
    });
    return this.message(title, <SimpleComponentDef>{ componentName, componentProps: props }, modalOptions);
  }

  // true when options hold an action at 'full' visibility (read once, as the dialog opens); the dialog then adds no
  // default actions
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

    // one ExecuteAction per settling action; after the chain runs it settles the dialog if the executed element is
    // the bound one and the dialog is on top; removed on settle or when the action stops settling
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
        if (isSettled) return;
        isSettled = true;
        dialogTracker.remove(id);
        delete modalDefinitions[id];
        detachResolvers(new Set());
        // read off the promise once it has settled: the dialog resolves with the key, which stays a string.
        // `null` is what a chain with no executor answers, and is no payload.
        promise.payload = payload ?? undefined;
        // resolves after the next render, so the closed dialog has left the DOM before the caller can open another
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
