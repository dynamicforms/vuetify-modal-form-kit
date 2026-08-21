import * as Form from '@dynamicforms/vue-forms';
import { Action, ActionRenderOptions } from '@dynamicforms/vuetify-inputs';
import { vi } from 'vitest';
import { nextTick } from 'vue';

import modal, { currentModal, mountedViews } from './api';
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
    // the flags are the action's value, which is where <df-actions> and <df-modal>'s keyboard read them
    expect((<ActionRenderOptions>actions.yes.value).defaultConfirm).toBe(true);
    expect((<ActionRenderOptions>actions.no.value).defaultReject).toBe(true);

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

  it('states a default action where the only one the form declares cannot be reached', async () => {
    const submit = new Action({
      value: { label: 'Send', defaultConfirm: true },
      visibility: Form.DisplayMode.SUPPRESS,
    });
    const form = new Form.Group({ submit });

    // <df-actions> draws nothing for an action at SUPPRESS, so a dialog counting it would be on screen with no
    // button on it and no keyboard route out
    const suppressed = modal.message('Subscribe', 'Enter your email address:', { form });
    expect(Object.keys(currentModal.value!.actions!)).toEqual(['close', 'submit']);

    currentModal.value!.actions!.close.execute(null);
    expect(await settled(suppressed)).toBe('close');

    // the same form with the action drawn: the caller states the way out, and the dialog adds none
    submit.visibility = Form.DisplayMode.FULL;
    const drawn = modal.message('Subscribe', 'Enter your email address:', { form });
    expect(Object.keys(currentModal.value!.actions!)).toEqual(['submit']);

    await submit.execute(null);
    expect(await settled(drawn)).toBe('submit');
  });

  it('states its yes / no where every action the caller passed is suppressed', async () => {
    const later = new Action({ value: { label: 'Later' }, visibility: Form.DisplayMode.SUPPRESS });

    const promise = modal.yesNo('Delete item', 'This cannot be undone. Continue?', { actions: { later } });
    expect(Object.keys(currentModal.value!.actions!)).toEqual(['yes', 'no', 'later']);

    currentModal.value!.actions!.no.execute(null);
    expect(await settled(promise)).toBe('no');
  });

  it('states a default action for one drawn where no click or keystroke reaches it', async () => {
    // <df-actions> draws a HIDDEN action as `d-none` and an INVISIBLE one as `visibility: hidden`, and the
    // keyboard answers FULL alone: a dialog counting either would be on screen with no way out of it
    for (const visibility of [Form.DisplayMode.HIDDEN, Form.DisplayMode.INVISIBLE]) {
      const later = new Action({ value: { label: 'Later' }, visibility });

      const promise = modal.yesNo('Delete item', 'This cannot be undone. Continue?', { actions: { later } });
      expect(Object.keys(currentModal.value!.actions!)).toEqual(['yes', 'no', 'later']);

      currentModal.value!.actions!.no.execute(null);
      expect(await settled(promise)).toBe('no');
    }
  });

  it('carries what the settling action returned, beside the key it resolved with', async () => {
    const submit = new Action({ value: { label: 'Send' } });
    submit.registerAction(new Form.ExecuteAction(async () => ({ id: 42, stored: true })));
    const form = new Form.Group({ submit });

    const dialog = modal.message('Subscribe', 'Enter your email address:', { form });
    await submit.execute(null);

    // the dialog resolves with the key, which stays a string a switch reads; the payload is beside it
    expect(await settled(dialog)).toBe('submit');
    expect(dialog.payload).toEqual({ id: 42, stored: true });
  });

  it('carries no payload where the action produced none, or the dialog was closed from outside', async () => {
    const submit = new Action({ value: { label: 'Send' } });
    const form = new Form.Group({ submit });

    const answered = modal.message('Subscribe', 'again', { form });
    await submit.execute(null);
    await settled(answered);
    expect(answered.payload).toBeUndefined();

    const closed = modal.message('Working', 'Please wait...');
    closed.close('cancelled');
    await settled(closed);
    expect(closed.payload).toBeUndefined();
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
    mountedViews.value = [Symbol('view')];
    const rendered = modal.message('On screen', 'a view is mounted');
    await nextTick();
    expect(warn).not.toHaveBeenCalled();
    mountedViews.value = [];

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

  it('lets an ordinary failure reject, and leaves the dialog open', async () => {
    const failure = new Error('the backend said no');
    const submit = new Action({ value: { label: 'Send' } });
    submit.registerAction(
      new Form.ExecuteAction(() => {
        throw failure;
      }),
    );
    const form = new Form.Group({ submit });

    const promise = modal.message('Subscribe', 'Enter your email address:', { form });

    // only an abort is an answer; anything else is the caller's to handle, and settles nothing
    await expect(submit.execute(null)).rejects.toBe(failure);
    expect(currentModal.value!.dialogId).toBe(promise.dialogId);

    promise.close('close');
    await settled(promise);
  });

  it('renders an action declared as a vue-forms Action', async () => {
    const warn = vi.mocked(console.warn);
    // <df-actions> draws a button from the action's value, so the subclass @dynamicforms/vuetify-inputs exports
    // is what an action needs to render responsively, not what it needs to be drawn
    const submit = new Form.Action({ value: { label: 'Send' } });
    const form = new Form.Group({ submit });

    const promise = modal.message('Subscribe', 'Enter your email address:', { form });

    expect(Object.keys(currentModal.value!.actions!)).toEqual(['submit']);
    expect(currentModal.value!.actions!.submit).toBe(submit);
    expect(warn).not.toHaveBeenCalled();

    await submit.execute(null);
    expect(await settled(promise)).toBe('submit');
  });

  it('does not settle a dialog that stopped being the one on screen while its executor ran', async () => {
    const submit = new Action({ value: { label: 'Send' } });
    let release: (value: string) => void = () => {};
    submit.registerAction(
      new Form.ExecuteAction(
        () =>
          new Promise<string>((resolve) => {
            release = resolve;
          }),
      ),
    );
    const form = new Form.Group({ submit });

    const first = modal.message('Subscribe', 'Enter your email address:', { form });
    const running = submit.execute(null);

    // a dialog opens over it while the executor is still in flight, so by the time the executor answers the
    // question the resolver was asked - is this dialog the one the user is looking at - has a different answer
    const second = modal.message('Second', 'on top');
    release('stored');
    expect(await running).toBe('stored');

    await nextTick();
    await nextTick();
    expect(currentModal.value!.dialogId).toBe(second.dialogId);

    second.close('close');
    await settled(second);
    expect(currentModal.value!.dialogId).toBe(first.dialogId);

    first.close('cancelled');
    expect(await settled(first)).toBe('cancelled');
  });

  it('registers one resolver on an action the form and the caller both name', async () => {
    const submit = new Action({ value: { label: 'Send' } });
    const form = new Form.Group({ submit });
    const runs: string[] = [];
    submit.registerAction(
      new Form.ExecuteAction((field, supr, ...params) => {
        runs.push('executor');
        return supr(field, ...params);
      }),
    );

    // the same instance, reachable under the form's field name and under the caller's key
    const promise = modal.message('Subscribe', 'again', { form, actions: { submit } });
    await submit.execute(null);

    expect(runs).toEqual(['executor']);
    expect(await settled(promise)).toBe('submit');
    expect(currentModal.value).toBeNull();
  });

  it('stays silent when a view is installed within the same tick as the open', async () => {
    const warn = vi.mocked(console.warn);

    const promise = modal.message('Opened first', 'the view mounts right after');
    mountedViews.value = [Symbol('view')];
    await nextTick();
    expect(warn).not.toHaveBeenCalled();

    mountedViews.value = [];
    promise.close('close');
    await settled(promise);
  });
});
