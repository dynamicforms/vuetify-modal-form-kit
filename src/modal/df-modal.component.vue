<template>
  <!--https://stackoverflow.com/questions/55085735/vuetify-v-dialog-dynamic-width-->
  <v-dialog
    :model-value="isShown"
    :width="width"
    :max-width="width"
    :fullscreen="fullScreen"
    :retain-focus="false"
    persistent
    @update:model-value="onModelValueUpdate"
  >
    <v-card>
      <v-card-title>
        <v-sheet
          :color="props.color || undefined"
          :class="{ 'mx-n4 mt-n3 mb-3 d-flex align-center px-4 py-3': !!props.color }"
          :elevation="!!props.color ? 4 : 0"
        >
          <v-icon v-if="icon" class="me-2" :icon="icon"/>
          <slot name="title"/>
        </v-sheet>
      </v-card-title>
      <v-card-text>
        <slot name="body" :form-control="formControl"/>
      </v-card-text>
      <v-card-actions>
        <div style="flex:1">
          <slot name="actions"/>
        </div>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import * as Form from '@dynamicforms/vue-forms';
import { computed, onUnmounted } from 'vue';
import { useDisplay } from 'vuetify';

import DialogSize from './dialog-size';
import dialogTracker from './top-modal-tracker';

interface Props {
  modelValue: boolean;
  size: DialogSize;
  formControl?: Form.Group;
  dialogId?: symbol;
  color?: string;
  icon?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  dialogId: undefined,
  formControl: undefined,
  color: undefined,
  icon: undefined,
});
const display = useDisplay();
const size = computed(() => props.size);

const fullScreen = computed(() => {
  if (size.value === DialogSize.SMALL && !display.smAndUp.value) return true;
  if (size.value === DialogSize.MEDIUM && !display.mdAndUp.value) return true;
  if (size.value === DialogSize.LARGE && !display.lgAndUp.value) return true;
  return size.value === DialogSize.X_LARGE && !display.xl.value;
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

const sym = props.dialogId ?? Symbol('df-dialog');
const isTop = dialogTracker.isTop(sym);
const isShown = computed(() => props.modelValue && isTop.value);
const emit = defineEmits<{
  'update:model-value': [value: boolean]
}>();

onUnmounted(() => {
  dialogTracker.remove(sym);
});

function onModelValueUpdate(value: boolean) {
  if (value) {
    dialogTracker.push(sym);
  } else {
    dialogTracker.remove(sym);
  }
  emit('update:model-value', value);
}

type Slots = {
  title: () => any;
  body: (props: { formControl: Form.Group }) => Form.Group;
  actions: () => any;
};

defineSlots<Slots>();
</script>
