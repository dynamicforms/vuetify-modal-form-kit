---
outline: [2, 3]
---

# `modal` service

`modal` opens dialogs from code. The dialogs are drawn by one [`<modal-view />`](./modal-view) mounted in the app
root. A dialog opened before `<modal-view>` mounts, or left on the stack when it unmounts, is drawn when a
`<modal-view>` mounts. A dialog opened while no `<modal-view>` is mounted by the end of the tick logs a console
warning; until one mounts it is not displayed, and only the promise's `.close(value)` settles it.

```typescript
import { modal } from '@dynamicforms/vuetify-modal-form-kit';

const result = await modal.message('Done', 'Your changes have been saved.');
```

## Methods

| Method | Signature | Description |
|---|---|---|
| `message` | `message(title, message, options?)` | Shows a message dialog. Gets a single `close` action unless `options.actions` or `options.form` states an action that is [drawn](#actions). |
| `yesNo` | `yesNo(title, message, options?)` | Shows a confirmation dialog with `yes` / `no` actions unless `options.actions` or `options.form` states an action that is [drawn](#actions). |
| `custom` | `custom(title, component, componentProps, options?)` | `message()` with a component and its `componentProps` as the body - see [`custom()`](#custom). |
| `isTop` | `isTop(promise)` | `true` while the dialog behind that promise is the one on top of the stack. |
| `isInstalled` | `isInstalled()` | `true` once a `<modal-view>` is mounted. Without one, no dialog renders and no action can resolve one, so `.close(value)` is the only way to settle its promise. |

`title` and `message` take a string, an `MdString` (Markdown), an `HtmlString` (HTML, not sanitized), a
`SimpleComponentDef`, or a `RenderableValue` holding one of these (e.g. to add a CSS class); all five are exported by
`@dynamicforms/vuetify-inputs`. The component a `SimpleComponentDef` at the top of `message` names is resolved
against `options.components`, then the `df-*` components, then the globally registered ones; a component nested in
its children, or in `title`, must be registered globally. `message()`, `yesNo()` and `custom()` return a
[`CloseablePromise`](#closeablepromise).

### `custom()`

`component` is a component, or the name of one, resolved as a `SimpleComponentDef`'s at the top of `message`. A
component given as such needs no registration. `options` is a `CustomOptions`: `ModalOptions` with `model`, whose
refs are two-way bound props of the component. Each ref is passed as the prop of its key, and the component's
`update:<key>` event writes the ref:

```typescript
import ContactPicker from './contact-picker.vue';

const contactId = ref<number | null>(null);
if ((await modal.custom('Call', ContactPicker, { clubId }, { model: { contactId } })) === 'close') {
  call(contactId.value);
}
```

## `CloseablePromise`

`import type { CloseablePromise, DialogProps } from '@dynamicforms/vuetify-modal-form-kit'`

A `CloseablePromise<string>` resolves to the name of the action that settled the dialog: its field name when it is a
member of `options.form`, otherwise its key in `options.actions` (e.g. `'close'`, `'yes'`, `'no'`). The `name` in an
`Action`'s value is not used for this. The promise also has:

| Member | Description |
|---|---|
| `.close(value)` | Closes the dialog and resolves the promise with `value`. |
| `.dialogId` | `symbol` identifying this dialog in the internal stack. |
| `.payload` | What the executor of the settling action returned. `undefined` before the dialog settles, after `.close(value)`, and where the executor returned `null` or `undefined`. |
| `.props` | `DialogProps`: the dialog's properties, readable and writable while it is open - see [Changing an open dialog](#changing-an-open-dialog). |

### Getting data out of a dialog

The promise resolves with the action's name, a `string`. What the action's executor returned is on `.payload`,
read off the promise after awaiting it:

```typescript
const save = new Action({ value: { label: 'Save', defaultConfirm: true } });
save.registerAction(new Form.ExecuteAction(async () => api.save(form.value)));

const dialog = modal.message('Edit', 'change what you need', { form, actions: { save } });
if ((await dialog) === 'save') {
  const record = dialog.payload;   // what the save executor answered
}
```

A dialog given a `form` edits that `Form.Group`, so what the user entered is read from the group after the dialog
settles. `.payload` holds what the action computed.

### Saving from a dialog

A `SubmitAction` of `@dynamicforms/vue-forms` on the dialog's action sends the form and keeps the dialog open until
the handler succeeds:

```typescript
const save = new Action({ value: { label: 'Save', defaultConfirm: true } });
const form = new Form.Group({ name: new Form.Field({ value: '' }), save });
save.registerAction(new Form.SubmitAction(form, async (value) => {
  try {
    return await api.save(value);
  } catch (error) {
    // the field errors go to the fields, the rest to the group
    form.fields.name.errors = [new Form.ValidationError('taken', {}, 'Name is taken', 'server')];
    form.errors = [new Form.ValidationError('conflict', {}, 'Saved by someone else', 'server')];
    throw error;
  }
}));

const dialog = modal.message('Edit', '', { form });
if ((await dialog) === 'save') {
  const record = (dialog.payload as Form.SubmitResult).received;   // what the handler returned
}
```

- While the form is invalid, `execute()` resolves with a `SubmitRefusedException` and the dialog stays open.
- While the handler runs, the action is `busy`, its button shows `loading`, and the form is `'readonly'`.
- A handler that throws ends the submit with a `SubmitFailedException`; the dialog stays open and shows the errors
  the handler wrote. The errors of the group itself are drawn below the body (see
  [`df-modal` slots](./df-modal#slots)).
- A handler that returns settles the dialog with the action's name, and `.payload` is the `SubmitResult`.

### Changing an open dialog

`.props` holds the dialog's properties. Each one is reactive, and a write changes the dialog on screen:

| Property | Read as | Written as |
|---|---|---|
| `title`, `message` | `RenderableValue` | anything `title` and `message` accept in a [method](#methods) |
| `size` | `DialogSize` | `DialogSizeName`; a name of no size is `'default'` |
| `form` | `Form.Group \| undefined` | the same |
| `actions` | `FormActions` | the same |
| `color`, `icon` | `string \| undefined` | the same |
| `components` | `Record<string \| symbol, any> \| undefined` | the same |

`actions` holds the dialog's default actions (`close`, or `yes` / `no`) merged under `options.actions`. A write
replaces the set; the default actions are not added again. The dialog draws `actions` and the `Action` members of
`form` whose names `actions` does not hold, and is settled by the actions of the new set.

```typescript
const dialog = modal.message('Import', 'Reading the file');
const rows = await readRows(file);
dialog.props.message = `Importing ${rows.length} rows`;
dialog.props.size = 'large';
```

### `useDialog()`

`useDialog()`, called in `setup()` of a component in the dialog body - the component `custom()` names, or one the
layout of `form` renders - returns the promise of that dialog, with its `props` and `close()`. Outside the body of a
dialog `<modal-view>` draws it returns `undefined`:

```typescript
import { useDialog } from '@dynamicforms/vuetify-modal-form-kit';

const dialog = useDialog();
function next() {
  dialog!.props.title = 'Step 2';
}
```

## `ModalOptions`

Passed as the last argument to `message()` / `yesNo()` / `custom()`.

| Option | Type | Description |
|---|---|---|
| `form` | `Form.Group` | A `@dynamicforms/vue-forms` group drawn in the dialog body, one input per `Field` member - see [the generated layout](./modal-view#the-generated-layout). Its `Action` members are the dialog's buttons - see [Actions](#actions). |
| `actions` | `FormActions` (`Record<string, Form.Action>`) | The dialog's actions, keyed by name, merged over the default ones (`close`, or `yes` / `no`). The default ones are added only where none of the caller's actions is drawn - see [Actions](#actions). An action given here and as a member of `form` settles the dialog with its field name - see [Which name settles the dialog](#which-name-settles-the-dialog). |
| `size` | `DialogSizeName` | `'small'`, `'medium'`, `'large'` or `'x-large'`, or one of their shorter names - see [`DialogSize`](#dialogsize). Defaults to `'default'`. |
| `color` | `string` | The `color` of the title bar's `v-sheet`. Where unset, the default set with [`setDfModalDefaults`](./df-modal#global-defaults). |
| `icon` | `string` | Icon shown before the title. |
| `components` | `Record<string \| symbol, any>` | Components the dialog body resolves names against, before the `df-*` components of [`@dynamicforms/vuetify-inputs`](:vuetify-inputs:): the [generated layout](./modal-view#the-generated-layout) of `form`, `custom()`'s component and a `SimpleComponentDef` at the top of `message`. A component given here needs no global registration; a `df-*` name given here replaces that component in this dialog. |

### Which name settles the dialog

An action passed both as a member of `options.form` and under a key of `options.actions` has two names. The dialog
resolves with the field name:

```typescript
const submit = new Action({ value: { label: 'Send', defaultConfirm: true } });
const form = new Form.Group({ submit });                  // field name: 'submit'

await modal.message('Subscribe', 'your address', { form, actions: { send: submit } });
// resolves with 'submit', never with 'send'
```

To get the key back, give the form member the same name.

## Actions

A dialog's buttons are drawn by `<df-actions>` of [`@dynamicforms/vuetify-inputs`](:vuetify-inputs:). An action is
a `@dynamicforms/vue-forms` `Action` or the vuetify-inputs subclass of it; the subclass adds breakpoint-resolved
render options, such as a text link or a confirm / reject colour:

```typescript
import { AbortEventHandlingException, ExecuteAction, Field, Group } from '@dynamicforms/vue-forms';
import { Action } from '@dynamicforms/vuetify-inputs';

const submit = new Action({ value: { label: 'Send', defaultConfirm: true } });
const form = new Group({ email: new Field({ value: '', label: 'Email address' }), submit });

await modal.message('Subscribe', 'Enter your email address:', { form });   // resolves with 'submit'
```

`action.execute()` called from code settles the dialog as a click on its button does.

The dialog adds its default actions - `close`, or `yes` / `no` - when none of the caller's actions has visibility
`'full'`. `<df-actions>` does not draw an action at `'suppress'` and hides one at `'hidden'` (`d-none`) or
`'invisible'` (`invisible`), and the keyboard reaches only `'full'`, so without the default actions such a dialog
could not be closed. The visibility is read when the dialog opens: changing it later does not add or remove the
default actions.

`await action.execute()` returns what the action's `ExecuteAction` chain returned; a dialog does not change it:

```typescript
submit.registerAction(new ExecuteAction(async () => ({ id: 42 })));

const promise = modal.message('Subscribe', 'Enter your email address:', { form });
await submit.execute();   // { id: 42 }
await promise;            // 'submit'
```

A handler that throws `AbortEventHandlingException` keeps the dialog open: `execute()` resolves with the exception
instead of rejecting, for a synchronous and an `async` handler alike. Use it to refuse closing, e.g. while the form
is invalid:

```typescript
submit.registerAction(new ExecuteAction((action, supr, ...params) => {
  if (!form.valid) throw new AbortEventHandlingException('fix the errors first');
  return supr(action, ...params);
}));

const pending = modal.message('Subscribe', 'Enter your email address:', { form });
const answer = await submit.execute();
// answer is the AbortEventHandlingException, and the dialog behind `pending` is still on screen
```

The dialog registers an `ExecuteAction` on each of its actions that settles the dialog. It settles the dialog only
for the element it is registered on, not for another binding of the same action, and only while the dialog is on top
of the stack. It is unregistered when the dialog settles and when a write to `props.actions` or `props.form` removes
the action from the dialog, so an `Action` reused across dialogs - a module-level one, or a form reused for every
call - does not accumulate handlers.

## `DialogSize`

`import type { DialogSize, DialogSizeName } from '@dynamicforms/vuetify-modal-form-kit'`

`DialogSize` is `'small' | 'medium' | 'large' | 'x-large' | 'default'`. `defaultDialogSize` is `'default'`, and
`dialogSizes` lists the five.

`ModalOptions.size` and `df-modal`'s [`size` prop](./df-modal#props) take a `DialogSizeName`: a size, or one of its
shorter names.

| Size | Shorter names | Width | Fullscreen below |
|---|---|---|---|
| `'small'` | `'sm'`, `'modal-sm'` | 400px | `sm` |
| `'medium'` | `'md'`, `'modal-md'` | 600px | `md` |
| `'large'` | `'lg'`, `'modal-lg'` | 800px | `lg` |
| `'x-large'` | `'xl'`, `'modal-xl'` | 1140px | `xl` |
| `'default'` | none | the content's | never |

`DialogSizeName` is typed so that an editor lists the five sizes and accepts the shorter names.
`resolveDialogSize(name)` returns the size a name names. Anything that names none resolves to `'default'`, with a console warning naming it, once per
name. `isDialogSize(value)` answers whether a value names a size.

```typescript
import { modal } from '@dynamicforms/vuetify-modal-form-kit';

await modal.message('Information', 'This is a large dialog', { size: 'large' });
```

## Examples

[Modal Dialog](/examples/dialog-basic) has examples of message dialogs, confirmations, Markdown content, form
dialogs, custom components, sizes and changing an open dialog.
