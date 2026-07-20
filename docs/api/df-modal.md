# `<df-modal>`

The dialog component itself - the building block you reach for when declaring a dialog directly in your own
template (see [Template Dialog](/examples/dialog-template)), controlled with a plain `v-model`.

It's also what [`<modal-view>`](./modal-view) renders internally for dialogs opened via the `modal` service - but
if that's your use case, you don't need to touch `df-modal` directly, see [`modal` service](./modal-service) instead.

```vue
<df-modal v-model="isOpen" title="Log in" :actions="actions" closable icon="mdi-login">
  <template #body>...</template>
  <template #actions>
    <df-actions :actions="actions" class="d-flex justify-end" style="gap: 0.5em" />
  </template>
</df-modal>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | `boolean` | `false` | Controls visibility. Use with `v-model`. |
| `closable` | `boolean` | `false` | Shows a close (`x`) button in the title bar that sets `modelValue` to `false`. |
| `size` | `DialogSize` | `DialogSize.DEFAULT` | One of `DialogSize.SMALL` / `MEDIUM` / `LARGE` / `X_LARGE`. On small screens the dialog switches to fullscreen regardless of the configured size. |
| `formControl` | `Form.Group` | — | Exposed to the `body` slot as `formControl`; `df-modal` itself doesn't render a form from it. |
| `dialogId` | `symbol` | — | Used internally by the `modal` service to manage the one-dialog-at-a-time stack. Leave unset for template dialogs. |
| `title` | `Form.RenderableValue` | — | Dialog title. Accepts plain text, Markdown (`MdString`), or a custom component. Falls back to the `title` slot if omitted. |
| `color` | `string` | — | Title bar background color. |
| `icon` | `string` | — | Icon shown next to the title. |
| `actions` | `Action[]` | `[]` | Drives the [keyboard shortcuts](#keyboard-shortcuts) below. Purely functional - it renders nothing by itself; render the same array through `<df-actions>` in the `actions` slot. |

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
`<df-modal>`s can coexist in the tree without you having to hide the rest by hand.

## Keyboard shortcuts

`df-modal` installs its own `keydown` listener while it's mounted, and reacts only while it is itself the top-most
shown dialog:

- **Enter** executes the action in the `actions` prop with `defaultConfirm` set to `true`, unless focus is in a
  `<textarea>` or a `contenteditable` element (so multi-line text still gets a literal newline).
- **Escape** executes the action with `defaultReject` set to `true`. The dialog is `persistent`, so nothing
  happens on Escape if no action is flagged `defaultReject`.

Set `defaultConfirm` / `defaultReject` on the action's `value`, the same way the `modal` service does internally
(they also drive that action's color - `primary` / `secondary` - in `<df-actions>`, see
[`@dynamicforms/vuetify-inputs`](:vuetify-inputs:)):

```typescript
const loginAction = Action.create({ value: { name: 'login', label: 'Log in', defaultConfirm: true /* ... */ } });
```

The `actions` prop and the `actions` slot are fed the *same* `Action` instances - pressing Enter/Esc calls
`.execute()` on exactly the object a click on the matching `<df-actions>` button would call it on, so there's no
separate "keyboard action" concept to keep in sync.

This applies equally to `<df-modal>` used directly in a template (see
[Template Dialog](/examples/dialog-template#keyboard-shortcuts) for a full worked example) and to dialogs opened
via the `modal` service, where [`<modal-view>`](./modal-view) wires it up for you automatically.
