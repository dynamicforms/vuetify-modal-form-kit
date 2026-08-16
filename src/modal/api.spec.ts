import * as Form from '@dynamicforms/vue-forms';
import { Action } from '@dynamicforms/vuetify-inputs';
import { nextTick } from 'vue';

import modal, { currentModal } from './api';
import DialogSize from './dialog-size';

// the promise is resolved from a nextTick callback, so one flush is not enough to see it settle
async function settled<T>(promise: Promise<T>): Promise<T> {
  await nextTick();
  await nextTick();
  return promise;
}

describe('modal service', () => {
  it('opens a message dialog with a single close action', async () => {
    const promise = modal.message('Done', 'Your changes have been saved.');

    const current = currentModal.value!;
    expect(current.title).toBeInstanceOf(Form.RenderableValue);
    expect(current.message).toBeInstanceOf(Form.RenderableValue);
    expect(current.size).toBe(DialogSize.DEFAULT);
    expect(Object.keys(current.actions!)).toEqual(['close']);
    expect(modal.isTop(promise)).toBe(true);

    current.actions!.close.execute(null);
    expect(await settled(promise)).toBe('close');
    expect(currentModal.value).toBeNull();
  });

  it('opens a yes / no dialog and resolves with the key of the action pressed', async () => {
    const promise = modal.yesNo('Delete item', 'This cannot be undone. Continue?');

    const actions = currentModal.value!.actions!;
    expect(Object.keys(actions)).toEqual(['yes', 'no']);
    expect(actions.yes.defaultConfirm).toBe(true);
    expect(actions.no.defaultReject).toBe(true);

    actions.no.execute(null);
    expect(await settled(promise)).toBe('no');
  });

  it('takes the actions off the form instead of adding a default one', async () => {
    const submit = new Action({ value: { label: 'Send', defaultConfirm: true } });
    const form = new Form.Group({ email: new Form.Field({ value: '' }), submit });

    const promise = modal.message('Subscribe', 'Enter your email address:', { form, size: DialogSize.LARGE });

    const current = currentModal.value!;
    expect(current.size).toBe(DialogSize.LARGE);
    expect(Object.keys(current.actions!)).toEqual(['submit']);
    expect(current.form).toBe(form);

    submit.execute(null);
    expect(await settled(promise)).toBe('submit');
  });

  it('closes from the outside through the returned promise', async () => {
    const promise = modal.message('Working', 'Please wait...');
    expect(currentModal.value).not.toBeNull();

    promise.close('cancelled');

    expect(await settled(promise)).toBe('cancelled');
    expect(currentModal.value).toBeNull();
  });

  it('keeps a suspended dialog on the stack until the one on top of it closes', async () => {
    const first = modal.message('First', 'first');
    const second = modal.message('Second', 'second');

    // the most recently opened dialog is the one on screen
    expect(currentModal.value!.dialogId).toBe(second.dialogId);
    expect(modal.isTop(first)).toBe(false);
    expect(modal.isTop(second)).toBe(true);

    second.close('close');
    await settled(second);

    // the first one is uncovered, not lost
    expect(currentModal.value!.dialogId).toBe(first.dialogId);
    expect(modal.isTop(first)).toBe(true);

    first.close('close');
    await settled(first);
    expect(currentModal.value).toBeNull();
  });

  it('takes the dialog off the stack when it is resolved through its own record', async () => {
    const promise = modal.message('Working', 'Please wait...');

    currentModal.value!.resolve('done');

    expect(await settled(promise)).toBe('done');
    expect(currentModal.value).toBeNull();
  });

  it('renders a custom component as the dialog body', async () => {
    const promise = modal.custom('Settings', 'MySettingsPanel', { userId: 42 });

    const message = currentModal.value!.message;
    expect(message.getTextType).toBe('component');
    expect(message.componentName).toBe('MySettingsPanel');
    expect(message.componentBindings).toEqual({ userId: 42 });

    promise.close('close');
    await settled(promise);
  });
});
