# `<modal-view>`

Not a component you configure or interact with directly - it's a **placeholder**. Mount exactly one
`<modal-view />` in your app root, and forget about it; every dialog opened through the
[`modal` service](./modal-service) (`modal.message()` / `modal.yesNo()` / `modal.custom()`) renders there.

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

It takes no props and exposes no slots - it reads the currently active (top-of-stack) dialog straight from the
`modal` service's internal state, so you control what it shows entirely through `modal.*` calls elsewhere in your
code, not through anything you pass to `<modal-view>` itself.

If you need a dialog whose content/lifecycle belongs to one specific component instead, skip `modal-view`/`modal`
entirely and use [`<df-modal>`](./df-modal) directly in that component's template - see
[Template Dialog](/examples/dialog-template).

## What it actually does

Internally, `modal-view` is a thin wrapper around [`<df-modal>`](./df-modal): it watches the `modal` service's
currently active dialog and forwards its data straight into `df-modal`'s props and slots.

| `df-modal` prop/slot | Fed from |
|---|---|
| `formControl`, `size`, `dialogId`, `title`, `color`, `icon`, `actions` | The active dialog's data (set by whichever `modal.*` call opened it, see [`ModalOptions`](./modal-service#modaloptions)) |
| `#body` | A `MessagesWidget` for the `message` text, plus - if a form was passed - a `FormRender` in which every `Field` on `options.form` is rendered as a `<df-input>`. See [the generated layout](#the-generated-layout) below for the label, the members it skips and the ones it does not draw. |
| `#actions` | A `<df-actions>` fed the same actions forwarded to the `actions` prop |

Because the same `Action[]` reaches both `df-modal`'s `actions` prop and the `<df-actions>` inside `#actions`,
[keyboard shortcuts](./df-modal#keyboard-shortcuts) (Enter → `defaultConfirm`, Esc → `defaultReject`) work
automatically for every `modal.*` dialog - `modal.message()` / `modal.yesNo()` set these flags on their default
actions for you.

`df-modal` also manages the one-dialog-at-a-time stack itself, so `modal-view` doesn't need any special-casing for
nested/queued `modal.*` calls - it always just renders "the current one".

A dialog belongs to the `modal` service, not to the view drawing it: unmounting the `<modal-view>` while a dialog
is on screen takes the dialog off the screen and leaves it on the stack, holding its unsettled promise. The next
`<modal-view>` to mount draws it again, actions and all.

One stack is drawn by one view. Mounting a second `<modal-view>` warns on the console and renders nothing, so a
stray one in a layout component costs a warning rather than a dialog on screen twice; it takes the drawing over
if the view that had it unmounts, which is what makes a route transition with both briefly mounted harmless. The
stack itself is module state - one per page, shared by every Vue app on it, and under SSR living for the process
rather than the request - so this library is browser-side and single-app.

## The generated layout

`<modal-view>` builds a single-column `FormBuilder` layout over the members of `options.form`, in declaration
order. It covers exactly the `Field` members:

- **The label is the field's own.** `new Field({ value: '', label: 'Email address' })` draws that text; the field
  name read as Title Case - `emailAddress` and `email_address` both give `Email Address` - is what is left when
  the field carries none.
- **A member at `DisplayMode.SUPPRESS` is skipped.** `<df-input>` renders nothing at that mode, so a row and a
  column of its own would be an empty gutter gap. A `HIDDEN` or `INVISIBLE` member keeps its row: the input draws
  those two itself, as `d-none` and as `invisible`.
- **An `Action` member goes to the actions slot**, not into the body - see
  [Actions](./modal-service#actions) for which of them `<df-actions>` draws.
- **A nested `Group` or `List` member is not laid out.** It goes on validating and goes on counting towards
  `form.valid`, so the form can read invalid over an error nothing on screen shows. The first layout built over
  such a form warns on the console, naming the members it has no layout for. Pass a `FormBuilder` layout of your
  own - through [`<df-modal>`](./df-modal) and its `body` slot - to render one.
