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
          :class="{ 'mx-n4 mt-n3 mb-3 d-flex align-center px-4 py-6': !!props.color }"
          :elevation="!!props.color ? 4 : 0"
        >
          <v-icon v-if="icon" class="me-2" :icon="icon"/>
          <slot name="title">
            <template v-if="!(title instanceof Form.MdString)">{{ title }}</template>
            <vue-markdown v-else source="title"/>
          </slot>
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
import { computed, onUnmounted, watch } from 'vue';
import VueMarkdown from 'vue-markdown-render';
import { useDisplay } from 'vuetify';

import DialogSize from './dialog-size';
import dialogTracker from './top-modal-tracker';

interface Props {
  modelValue: boolean;
  size?: DialogSize;
  formControl?: Form.Group;
  dialogId?: symbol;
  title?: Form.RenderContent;
  color?: string;
  icon?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
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

const sym = computed(() => (props.dialogId ?? Symbol('df-dialog')));
const isTop = dialogTracker.isTop(sym.value);
const emit = defineEmits<{
  'update:model-value': [value: boolean]
}>();

function onModelValueUpdate(value: boolean, dontEmit = false) {
  if (value) {
    dialogTracker.push(sym.value);
  } else {
    dialogTracker.remove(sym.value);
  }
  if (!dontEmit) emit('update:model-value', value);
}

const isShown = computed({
  get: () => props.modelValue && isTop.value,
  set: (value: boolean) => { onModelValueUpdate(value); },
});

watch(() => props.modelValue, (newValue, oldValue) => {
  if (newValue !== oldValue) onModelValueUpdate(newValue, true);
}, { immediate: true });

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
