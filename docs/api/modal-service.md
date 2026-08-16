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
| `message` | `message(title, message, options?)` | Shows a message dialog. Gets a single `close` action unless `options.form` or `options.actions` define their own. |
| `yesNo` | `yesNo(title, message, options?)` | Shows a confirmation dialog with `yes` / `no` actions unless `options.form` or `options.actions` define their own. |
| `custom` | `custom(title, componentName, componentProps, options?)` | Shorthand for `message()` that renders a registered component (`componentName`) with `componentProps` as the body. |
| `isTop` | `isTop(promise)` | `true` while the dialog behind that promise is the one on top of the stack. |
| `isInstalled` | `isInstalled()` | `true` once a `<modal-view>` is mounted. Without one, no dialog renders and no action can resolve one, so `.close(value)` is the only way to settle its promise. |

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
