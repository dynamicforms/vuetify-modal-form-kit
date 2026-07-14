<template>
  <div class="demo-container">
    <v-card variant="outlined" class="pa-4">
      <v-card-title class="text-subtitle-1 px-0">Template Dialog (&lt;df-modal&gt;)</v-card-title>
      <v-card-text class="px-0">
        Declared directly in the component's template instead of being opened from code. The actions are still
        built with <code>Action.create()</code> and rendered through <code>&lt;df-actions&gt;</code>, so they look
        and behave exactly like the dialogs opened via <code>modal.*</code> above.
      </v-card-text>
      <v-card-actions class="px-0">
        <v-btn color="primary" prepend-icon="mdi-login" @click="isOpen = true">Open Login Dialog</v-btn>
      </v-card-actions>
    </v-card>

    <v-alert v-if="lastResult" color="info" variant="tonal" class="mt-4">
      Last result: <strong>{{ lastResult }}</strong>
    </v-alert>

    <df-modal v-model="isOpen" :title="title" :actions="actions" closable icon="mdi-login">
      <template #body>
        <v-text-field v-model="username" label="Username" autofocus />
        <v-text-field v-model="password" label="Password" type="password" />
      </template>
      <template #actions>
        <df-actions :actions="actions" class="d-flex justify-end" style="gap: 0.5em" />
      </template>
    </df-modal>
  </div>
</template>

<script setup>
import { RenderableValue, ExecuteAction } from '@dynamicforms/vue-forms';
import { Action, ActionDisplayStyle, DfActions } from '@dynamicforms/vuetify-inputs';
import { ref } from 'vue';
import { DfModal } from '../../src';

// The title prop expects a RenderableValue - it supports plain text as well as Markdown, just like modal.message()
const title = new RenderableValue('Log in');

const isOpen = ref(false);
const username = ref('');
const password = ref('');
const lastResult = ref(null);

function close(result) {
  lastResult.value = result;
  isOpen.value = false;
}

// Cancel is rendered as a text link, Log in as a tonal button - the same visual rules df-actions applies everywhere
const cancelAction = Action.create({
  value: { name: 'cancel', label: 'Cancel', renderAs: ActionDisplayStyle.TEXT, showLabel: true },
});
cancelAction.registerAction(
  new ExecuteAction((action, supr, ...params) => {
    close('cancel');
    return supr(action, ...params);
  }),
);
// Esc triggers whichever action is marked defaultReject - see <df-modal>'s `actions` prop
Object.defineProperty(cancelAction, 'defaultReject', { value: true });

const loginAction = Action.create({
  value: { name: 'login', label: 'Log in', icon: 'mdi-check', showIcon: true, showLabel: true },
});
loginAction.registerAction(
  new ExecuteAction((action, supr, ...params) => {
    close('login');
    return supr(action, ...params);
  }),
);
// Enter triggers whichever action is marked defaultConfirm
Object.defineProperty(loginAction, 'defaultConfirm', { value: true });

const actions = [cancelAction, loginAction];
</script>

<style scoped>
.demo-container {
  position: relative;
}
</style>
