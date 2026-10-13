# Template Dialog (`<df-modal>`)

The [Modal Dialog](./dialog-basic) example opens dialogs from code through the `modal` service. A dialog whose
content and lifecycle belong to one component can instead be declared in that component's template with
`<df-modal>`, opened and closed through `v-model`.

<modal-template/>

```vue
<template>
  <v-btn @click="isOpen = true">Open Login Dialog</v-btn>

  <df-modal v-model="isOpen" :title="title" :actions="actions" icon="mdi-login">
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
import { ExecuteAction } from '@dynamicforms/vue-forms';
import { RenderableValue } from '@dynamicforms/vuetify-inputs';
import { Action, DfActions } from '@dynamicforms/vuetify-inputs';
import { DfModal } from '@dynamicforms/vuetify-modal-form-kit';
import { ref } from 'vue';

// title is a RenderableValue, not a plain string - it supports Markdown, same as modal.message()
const title = new RenderableValue('Log in');

const isOpen = ref(false);
const username = ref('');
const password = ref('');

// defaultConfirm/defaultReject wire Enter/Esc (via `:actions` below) and color the action primary/secondary
// in <df-actions> - see @dynamicforms/vuetify-inputs's Action API.
const cancelAction = new Action({
  value: { name: 'cancel', label: 'Cancel', renderAs: 'text', showLabel: true, defaultReject: true },
});
cancelAction.registerAction(new ExecuteAction((action, supr, ...params) => {
  isOpen.value = false;
  return supr(action, ...params);
}));

const loginAction = new Action({
  value: {
    name: 'login', label: 'Log in', icon: 'mdi-check', showIcon: true, showLabel: true, defaultConfirm: true,
  },
});
loginAction.registerAction(new ExecuteAction((action, supr, ...params) => {
  // ... perform the login, then:
  isOpen.value = false;
  return supr(action, ...params);
}));

const actions = [cancelAction, loginAction];
</script>
```

`:actions="actions"` on `<df-modal>` drives only the [keyboard shortcuts](#keyboard-shortcuts); `<df-modal>` renders
nothing from it. The buttons are rendered by `<df-actions>` in the `#actions` slot.

## Keep actions consistent - always render them through `<df-actions>`

`<df-modal>` renders whatever the `actions` slot holds, including Vuetify buttons:

```vue
<!-- renders, but its buttons differ from those of the dialogs the modal service opens -->
<template #actions>
  <v-spacer/>
  <v-btn variant="text" :disabled="submitting" @click="close">Cancel</v-btn>
  <v-btn color="primary" :loading="submitting" @click="submit">Log in</v-btn>
</template>
```

Dialogs the `modal` service opens render their buttons from `Action`s with `<df-actions>`, which sets their spacing,
variant (`tonal` or `text`), order and alignment. `v-btn`s in the slot set these per dialog. To render buttons the
same way, create actions with `new Action()`, attach behaviour with `registerAction` / `ExecuteAction`, and render
them with `<df-actions>`, as in the example above. The [`<df-modal>` API Reference](/api/df-modal) lists the slots,
and [`@dynamicforms/vuetify-inputs`](:vuetify-inputs:) documents `Action` and `<df-actions>`.

## Keyboard shortcuts

`<df-modal>` executes the action flagged `defaultConfirm` on Enter and the one flagged `defaultReject` on Esc, as
dialogs the `modal` service opens do. It reads them from its `actions` prop, so the prop gets the same `Action[]` that
`<df-actions>` renders. In the demo above, Enter in a field logs in and Esc cancels.

A key executes an action whose visibility is `'full'`, whose `effectiveEnabled` is `true` (false where the action or
a container above it is disabled) and whose `busy` is `false`. While an overlay above the dialog is open, the key goes
to the overlay: Esc first closes an open `<df-select>` menu or `<df-date-time>` picker, and a second Esc rejects the
dialog. [`<df-modal>`](/api/df-modal#keyboard-shortcuts) lists the rules.

<script setup>
import ModalTemplate from '../components/modal-template.vue';
</script>
