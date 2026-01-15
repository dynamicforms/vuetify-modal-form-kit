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
      <messages-widget v-if="message" message=" " :errors="[message]" :classes="messageClass"/>
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
import { Action, DfActions, MessagesWidget } from '@dynamicforms/vuetify-inputs';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

import { currentModal, installed } from './api';
import DfModal from './df-modal.component.vue';

const isOpen = ref(false);

watch(() => currentModal.value, (modal) => {
  isOpen.value = modal !== null;
});

const message = computed(() => currentModal.value?.message);
const messageClass = computed(() => (message.value ? message.value.extraClasses : undefined));

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
