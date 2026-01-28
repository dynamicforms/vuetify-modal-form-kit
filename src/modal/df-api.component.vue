<template>
  <df-modal
    v-if="currentModal"
    v-model="isOpen"
    :form-control="currentModal.form"
    :size="currentModal.size"
    :dialog-id="currentModal.dialogId"
    :title="currentModal.title"
    :color="currentModal.color"
    :icon="currentModal.icon"
  >
    <template #body>
      <messages-widget v-if="message" :message="[message]" :classes="messageClass" />
      <form-render v-if="formLayout" :layout="formLayout" :components="components" />
    </template>
    <template #actions>
      <df-actions
        :actions="Object.values(currentModal.actions ?? ([] as Action[]))"
        class="d-flex justify-end"
        style="gap: 0.5em"
      />
    </template>
  </df-modal>
</template>

<script setup lang="ts">
import * as Form from '@dynamicforms/vue-forms';
import { MessagesWidget } from '@dynamicforms/vue-forms';
import {
  Action,
  DfActions,
  DfInput,
  DfTextArea,
  DfSelect,
  DfCheckbox,
  DfDateTime,
  DfFile,
  DfColor,
  DfRtfEditor,
} from '@dynamicforms/vuetify-inputs';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

import { FormBuilder } from '../core/form-layout';
import { FormRender } from '../layout';

import { currentModal, installed } from './api';
import DfModal from './df-modal.component.vue';

const isOpen = ref(false);

watch(
  () => currentModal.value,
  (modal) => {
    isOpen.value = modal !== null;
  },
);

const message = computed(() => currentModal.value?.message);
const messageClass = computed(() => (message.value ? message.value.extraClasses : undefined));

// Helper function to convert fieldName to a readable label
function generateLabel(fieldName: string): string {
  // Convert camelCase or snake_case to Title Case
  return fieldName
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/_/g, ' ') // Replace underscores with spaces
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Build form layout from form fields
const formLayout = computed(() => {
  if (!currentModal.value?.form) return null;

  const form = currentModal.value.form;
  const formBuilder = new FormBuilder();
  const builder = formBuilder.simple();

  // Iterate through form fields and add them to the layout
  Object.entries(form.fields).forEach(([fieldName, field]) => {
    // Skip Action fields (they are rendered in the actions slot)
    if (field instanceof Form.Action) return;

    // Add field to layout using df-input component (default for Field)
    if (field instanceof Form.Field) {
      builder.dfInput({
        label: generateLabel(fieldName),
        control: field,
      });
    }
  });

  return formBuilder;
});

// Register components
const components = {
  'df-input': DfInput,
  'df-text-area': DfTextArea,
  'df-select': DfSelect,
  'df-checkbox': DfCheckbox,
  'df-date-time': DfDateTime,
  'df-file': DfFile,
  'df-color': DfColor,
  'df-rtf-editor': DfRtfEditor,
  'df-actions': DfActions,
};

onMounted(() => {
  if (installed.value) {
    console.warn('Seems like there is more than one df-modal-api in the v-dom');
  }
  installed.value = true;
});

onUnmounted(() => {
  installed.value = false;
});
</script>
