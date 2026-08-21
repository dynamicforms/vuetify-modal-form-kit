<template>
  <df-modal
    v-if="currentModal && isDrawingView"
    v-model="isOpen"
    :form-control="currentModal.form"
    :size="currentModal.size"
    :dialog-id="currentModal.dialogId"
    :title="currentModal.title"
    :color="currentModal.color"
    :icon="currentModal.icon"
    :actions="actionsArray"
  >
    <template #body>
      <messages-widget v-if="message" :message="[message]" :classes="messageClass" />
      <form-render v-if="formLayout" :layout="formLayout" :components="components" />
    </template>
    <template #actions>
      <df-actions :actions="actionsArray" class="d-flex justify-end" style="gap: 0.5em" />
    </template>
  </df-modal>
</template>

<script setup lang="ts">
import * as Form from '@dynamicforms/vue-forms';
import { MessagesWidget } from '@dynamicforms/vue-forms';
import { DfActions, dfInputComponentsByTag } from '@dynamicforms/vuetify-inputs';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

import { FormBuilder } from '../core/form-layout';
import { FormRender } from '../layout';

import { currentModal, installed, mountedViews } from './api';
import DfModal from './df-modal.component.vue';

const isOpen = ref(false);

watch(
  () => currentModal.value,
  (modal) => {
    isOpen.value = modal !== null;
  },
  // a dialog opened before this component mounts is already on the stack, and without the immediate run
  // nothing would ever set isOpen for it
  { immediate: true },
);

const message = computed(() => currentModal.value?.message);
const messageClass = computed(() => (message.value ? message.value.extraClasses : undefined));
const actionsArray = computed(() => Object.values(currentModal.value?.actions ?? {}));

// The fallback label, for a field that carries none: camelCase or snake_case read as Title Case.
function generateLabel(fieldName: string): string {
  return fieldName
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/_/g, ' ') // Replace underscores with spaces
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Once per form, not once per recomputation: the layout is rebuilt whenever a member's visibility or extended
// properties change, and the warning states something about the form that is true for as long as it exists.
const warnedForms = new WeakSet<Form.Group>();

function warnUnrendered(form: Form.Group, names: string[]) {
  if (!names.length || warnedForms.has(form)) return;
  warnedForms.add(form);
  console.warn(
    `<modal-view> lays out the Field members of the form it is given, one input each. It has no layout for ` +
      `${names.join(', ')}, so ${names.length > 1 ? 'those members are' : 'that member is'} not on screen - while ` +
      'still validating, and still counted by form.valid. Pass a FormBuilder layout of your own to render ' +
      'nested groups and lists.',
  );
}

// Build form layout from form fields
const formLayout = computed(() => {
  if (!currentModal.value?.form) return null;

  const form = currentModal.value.form;
  const formBuilder = new FormBuilder();
  const builder = formBuilder.simple();
  const unrendered: string[] = [];

  Object.entries(form.fields).forEach(([fieldName, field]) => {
    // Actions are rendered in the actions slot
    if (field instanceof Form.Action) return;

    if (field instanceof Form.Field) {
      // a suppressed field renders nothing, so a row and a column of its own would be an empty gutter gap
      if (field.visibility === Form.DisplayMode.SUPPRESS) return;
      // the component is the field's to state, and a field that states none is drawn as a plain input
      builder.byTag(field.extra.component ?? 'df-input', {
        // the field's own label wins over the one read off its name: an element carries its presentation, and
        // the name is only what is left when it carries none
        label: field.extra.label ?? generateLabel(fieldName),
        control: field,
      });
      return;
    }

    unrendered.push(fieldName);
  });

  warnUnrendered(form, unrendered);
  return formBuilder;
});

// The components a layout may name: what `@dynamicforms/vuetify-inputs` draws with, under the caller's own. The
// caller's win, so an application component reaches a dialog body without being registered globally, and a tag
// the peer's map already holds can be replaced for one dialog.
const components = computed(() => ({ ...dfInputComponentsByTag, ...(currentModal.value?.components ?? {}) }));

// One view draws, whatever is mounted: two of them rendering the same `currentModal` would put one dialog on
// screen twice, over two overlays. The first mounted draws, and hands that over to the next one still up when
// it leaves.
const ownId = Symbol('modal-view');
const isDrawingView = computed(() => mountedViews.value[0] === ownId);

onMounted(() => {
  if (installed.value) {
    console.warn(
      'A <modal-view> (ModalView) is already mounted, and one dialog stack is drawn by one view: this one renders ' +
        'nothing. Mount <modal-view> once, somewhere in the app.',
    );
  }
  mountedViews.value = [...mountedViews.value, ownId];
});

onUnmounted(() => {
  mountedViews.value = mountedViews.value.filter((view) => view !== ownId);
});
</script>
