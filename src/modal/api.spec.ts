import * as Form from '@dynamicforms/vue-forms';
import { Action } from '@dynamicforms/vuetify-inputs';
import { vi } from 'vitest';
import { nextTick } from 'vue';

import modal, { currentModal, installedCount } from './api';
import DialogSize from './dialog-size';

// the promise is resolved from a nextTick callback, so one flush is not enough to see it settle
async function settled<T>(promise: Promise<T>): Promise<T> {
  await nextTick();
  await nextTick();
  return promise;
}

describe('modal service', () => {
  // no view is mounted here, so every dialog this spec opens warns about it
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  it('warns about the missing view only while none is installed', async () => {
    const warn = vi.mocked(console.warn);

    const unrendered = modal.message('Nobody home', 'no view is mounted');
    await nextTick();
    expect(warn).toHaveBeenCalledOnce();

    warn.mockClear();
    installedCount.value = 1;
    const rendered = modal.message('On screen', 'a view is mounted');
    await nextTick();
    expect(warn).not.toHaveBeenCalled();
    installedCount.value = 0;

    rendered.close('close');
    await settled(rendered);
    unrendered.close('close');
    await settled(unrendered);
  });

  it('settles only the dialog whose action was executed, over two bindings of one form', async () => {
    // an action's registrations belong to its declaration, so both bindings of `template` share one chain:
    // without the per-dialog removal, executing one dialog's action settles the other's promise as well
    const template = new Form.Group({
      email: new Form.Field({ value: '' }),
      submit: new Action({ value: { label: 'Send' } }),
    });
    const first = modal.message('First', 'first', { form: template.bind({ email: 'a@example.com' }) });
    const second = modal.message('Second', 'second', { form: template.bind({ email: 'b@example.com' }) });

    let firstSettled = false;
    first.then(() => {
      firstSettled = true;
    });

    await (<Action>currentModal.value!.actions!.submit).execute(null);
    expect(await settled(second)).toBe('submit');
    expect(firstSettled).toBe(false);

    // and the dialog underneath is still the one it was, with an action that still settles it
    expect(currentModal.value!.dialogId).toBe(first.dialogId);
    await (<Action>currentModal.value!.actions!.submit).execute(null);
    expect(await settled(first)).toBe('submit');
  });

  it('leaves the action it borrowed with no registration of its own', async () => {
    const submit = new Action({ value: { label: 'Send' } });
    const form = new Form.Group({ submit });

    for (let i = 0; i < 3; i++) {
      const promise = modal.message('Subscribe', 'again', { form });
      await submit.execute(null);
      expect(await settled(promise)).toBe('submit');
    }

    // nothing accumulated: an execute() outside any dialog reaches no resolver, so no dialog is opened or settled
    await submit.execute(null);
    expect(currentModal.value).toBeNull();
  });

  it('answers with what the action chain returned', async () => {
    const submit = new Action({ value: { label: 'Send' } });
    submit.registerAction(new Form.ExecuteAction(async () => ({ id: 42 })));
    const form = new Form.Group({ submit });

    const promise = modal.message('Subscribe', 'Enter your email address:', { form });

    expect(await submit.execute(null)).toEqual({ id: 42 });
    expect(await settled(promise)).toBe('submit');
  });

  it('answers with an abort and leaves the dialog open', async () => {
    const submit = new Action({ value: { label: 'Send' } });
    submit.registerAction(
      new Form.ExecuteAction(() => {
        throw new Form.AbortEventHandlingException('not yet');
      }),
    );
    const form = new Form.Group({ submit });

    const promise = modal.message('Subscribe', 'Enter your email address:', { form });

    const answer = await submit.execute(null);
    expect(answer).toBeInstanceOf(Form.AbortEventHandlingException);
    expect(currentModal.value!.dialogId).toBe(promise.dialogId);

    promise.close('close');
    await settled(promise);
  });

  it('leaves a bare vue-forms Action out of the rendered set, and still settles on it', async () => {
    const warn = vi.mocked(console.warn);
    const submit = new Form.Action({ value: { label: 'Send' } });
    const form = new Form.Group({ submit });

    const promise = modal.message('Subscribe', 'Enter your email address:', { form });

    expect(warn).toHaveBeenCalledWith(expect.stringContaining("Form field 'submit'"));
    // no action of its own reaches df-actions, so the dialog falls back to its default close button
    expect(Object.keys(currentModal.value!.actions!)).toEqual(['close']);

    await submit.execute(null);
    expect(await settled(promise)).toBe('submit');
  });

  it('stays silent when a view is installed within the same tick as the open', async () => {
    const warn = vi.mocked(console.warn);

    const promise = modal.message('Opened first', 'the view mounts right after');
    installedCount.value = 1;
    await nextTick();
    expect(warn).not.toHaveBeenCalled();

    installedCount.value = 0;
    promise.close('close');
    await settled(promise);
  });
});
