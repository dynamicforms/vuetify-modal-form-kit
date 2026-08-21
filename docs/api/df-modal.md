# `<df-modal>`

The dialog component itself - the building block you reach for when declaring a dialog directly in your own
template (see [Template Dialog](/examples/dialog-template)), controlled with a plain `v-model`.

It's also what [`<modal-view>`](./modal-view) renders internally for dialogs opened via the `modal` service - but
if that's your use case, you don't need to touch `df-modal` directly, see [`modal` service](./modal-service) instead.

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

`DfModalProps` and `DfModalSlots` are exported under those names, for a component that wraps `<df-modal>` and
forwards its props and slots.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | `boolean` | `false` | Controls visibility. Use with `v-model`. |
| `size` | `DialogSize` | `DialogSize.DEFAULT` | One of `DialogSize.SMALL` / `MEDIUM` / `LARGE` / `X_LARGE`. Each of those switches to fullscreen below its own breakpoint; `DEFAULT` sizes itself to its content and never does. |
| `formControl` | `Form.Group` | — | Exposed to the `body` slot as `formControl`; `df-modal` itself doesn't render a form from it. |
| `dialogId` | `symbol` | — | Used internally by the `modal` service to manage the one-dialog-at-a-time stack. Leave unset for template dialogs. It also states who owns the stack entry: `df-modal` pushes only a template dialog's, and leaves one it was given a `dialogId` for on the stack when it unmounts. A `model-value` going false still removes whichever entry the component holds. |
| `title` | `Form.RenderableValue` | — | Dialog title. Accepts plain text, Markdown (`MdString`), or a custom component. Falls back to the `title` slot if omitted. |
| `color` | `string` | — | Title bar background color. |
| `icon` | `string` | — | Icon shown next to the title. |
| `actions` | `Form.Action[]` | `[]` | Drives the [keyboard shortcuts](#keyboard-shortcuts) below. Purely functional - it renders nothing by itself; render the same array through `<df-actions>` in the `actions` slot. |

## Emits

| Event | Payload | Description |
|-------|---------|-------------|
| `update:model-value` | `boolean` | Fired when the dialog should open/close - pair with `v-model`. |

## Slots

| Slot | Scope | Description |
|------|-------|-------------|
| `title` | — | Overrides the default title rendering (a `MessagesWidget` fed from the `title` prop). |
| `body` | `{ formControl }` | The dialog's content. |
| `actions` | — | The dialog's action buttons. **Always** render an `Action[]` through `<df-actions>` here instead of hand-rolled `v-btn`s - see [Template Dialog → Keep actions consistent](/examples/dialog-template#keep-actions-consistent-always-render-them-through-df-actions) for why, and [`@dynamicforms/vuetify-inputs`](:vuetify-inputs:) for the full `Action` / `df-actions` API. |

`df-modal` manages the dialog stack itself - only the top-most dialog by `dialogId` is actually shown - so several
`<df-modal>`s can coexist in the tree without you having to hide the rest by hand. A template dialog's entry is
pushed when `model-value` goes true and removed when it goes false or the component unmounts. A dialog opened
through the [`modal` service](./modal-service) is the service's, and it stays on the stack when the `df-modal`
drawing it unmounts: the definition and the promise behind it outlive the component, and the next
[`<modal-view>`](./modal-view) to mount draws it again.

## The close button

The `x` in the title bar is a second way of reaching the action Escape reaches: the dialog draws it where the
`actions` prop holds a `defaultReject` action that is reachable, and a click runs that action, exactly as the
keystroke does. So a dialog opened through the `modal` service closes with the key its own action carries -
`'close'` from `modal.message()`, `'no'` from `modal.yesNo()` - and the promise settles with it.

A dialog that states no reachable `defaultReject` action carries no `x`, because there would be nothing for it
to do: the button is that action's click-target and settles nothing on its own. Give a dialog an `x` by giving
it the action - `Action.closeAction()`, or any action whose value states `defaultReject` - and the same action
answers the keyboard.

There is no prop for this. Drawing the `x` and reaching the action from Escape are one question, so a dialog
cannot have the keystroke without the button or the button without the keystroke.

## Keyboard shortcuts

`df-modal` installs its own `keydown` listener while it's mounted, and reacts only while it is itself the top-most
shown dialog and nothing is open above it:

- **Enter** executes the action in the `actions` prop with `defaultConfirm` set to `true`, unless focus is in a
  `<textarea>` or a `contenteditable` element (so multi-line text still gets a literal newline).
- **Escape** executes the action with `defaultReject` set to `true`. The dialog is `persistent`, so nothing
  happens on Escape if no action is flagged `defaultReject`.

A key held down repeats, and the repeats are ignored: only the first `keydown` of a press starts a run.

A keystroke an overlay above the dialog answers is not the dialog's. A `<df-select>` menu or a `<df-date-time>`
picker inside the dialog is a Vuetify overlay of its own, and Vuetify closes a non-persistent one on Escape from a
`window` listener without calling `preventDefault()`, so the same keystroke arrives here too. The dialog's own
overlay root carries the class `df-modal`, and Enter and Escape reach an action only while an overlay of that
class holds the highest z-index in `.v-overlay-container` - the reach a click has. Closing the menu and rejecting
the dialog therefore take one Escape each.

An action is reached when all three hold:

| Read | Reached when |
|---|---|
| `effectiveEnabled` | `true` - the action itself is enabled, and so is every container above it. A `Group` set to `enabled = false` therefore takes its actions out of the keyboard's reach without each one being disabled by hand. |
| `visibility` | `DisplayMode.FULL`. An action at `HIDDEN`, `INVISIBLE` or `SUPPRESS` is not something the user can see, so it is not something Enter or Esc reaches either. |
| `busy` | `false`. `busy` is `true` from the call to `execute()` until that run settles, so a second Enter cannot start a second run of a handler that has yet to finish. |

`<df-actions>` disables its button on the same two reads, and draws it `loading` while the action is busy, so a
click reaches exactly what a keystroke reaches.

`execute()` is asynchronous, and a document listener gets none of the wrapping Vue puts around a template
handler. A handler that rejects is therefore routed here to `app.config.errorHandler`, with
`'df-modal keyboard shortcut'` as the info string, and to `console.error` where the app declares no handler. A
handler that ends the run with an `AbortEventHandlingException` is not a rejection: `execute()` resolves with the
exception, whether that handler was synchronous or `async`, so a refusal to act reaches neither route.

Set `defaultConfirm` / `defaultReject` on the action's `value`, the same way the `modal` service does internally
(they also drive that action's color - `primary` / `secondary` - in `<df-actions>`, see
[`@dynamicforms/vuetify-inputs`](:vuetify-inputs:)):

```typescript
const loginAction = new Action({ value: { name: 'login', label: 'Log in', defaultConfirm: true /* ... */ } });
```

The dialog reads the two flags through vuetify-inputs' `getRenderOptionsForBreakpoint()`, the same resolution
`<df-actions>` draws the button from, so the button and the keystroke read one answer. Both flags belong to the
action rather than to a screen width - `ActionBreakpointRenderOptions` leaves them out, so stating one inside a
breakpoint is a type error - and the width therefore never moves which action Enter or Escape reaches.

The `actions` prop and the `actions` slot are fed the *same* `Action` instances - pressing Enter/Esc calls
`.execute()` on exactly the object a click on the matching `<df-actions>` button would call it on, so there's no
separate "keyboard action" concept to keep in sync. The flags are read off the action's `value`, which is where
`<df-actions>` reads them too, so an `Action` of either class states them; the
[`@dynamicforms/vuetify-inputs`](:vuetify-inputs:) subclass is what an action needs in order to carry
breakpoint-resolved render options, not what it needs to be a dialog button.

This applies equally to `<df-modal>` used directly in a template (see
[Template Dialog](/examples/dialog-template#keyboard-shortcuts) for a full worked example) and to dialogs opened
via the `modal` service, where [`<modal-view>`](./modal-view) wires it up for you automatically.
