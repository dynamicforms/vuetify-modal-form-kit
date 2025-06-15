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
      <template v-if="bodyType === 'string'">{{ currentModal.message }}</template>
      <vue-markdown v-else-if="bodyType === 'md'" source="currentModal.title"/>
      <template v-else><component :is="componentInfo?.componentName" v-bind="componentInfo?.componentProps"/></template>
    </template>
    <template #actions>
      <df-actions
        :actions="Object.values(currentModal.actions ?? [] as Action[])"
        class="d-flex justify-end"
        style="gap: .5em"
      />
    </template>
  </df-modal>
</template>

<script setup lang="ts">
import { isCustomModalContentComponentDef, MdString } from '@dynamicforms/vue-forms';
import { DfActions, Action } from '@dynamicforms/vuetify-inputs';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import VueMarkdown from 'vue-markdown-render';

import { currentModal, installed } from './api';
import DfModal from './df-modal.component.vue';

const isOpen = ref(false);

watch(() => currentModal.value, (modal) => {
  isOpen.value = modal !== null;
});

const bodyType = computed(() => {
  const msg = currentModal?.value?.message;
  if (!msg) return 'string';
  if (msg instanceof MdString) return 'md';
  if (isCustomModalContentComponentDef(msg)) return 'component';
  return 'string';
});

const componentInfo = computed(
  () => (isCustomModalContentComponentDef(currentModal?.value?.message) ? currentModal?.value?.message : null),
);

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
