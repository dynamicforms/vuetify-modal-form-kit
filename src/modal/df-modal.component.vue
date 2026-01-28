<template>
  <!--https://stackoverflow.com/questions/55085735/vuetify-v-dialog-dynamic-width-->
  <v-dialog
    v-model="isShown"
    :width="width"
    :max-width="width"
    :fullscreen="fullScreen"
    :retain-focus="false"
    persistent
  >
    <v-card>
      <v-card-title>
        <v-sheet
          :color="props.color || undefined"
          :class="{ 'mx-n4 mt-n3 mb-3 d-flex align-center px-4 py-6': !!props.color, 'position-relative': closable }"
          :elevation="!!props.color ? 4 : 0"
        >
          <v-icon v-if="icon" class="me-2" :icon="icon" />
          <slot name="title">
            <messages-widget :message="[title]" />
          </slot>
          <v-btn
            v-if="closable"
            icon
            variant="text"
            class="position-absolute"
            style="right: 0.25em"
            @click="onModelValueUpdate(false)"
          >
            <v-icon icon="mdi-close" />
          </v-btn>
        </v-sheet>
      </v-card-title>
      <v-card-text>
        <slot name="body" :form-control="formControl" />
      </v-card-text>
      <v-card-actions>
        <div style="flex: 1">
          <slot name="actions" />
        </div>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import * as Form from '@dynamicforms/vue-forms';
import { MessagesWidget } from '@dynamicforms/vue-forms';
import { computed, onUnmounted, watch } from 'vue';
import { useDisplay } from 'vuetify';

import { DialogSize } from './dialog-size';
import dialogTracker from './top-modal-tracker';

interface Props {
  // eslint-disable-next-line
  modelValue: boolean;
  closable?: boolean;
  size?: DialogSize;
  formControl?: Form.Group;
  dialogId?: symbol;
  title?: Form.RenderableValue;
  color?: string;
  icon?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  closable: false,
  size: DialogSize.DEFAULT,
  dialogId: undefined,
  formControl: undefined,
  title: undefined,
  color: undefined,
  icon: undefined,
});
const display = useDisplay();
const size = computed(() => props.size);

const fullScreen = computed(() => {
  if (size.value === DialogSize.SMALL && !display.smAndUp.value) return true;
  if (size.value === DialogSize.MEDIUM && !display.mdAndUp.value) return true;
  if (size.value === DialogSize.LARGE && !display.lgAndUp.value) return true;
  return size.value === DialogSize.X_LARGE && !display.xlAndUp.value;
});

const width = computed<'unset' | number>(() => {
  if (fullScreen.value) return 'unset';
  switch (size.value) {
    case DialogSize.SMALL:
      return 400;
    case DialogSize.MEDIUM:
      return 600;
    case DialogSize.LARGE:
      return 800;
    case DialogSize.X_LARGE:
      return 1140;
    default:
      return 'unset';
  }
});

const sym = computed(() => props.dialogId ?? Symbol('df-dialog'));
const isTop = dialogTracker.isTop(sym.value);
const emit = defineEmits<{
  'update:model-value': [value: boolean];
}>();

function onModelValueUpdate(value: boolean, dontEmit = false) {
  if (!props.dialogId || !value) {
    // manage stack only if this dialog is a template-one, not managed by api.ts
    if (value) {
      dialogTracker.push(sym.value);
    } else {
      dialogTracker.remove(sym.value);
    }
  }
  if (!dontEmit) emit('update:model-value', value);
}

const isShown = computed(() => props.modelValue && isTop.value);
watch(
  () => props.modelValue,
  (newValue, oldValue) => {
    if (newValue !== oldValue) onModelValueUpdate(newValue, true);
  },
  { immediate: true },
);

onUnmounted(() => {
  dialogTracker.remove(sym.value);
});

type Slots = {
  title: () => any;
  body: (props: { formControl: Form.Group }) => Form.Group;
  actions: () => any;
};

defineSlots<Slots>();
</script>
