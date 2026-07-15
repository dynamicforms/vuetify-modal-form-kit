# `<modal-view>`

Not a component you configure or interact with directly - it's a **placeholder**. Mount exactly one
`<modal-view />` in your app root, and forget about it; every dialog opened through the [`modal` service](./modal-service)
(`modal.message()` / `modal.yesNo()` / `modal.custom()`) renders there.

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

It takes no props and exposes no slots - it reads the currently active (top-of-stack) dialog straight from the `modal` service's
internal state, so you control what it shows entirely through `modal.*` calls elsewhere in your code, not through
anything you pass to `<modal-view>` itself.

If you need a dialog whose content/lifecycle belongs to one specific component instead, skip `modal-view`/`modal`
entirely and use [`<df-modal>`](./df-modal) directly in that component's template - see
[Template Dialog](/examples/dialog-template).

## What it actually does

Internally, `modal-view` is a thin wrapper around [`<df-modal>`](./df-modal): it watches the `modal` service's
currently active dialog and forwards its data straight into `df-modal`'s props and slots.

| `df-modal` prop/slot | Fed from |
|---|---|
| `formControl`, `size`, `dialogId`, `title`, `color`, `icon`, `actions` | The active dialog's data (set by whichever `modal.*` call opened it, see [`ModalOptions`](./modal-service#modaloptions)) |
| `#body` | A `MessagesWidget` for the `message` text, plus a `FormRender` built from `options.form`'s non-`Action` fields, if a form was passed |
| `#actions` | A `<df-actions>` fed the same actions forwarded to the `actions` prop |

Because the same `Action[]` reaches both `df-modal`'s `actions` prop and the `<df-actions>` inside `#actions`,
[keyboard shortcuts](./df-modal#keyboard-shortcuts) (Enter → `defaultConfirm`, Esc → `defaultReject`) work
automatically for every `modal.*` dialog - `modal.message()` / `modal.yesNo()` set these flags on their default
actions for you.

`df-modal` also manages the one-dialog-at-a-time stack itself, so `modal-view` doesn't need any special-casing for
nested/queued `modal.*` calls - it always just renders "the current one".
