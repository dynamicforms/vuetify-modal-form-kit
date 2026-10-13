# `<df-modal>`

The dialog component. Use it to declare a dialog in a template, opened and closed with `v-model` (see
[Template Dialog](/examples/dialog-template)). [`<modal-view>`](./modal-view) renders it for the dialogs of the
[`modal` service](./modal-service); those need no `<df-modal>` of your own.

```vue
<!-- title is a RenderableValue: const title = new RenderableValue('Log in') -->
<df-modal v-model="isOpen" :title="title" :actions="actions" icon="mdi-login">
  <template #body>...</template>
  <template #actions>
    <df-actions :actions="actions" class="d-flex justify-end" style="gap: 0.5em" />
  </template>
</df-modal>
```

## Props

`DfModalProps` and `DfModalSlots` are exported, for a component that wraps `<df-modal>` and forwards its props and
slots.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | `boolean` | `false` | Controls visibility. Use with `v-model`. |
| `size` | `DialogSizeName` | `'default'` | `'small'`, `'medium'`, `'large'` or `'x-large'`, or one of their shorter names (see [`DialogSize`](./modal-service#dialogsize)). Each of those switches to fullscreen below its own breakpoint; `'default'` sizes itself to its content and never does. Anything else is `'default'`, with a console warning. |
| `formControl` | `Form.Group` | — | Passed to the `body` slot as `formControl`. `df-modal` renders no form from it. |
| `dialogId` | `symbol` | — | The stack entry of a dialog of the `modal` service, set by `<modal-view>`. Leave it unset for a template dialog. `df-modal` pushes and removes the entry of a template dialog only; one it was given a `dialogId` for stays on the stack when it unmounts. A `model-value` going false removes the entry in both cases. |
| `title` | `RenderableValue` | — | Dialog title. Accepts plain text, Markdown (`MdString`), HTML (`HtmlString`), or a custom component. Falls back to the `title` slot if omitted. |
| `color` | `string` | — | Title bar background color. Falls back to the global default set through [`setDfModalDefaults`](#global-defaults) where unset. |
| `icon` | `string` | — | Icon shown next to the title. |
| `actions` | `Form.Action[]` | `[]` | The actions the [keyboard shortcuts](#keyboard-shortcuts) and the close button reach. It renders nothing; render the same array through `<df-actions>` in the `actions` slot. |

## Emits

| Event | Payload | Description |
|-------|---------|-------------|
| `update:model-value` | `boolean` | The dialog opens (`true`) or closes (`false`). Used by `v-model`. |

## Slots

| Slot | Scope | Description |
|------|-------|-------------|
| `title` | — | Overrides the default title rendering (a `MessagesWidget` fed from the `title` prop). |
| `body` | `{ formControl }` | The dialog's content. |
| `actions` | — | The dialog's buttons. Render the `actions` prop's array here through `<df-actions>` rather than with `v-btn`s, so a click and a keystroke reach the same action - see [Template Dialog → Keep actions consistent](/examples/dialog-template#keep-actions-consistent-always-render-them-through-df-actions), and [`@dynamicforms/vuetify-inputs`](:vuetify-inputs:) for the `Action` / `df-actions` API. |

Dialogs share one stack, and a `df-modal` is shown only while its entry is on top, so of several open
`<df-modal>`s one is on screen. A template dialog's entry is pushed when `model-value` goes true and removed when it
goes false or the component unmounts. A dialog of the [`modal` service](./modal-service) is pushed and removed by
the service and stays on the stack when the `df-modal` drawing it unmounts; the next
[`<modal-view>`](./modal-view) that mounts draws it again.

## Global defaults

`setDfModalDefaults` sets the values a `<df-modal>` uses for a prop it is not given, directly or through the
[`modal` service](./modal-service)'s `ModalOptions`:

```typescript
import { setDfModalDefaults } from '@dynamicforms/vuetify-modal-form-kit';

setDfModalDefaults({ titleColor: 'primary' });
```

| Default | Falls back for | Description |
|---|---|---|
| `titleColor` | `color` | Title bar background color applied where a dialog states none of its own. |

The defaults are reactive: a later call changes every open and future dialog that states no `color` of its own.
`DynamicFormsModalFormKit.install()` takes the same object as `modalDefaults` (see
[Getting Started](/guide/getting-started)). `setDfModalDefaults` does not depend on `install()`: a `<df-modal>`
used without `app.use(DynamicFormsModalFormKit)` reads the defaults as well.

## The close button

The `x` in the title bar runs the action Escape runs: the `defaultReject` action of the `actions` prop that is
[reachable](#keyboard-shortcuts). The dialog draws the `x` only while there is such an action. A dialog of the
`modal` service therefore settles from the `x` with that action's key - `'close'` from `modal.message()`, `'no'`
from `modal.yesNo()`.

To give a dialog an `x`, give it a `defaultReject` action, e.g. `Action.closeAction()`; the same action answers
Escape. There is no prop for the `x`: the button and the keystroke are present or absent together.

## Keyboard shortcuts

`df-modal` listens to `keydown` on the document while it is mounted, and acts on a key only while it is shown and
its overlay is the topmost one:

- **Enter** executes the reachable action of the `actions` prop whose value states `defaultConfirm: true`. It does
  nothing while focus is in a `<textarea>` or a `contenteditable` element, which take Enter as a newline.
- **Escape** executes the reachable action whose value states `defaultReject: true`. The dialog is `persistent`, so
  without such an action Escape does nothing.

Key repeats and keystrokes whose default was already prevented are ignored: one press starts one run.

An overlay above the dialog - a `<df-select>` menu, a `<df-date-time>` picker - is a Vuetify overlay of its own.
Vuetify closes it on Escape from a `window` listener without calling `preventDefault()`, so the dialog receives the
same keystroke. The dialog's overlay root has the class `df-modal`, and Enter and Escape act only while an overlay of
that class has the highest z-index in `.v-overlay-container`; tooltips and snackbars are not counted. Closing a menu
and then the dialog takes two Escapes.

An action is reachable when all three hold:

| Read | Reachable when |
|---|---|
| `effectiveEnabled` | `true`: the action and every container above it have `access` `'editable'`. A `Group` that is not editable takes all its actions out of reach. |
| `visibility` | `'full'`. An action at `'hidden'`, `'invisible'` or `'suppress'` is not on screen and not reachable. |
| `busy` | `false`. `busy` is `true` from the call to `execute()` until the run settles, so a second Enter does not start a second run. |

`<df-actions>` disables a button on `effectiveEnabled` and `busy`, and shows it `loading` while the action is busy.

A handler that rejects is passed to `app.config.errorHandler`, with `'df-modal keyboard shortcut'` as the info
string, or to `console.error` where the app has no handler; a document listener has no Vue error handling of its
own. A handler that ends the run with an `AbortEventHandlingException` does not reject: `execute()` resolves with the
exception, for a synchronous and an `async` handler alike, and neither route is used.

`defaultConfirm` and `defaultReject` are set on the action's `value`. In `<df-actions>` they also set the button's
color, `primary` and `secondary` (see [`@dynamicforms/vuetify-inputs`](:vuetify-inputs:)):

```typescript
const loginAction = new Action({ value: { name: 'login', label: 'Log in', defaultConfirm: true /* ... */ } });
```

The dialog reads the two flags with vuetify-inputs' `getRenderOptionsForBreakpoint()`, the function `<df-actions>`
draws the button with. `ActionBreakpointRenderOptions` does not include them, so a flag stated inside a breakpoint is
a type error, and the screen width does not change which action Enter or Escape runs. Because the flags are read off
`value`, an `Action` of vue-forms and the vuetify-inputs subclass both state them; the subclass adds the
breakpoint-resolved render options.

Enter and Escape call `execute()` on the same `Action` instance a click on the `<df-actions>` button does. This holds
for `<df-modal>` in a template (see [Template Dialog](/examples/dialog-template#keyboard-shortcuts)) and for the
dialogs of the `modal` service, where [`<modal-view>`](./modal-view) passes the actions to both.
