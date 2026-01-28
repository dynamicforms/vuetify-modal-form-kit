import * as Form from '@dynamicforms/vue-forms';
import { Action } from '@dynamicforms/vuetify-inputs';
import { isEmpty } from 'lodash-es';
import { computed, nextTick, ref } from 'vue';

// import { Action, ActionCollection, FilteredActions } from '@/actions';
import DialogSize from './dialog-size';
import dialogTracker from './top-modal-tracker';

export type FormActions = Record<string, Action>;

export interface CloseablePromise<T> extends Promise<T> {
  close: (value: T) => void;
  dialogId: symbol;
}

export interface ModalOptions {
  form?: Form.Group;
  size?: DialogSize;
  actions?: FormActions;
  color?: string;
  icon?: string;
}

export interface ModalData extends ModalOptions {
  dialogId: symbol;
  title: Form.RenderableValue;
  message: Form.RenderableValue;
  size: DialogSize;
  resolve: (value: string) => void;
}

const modalDefinitions = {} as Record<symbol, ModalData>;
export const installed = ref(false);

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
    const hasAction =
      Object.keys(options?.form?.fields ?? []).some(
        (fieldName) => options?.form?.field(fieldName) instanceof Form.Action,
      ) || !isEmpty(options?.actions);

    const yes = Action.yesAction();
    Object.defineProperty(yes, 'defaultConfirm', { value: true });
    const no = Action.noAction();
    Object.defineProperty(no, 'defaultReject', { value: true });

    return this.messageInternal(title, message, hasAction ? {} : { yes, no }, options);
  }

  message(
    title: Form.RenderContent | Form.RenderableValue,
    message: Form.RenderContent | Form.RenderableValue,
    options?: ModalOptions,
  ): CloseablePromise<string> {
    const hasAction =
      Object.keys(options?.form?.fields ?? []).some(
        (fieldName) => options?.form?.field(fieldName) instanceof Form.Action,
      ) || !isEmpty(options?.actions);

    const close = Action.closeAction();
    Object.defineProperties(close, {
      defaultConfirm: { value: true },
      defaultReject: { value: true },
    });

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

  private getRenderableMessage(message: Form.RenderContent | Form.RenderableValue): Form.RenderableValue {
    return message instanceof Form.RenderableValue ? message : new Form.RenderableValue(message);
  }

  private messageInternal(
    title: Form.RenderContent | Form.RenderableValue,
    message: Form.RenderContent | Form.RenderableValue,
    defaultActions: FormActions,
    options?: ModalOptions,
  ): CloseablePromise<string> {
    // Object.keys(defaultActions).forEach((actionName) => {
    //   if (form.field(actionName) == null) form.fields[actionName] = defaultActions[actionName] as Action;
    // });

    let resolvePromise: (value: string) => void;

    const actions: FormActions = { ...defaultActions, ...(options?.actions ?? {}) };

    Object.keys(options?.form?.fields ?? []).forEach((fieldName) => {
      const action = options?.form?.field(fieldName);
      if (action instanceof Form.Action) {
        if (!actions[fieldName]) {
          actions[fieldName] = <Action>(<any>action);
        } else {
          action.registerAction(
            new Form.ExecuteAction(async (field, supr, ...params) => {
              await supr(field, ...params);
              resolvePromise(field.fieldName!);
            }),
          );
        }
      }
    });
    Object.entries(actions).forEach(([name, action]) => {
      action.registerAction(
        new Form.ExecuteAction(async (field, supr, ...params) => {
          await supr(field, ...params);
          resolvePromise(field.fieldName || name);
        }),
      );
    });

    const id = Symbol('modalstack');
    const promise = new Promise<string>((resolve) => {
      resolvePromise = (value: string) => {
        dialogTracker.remove(id);
        delete modalDefinitions[id];
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
        resolve,
        color: options?.color,
        icon: options?.icon,
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
