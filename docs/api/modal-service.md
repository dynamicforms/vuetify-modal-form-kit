# `modal` service

The programmatic entry point for opening dialogs from code, without declaring anything in a template. Requires a
single [`<modal-view />`](./modal-view) mounted in your app root. A dialog opened before `<modal-view>` mounts is
picked up as soon as it does; one opened while none is mounted at all logs a console warning, is never displayed,
and can only be settled through the returned promise's own `.close(value)`.

```typescript
import { modal } from '@dynamicforms/vuetify-modal-form-kit';

const result = await modal.message('Done', 'Your changes have been saved.');
```

Every method returns a `CloseablePromise<string>` - a `Promise` that resolves to the key the action that closed the
dialog is registered under: its field name when it is part of `options.form`, otherwise its key in
`options.actions` (e.g. `'close'`, `'yes'`, `'no'`). An `Action`'s own `name` value is informational and plays no
part in this, so keep the two in sync if you set both. The promise also carries:

| Member | Description |
|---|---|
| `.close(value)` | Closes the dialog from outside, resolving the promise with `value`. |
| `.dialogId` | `symbol` identifying this dialog in the internal stack. |

## Methods

| Method | Signature | Description |
|---|---|---|
| `message` | `message(title, message, options?)` | Shows a message dialog. Gets a single `close` action unless `options.actions` states one, or `options.form` carries an `Action` the dialog can render. |
| `yesNo` | `yesNo(title, message, options?)` | Shows a confirmation dialog with `yes` / `no` actions unless `options.actions` states its own, or `options.form` carries an `Action` the dialog can render. |
| `custom` | `custom(title, componentName, componentProps, options?)` | Shorthand for `message()` that renders a registered component (`componentName`) with `componentProps` as the body. |
| `isTop` | `isTop(promise)` | `true` while the dialog behind that promise is the one on top of the stack. |
| `isInstalled` | `isInstalled()` | `true` once a `<modal-view>` is mounted. Without one, no dialog renders and no action can resolve one, so `.close(value)` is the only way to settle its promise. |

`title` and `message` accept a plain string, `MdString` (Markdown), a `SimpleComponentDef`, or a `RenderableValue`
wrapping any of those (e.g. to attach an extra CSS class).

## `ModalOptions`

Passed as the last argument to `message()` / `yesNo()` / `custom()`.

| Option | Type | Description |
|---|---|---|
| `form` | `Form.Group` | A `@dynamicforms/vue-forms` group rendered as the dialog body, one `<df-input>` per `Field` member - see [`<modal-view>`](./modal-view#what-it-actually-does) for what the generated layout covers. Its `Action` members become the dialog's buttons - see [Actions](#actions) for which of them are drawn. |
| `actions` | `Record<string, Action>` | Explicit actions to show, keyed by name. `Action` is `@dynamicforms/vuetify-inputs`'. Merged over the defaults (`close`, or `yes` / `no`). |
| `size` | `DialogSize` | One of `DialogSize.SMALL` / `MEDIUM` / `LARGE` / `X_LARGE`. Defaults to `DialogSize.DEFAULT`. |
| `color` | `string` | Passed straight to the title bar's `v-sheet` `color` prop. |
| `icon` | `string` | Icon shown next to the title. |

## Actions

A dialog's buttons are drawn by `<df-actions>`, which reads the breakpoint-resolved options only
[`@dynamicforms/vuetify-inputs`](:vuetify-inputs:)' `Action` carries. That class is what `options.actions` takes and
what an `Action` member of `options.form` has to be to appear as a button:

```typescript
import { AbortEventHandlingException, ExecuteAction, Field, Group } from '@dynamicforms/vue-forms';
import { Action } from '@dynamicforms/vuetify-inputs';

const submit = new Action({ value: { label: 'Send', defaultConfirm: true } });
const form = new Group({ email: new Field({ value: '', label: 'Email address' }), submit });

await modal.message('Subscribe', 'Enter your email address:', { form });   // resolves with 'submit'
```

An `Action` of either class is drawn;
executing it from your own code still settles the dialog. A form that carries nothing but such an action therefore
still opens with the default button, because a dialog with no button on screen leaves the user nothing to settle
it with.

`await action.execute()` answers what the action's own `ExecuteAction` chain returned - handing an action to a
dialog changes neither what it runs nor what it reports:

```typescript
submit.registerAction(new ExecuteAction(async () => ({ id: 42 })));

const promise = modal.message('Subscribe', 'Enter your email address:', { form });
await submit.execute();   // { id: 42 }
await promise;            // 'submit'
```

An `AbortEventHandlingException` is an answer rather than a rejection: `execute()` resolves with the exception and
the dialog stays open, which is how a handler refuses to close it - a validation that has not passed, for one.

```typescript
submit.registerAction(new ExecuteAction((action, supr, ...params) => {
  if (!form.valid) throw new AbortEventHandlingException('fix the errors first');
  return supr(action, ...params);
}));

const pending = modal.message('Subscribe', 'Enter your email address:', { form });
const answer = await submit.execute();
// answer is the AbortEventHandlingException, and the dialog behind `pending` is still on screen
```

The resolver a dialog attaches belongs to that dialog: it answers for the element it was registered on and for no
sibling binding of it, only while its own dialog is the one on screen, and it is dropped again when the dialog
settles. An `Action` kept across openings - a module-level one, or a form reused for every call - collects nothing
over repeated dialogs.

## `DialogSize`

`import { DialogSize } from '@dynamicforms/vuetify-modal-form-kit'`

Enum with `SMALL`, `MEDIUM`, `LARGE`, `X_LARGE` and `DEFAULT` members, accepted by both `ModalOptions.size` and
`df-modal`'s [`size` prop](./df-modal#props). Each of the four explicit sizes switches to fullscreen below its own
breakpoint; `DEFAULT` sizes itself to its content and never does.

`defaultDialogSize` is exported alongside it as the value `DEFAULT` stands for. `DialogSize.fromString('lg')`
turns a `'large'` / `'lg'` / `'modal-lg'`-style string into the enum, falling back to `defaultDialogSize` for a
string it does not recognise (and for `undefined`).

`DialogSize.isDefined(size)` reports whether the value actually names a size: a number must be one of the enum's
values, and a string must be one of the recognised identifiers. `DEFAULT` has no string identifier, so
`isDefined('default')` is `false` even though `fromString('default')` returns `DEFAULT` through its fallback.

```typescript
import { modal, DialogSize } from '@dynamicforms/vuetify-modal-form-kit';

await modal.message('Information', 'This is a large dialog', { size: DialogSize.LARGE });
```

## Examples

See [Modal Dialog](/examples/dialog-basic) for worked examples of message dialogs, confirmations, Markdown
content, form dialogs, custom components, and sizing.
