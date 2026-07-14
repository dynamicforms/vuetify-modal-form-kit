# Template Dialog (`<df-modal>`)

The [Modal Dialog](./dialog-basic) example opens dialogs *from code* via the `modal` service. Sometimes it's more
natural to declare a dialog directly in a component's template instead - for example when the dialog's content and
lifecycle clearly belong to that one component. For this, use the `<df-modal>` component directly, controlling it
with a plain `v-model`, instead of going through `modal.message()` / `modal.yesNo()` / `modal.custom()`.

<modal-template/>

```vue
<template>
  <v-btn @click="isOpen = true">Open Login Dialog</v-btn>

  <df-modal v-model="isOpen" :title="title" :actions="actions" closable icon="mdi-login">
    <template #body>
      <v-text-field v-model="username" label="Username" autofocus />
      <v-text-field v-model="password" label="Password" type="password" />
    </template>
    <template #actions>
      <df-actions :actions="actions" class="d-flex justify-end" style="gap: 0.5em" />
    </template>
  </df-modal>
</template>

<script setup>
import { RenderableValue, ExecuteAction } from '@dynamicforms/vue-forms';
import { Action, ActionDisplayStyle, DfActions } from '@dynamicforms/vuetify-inputs';
import { DfModal } from '@dynamicforms/vuetify-modal-form-kit';
import { ref } from 'vue';

// title is a RenderableValue, not a plain string - it supports Markdown, same as modal.message()
const title = new RenderableValue('Log in');

const isOpen = ref(false);
const username = ref('');
const password = ref('');

const cancelAction = Action.create({
  value: { name: 'cancel', label: 'Cancel', renderAs: ActionDisplayStyle.TEXT, showLabel: true },
});
cancelAction.registerAction(new ExecuteAction((action, supr, ...params) => {
  isOpen.value = false;
  return supr(action, ...params);
}));
// Esc triggers whichever action in `:actions` is marked defaultReject
Object.defineProperty(cancelAction, 'defaultReject', { value: true });

const loginAction = Action.create({
  value: { name: 'login', label: 'Log in', icon: 'mdi-check', showIcon: true, showLabel: true },
});
loginAction.registerAction(new ExecuteAction((action, supr, ...params) => {
  // ... perform the login, then:
  isOpen.value = false;
  return supr(action, ...params);
}));
// Enter triggers whichever action in `:actions` is marked defaultConfirm
Object.defineProperty(loginAction, 'defaultConfirm', { value: true });

const actions = [cancelAction, loginAction];
</script>
```

Note that `:actions="actions"` is passed to `<df-modal>` itself (for the keyboard handling below), in addition to
being rendered inside the `#actions` slot via `<df-actions>` - the two are independent, `<df-modal>` doesn't
render anything from the prop on its own.

## Keep actions consistent - always render them through `<df-actions>`

The `actions` slot is a plain slot - `<df-modal>` will happily render whatever you put in it, including raw
Vuetify components:

```vue
<!-- Don't do this - it renders, but looks and behaves differently from every other dialog in the app -->
<template #actions>
  <v-spacer/>
  <v-btn variant="text" :disabled="submitting" @click="close">Cancel</v-btn>
  <v-btn color="primary" :loading="submitting" @click="submit">Log in</v-btn>
</template>
```

Hand-rolled `v-btn`s bypass the shared `Action` + `<df-actions>` rendering that every dialog opened through
`modal.*` uses internally - button spacing, variant (`tonal` vs `text`), order and alignment all end up defined
ad-hoc, per dialog, instead of coming from one place. The result is dialogs that don't visually match each other,
even though they're all built with the same library.

Instead, model actions the same way the rest of the library does: create them with `Action.create()`, attach
behaviour with `registerAction`/`ExecuteAction`, and render them with `<df-actions>`, exactly as shown in the
example above. See the [`<df-modal>` API Reference](/api/df-modal) for the full slot table, and
[`@dynamicforms/vuetify-inputs`](:vuetify-inputs:) for the complete `Action` / `df-actions` API.

## Keyboard shortcuts

Enter-to-confirm / Esc-to-cancel works here too, the same as with dialogs opened through `modal.*` - `<df-modal>`
handles it internally, as long as you pass the same `Action[]` you render through `<df-actions>` to its `actions`
prop, with one action flagged `defaultConfirm` and (optionally) one `defaultReject`. Try it in the demo above:
focus a field and press Enter to log in, or Esc to cancel. See [`<df-modal>`](/api/df-modal#keyboard-shortcuts) for
details.

<script setup>
import ModalTemplate from '../components/modal-template.vue';
</script>
