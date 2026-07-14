# `modal` service

The programmatic entry point for opening dialogs from code, without declaring anything in a template. Requires a
single [`<modal-view />`](./modal-view) mounted in your app root.

```typescript
import { modal } from '@dynamicforms/vuetify-modal-form-kit';

const result = await modal.message('Done', 'Your changes have been saved.');
```

Every method returns a `CloseablePromise<string>` - a `Promise` that resolves to the name of the action that closed
the dialog (e.g. `'close'`, `'yes'`, `'no'`, or a custom action's name), plus:

| Member | Description |
|---|---|
| `.close(value)` | Closes the dialog from outside, resolving the promise with `value`. |
| `.dialogId` | `symbol` identifying this dialog in the internal stack. |

## Methods

| Method | Signature | Description |
|---|---|---|
| `message` | `message(title, message, options?)` | Shows a message dialog. Gets a single `close` action unless `options.form` or `options.actions` define their own. |
| `yesNo` | `yesNo(title, message, options?)` | Shows a confirmation dialog with `yes` / `no` actions unless `options.form` or `options.actions` define their own. |
| `custom` | `custom(title, componentName, componentProps, options?)` | Shorthand for `message()` that renders a registered component (`componentName`) with `componentProps` as the body. |

`title` and `message` accept a plain string, `MdString` (Markdown), a `SimpleComponentDef`, or a `RenderableValue`
wrapping any of those (e.g. to attach an extra CSS class).

## `ModalOptions`

Passed as the last argument to `message()` / `yesNo()` / `custom()`.

| Option | Type | Description |
|---|---|---|
| `form` | `Form.Group` | A `@dynamicforms/vue-forms` group rendered as the dialog body. Any `Action` fields on it are used as the dialog's actions. |
| `actions` | `Record<string, Action>` | Explicit actions to show, keyed by name. Merged over the defaults (`close`, or `yes` / `no`). |
| `size` | `DialogSize` | One of `DialogSize.SMALL` / `MEDIUM` / `LARGE` / `X_LARGE`. Defaults to `DialogSize.DEFAULT`. |
| `color` | `string` | Passed straight to the title bar's `v-sheet` `color` prop. |
| `icon` | `string` | Icon shown next to the title. |

## `DialogSize`

`import { DialogSize } from '@dynamicforms/vuetify-modal-form-kit'`

Enum with `SMALL`, `MEDIUM`, `LARGE`, `X_LARGE` and `DEFAULT` members, accepted by both `ModalOptions.size` and
`df-modal`'s [`size` prop](./df-modal#props). On small screens the dialog automatically switches to fullscreen
regardless of the configured size.

```typescript
import { modal, DialogSize } from '@dynamicforms/vuetify-modal-form-kit';

await modal.message('Information', 'This is a large dialog', { size: DialogSize.LARGE });
```

## Examples

See [Modal Dialog](/examples/dialog-basic) for worked examples of message dialogs, confirmations, Markdown
content, form dialogs, custom components, and sizing.
