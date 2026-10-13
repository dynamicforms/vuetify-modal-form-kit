# `<modal-view>`

`<modal-view>` draws the dialogs opened through the [`modal` service](./modal-service) (`modal.message()`,
`modal.yesNo()`, `modal.custom()`). Mount one `<modal-view />` in the app root:

```vue
<template>
  <v-app>
    <v-main>
      <!-- Your app content -->
    </v-main>
    <modal-view />
  </v-app>
</template>

<script setup>
import { ModalView } from '@dynamicforms/vuetify-modal-form-kit';
</script>
```

It has no props and no slots. It draws the dialog on top of the `modal` service's stack; what it shows is set by
the `modal.*` calls and by the dialog's [`props`](./modal-service#changing-an-open-dialog).

A dialog whose content and lifecycle belong to one component is declared with [`<df-modal>`](./df-modal) in that
component's template instead - see [Template Dialog](/examples/dialog-template).

## How it draws a dialog

`<modal-view>` renders a [`<df-modal>`](./df-modal) for the dialog on top of the stack and passes it the dialog's
properties:

| `df-modal` prop/slot | Value |
|---|---|
| `formControl`, `size`, `dialogId`, `title`, `color`, `icon`, `actions` | The dialog's properties: what the `modal.*` call stated (see [`ModalOptions`](./modal-service#modaloptions)) and what was written to its `props` since |
| `#body` | A `MessagesWidget` for `message`, and, where the dialog has a `form`, a `FormRender` with one input per `Field` member - see [the generated layout](#the-generated-layout) |
| `#actions` | A `<df-actions>` with the same actions as the `actions` prop |

The `actions` prop and `<df-actions>` hold the same `Action` instances, so the
[keyboard shortcuts](./df-modal#keyboard-shortcuts) (Enter → `defaultConfirm`, Esc → `defaultReject`) work for every
`modal.*` dialog. `modal.message()` and `modal.yesNo()` set these flags on their default actions.

The `modal` service keeps the stack: it pushes a dialog when it opens and removes it when it settles. `<df-modal>`
shows a dialog only while it is on top of the stack.

A dialog belongs to the `modal` service, not to the view that draws it. Unmounting `<modal-view>` takes the dialog
off the screen and leaves it on the stack with its unsettled promise; the next `<modal-view>` that mounts draws it
again, with its actions.

One view draws the stack. A second mounted `<modal-view>` warns on the console and renders nothing; it takes over
the drawing when the view that has it unmounts, so a route transition with two views mounted for a moment shows
the dialog once. The stack is module state: one per page, shared by every Vue app on it, and under SSR one per
process rather than per request. The library is therefore for one app in the browser.

## The generated layout

`<modal-view>` builds a single-column `FormBuilder` layout over the members of `options.form`, in declaration
order:

- **Component.** A `Field` is drawn as the component its `component` names, e.g.
  `new Field({ value: false, component: 'df-checkbox' })`, and as `<df-input>` where it names none. `component` is
  a key this library declares on vue-forms' `Extras` and takes `DfInputComponentTag`, the tag of any component of
  [`@dynamicforms/vuetify-inputs`](:vuetify-inputs:). A name given in `options.components` is resolved from there
  first.
- **Label.** A field's own `label` is drawn, e.g. `new Field({ value: '', label: 'Email address' })`. A field without
  one is labelled with its name in Title Case: `emailAddress` and `email_address` both give `Email Address`.
- **Visibility.** A member at `'suppress'` gets no row. A member at `'hidden'` or `'invisible'` keeps its row, and
  the input draws it as `d-none` or `invisible`.
- **Actions.** An `Action` member is drawn in the actions slot, not in the body - see
  [Actions](./modal-service#actions).
- **Nested containers.** A nested `Group` or `List` member is not laid out. While it is sent, it is validated and
  counts towards `form.valid`, so the form can be invalid over an error that is not on screen. The first layout
  built over such a form warns on the console and names those members; a member whose `effectiveAccess` is
  `'disabled'` is not sent and not validated, and is left out of the warning. To render nested containers, pass a
  `FormBuilder` layout of your own through [`<df-modal>`](./df-modal) and its `body` slot.
