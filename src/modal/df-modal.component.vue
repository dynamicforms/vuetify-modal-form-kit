<template>
  <!--https://stackoverflow.com/questions/55085735/vuetify-v-dialog-dynamic-width-->
  <!--
  `isShown` is derived from the prop and the dialog stack, so it takes no write: the update travels through
  onModelValueUpdate instead.
  -->
  <v-dialog
    :model-value="isShown"
    :width="width"
    :max-width="width"
    :fullscreen="fullScreen"
    :retain-focus="false"
    persistent
    @update:model-value="(value: boolean) => onModelValueUpdate(value)"
  >
    <v-card>
      <!--
      Inline `padding: 0` to reset any VitePress or otherwise padding so that v-sheet's default padding
      is always the same
      -->
      <v-card-title style="padding: 0">
        <v-sheet
          :color="props.color || undefined"
          class="d-flex align-center px-4 py-4"
          :class="{ 'position-relative': closable }"
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
import { Action } from '@dynamicforms/vuetify-inputs';
import { computed, onMounted, onUnmounted, watch } from 'vue';
import { useDisplay } from 'vuetify';

import DialogSize from './dialog-size';
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
  // Actions considered for the Enter (defaultConfirm) / Esc (defaultReject) keyboard shortcuts. Rendering them is
  // still up to the `actions` slot - this prop only drives the keyboard handling.
  actions?: Action[];
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
  actions: () => [],
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

// Identity of a template dialog, which has no dialogId of its own. It has to outlive every recomputation of
// `sym`: the stack is keyed by symbol, so a fresh one would never match the entry this component pushed.
const ownSym = Symbol('df-dialog');
const sym = computed(() => props.dialogId ?? ownSym);
// `sym` is read inside the computed rather than passed to dialogTracker.isTop(): <modal-view> keeps one
// <df-modal> alive across dialogs and only swaps `dialogId`, so a comparison bound to the symbol seen at setup
// would hide every dialog after the first.
const isTop = computed(() => dialogTracker.currentRef.value === sym.value);
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

// The keyboard reaches exactly the actions the user could click: <df-actions> disables an action that is not
// enabled and renders anything below FULL as hidden or invisible.
function isReachable(action: Action) {
  return action.enabled && action.visibility === Form.DisplayMode.FULL;
}

function onKeydown(e: KeyboardEvent) {
  if (!isShown.value || e.defaultPrevented) return;
  if (e.key === 'Enter') {
    const target = e.target as HTMLElement;
    if (target.tagName === 'TEXTAREA' || target.isContentEditable) return;
    const action = props.actions.find((a) => a.defaultConfirm && isReachable(a));
    if (action) {
      e.preventDefault();
      action.execute(e);
    }
  } else if (e.key === 'Escape') {
    const action = props.actions.find((a) => a.defaultReject && isReachable(a));
    if (action) {
      e.preventDefault();
      action.execute(e);
    }
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown);
  dialogTracker.remove(sym.value);
});

type Slots = {
  title: () => any;
  body: (props: { formControl: Form.Group }) => Form.Group;
  actions: () => any;
};

defineSlots<Slots>();
</script>
