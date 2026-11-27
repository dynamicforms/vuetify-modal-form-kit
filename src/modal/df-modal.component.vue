<template>
  <v-dialog
    :class="overlayClass"
    :model-value="isShown"
    :width="width"
    :max-width="width"
    :fullscreen="fullScreen"
    :retain-focus="false"
    persistent
    @update:model-value="(value: boolean) => onModelValueUpdate(value)"
  >
    <v-card>
      <v-card-title style="padding: 0">
        <v-sheet
          :color="resolvedColor"
          class="d-flex align-center px-4 py-4"
          :class="{ 'position-relative': showsCloseButton }"
          :elevation="resolvedColor ? 4 : 0"
        >
          <v-icon v-if="icon" class="me-2" :icon="icon" />
          <slot name="title">
            <messages-widget :message="[title]" />
          </slot>
          <v-btn
            v-if="showsCloseButton"
            icon
            variant="text"
            class="position-absolute"
            style="right: 0.25em"
            @click="(e: MouseEvent) => onClose(e)"
          >
            <v-icon icon="mdi-close" />
          </v-btn>
        </v-sheet>
      </v-card-title>
      <v-card-text>
        <slot name="body" :form-control="formControl" />
        <slot name="errors" :errors="formErrors" :form-control="formControl">
          <df-input-hint v-if="formErrors.length" class="df-modal-errors mt-2" :errors="formErrors" />
        </slot>
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
import { DfInputHint, MessagesWidget, useShownErrors } from '@dynamicforms/vuetify-inputs';
import { getRenderOptionsForBreakpoint, useBreakpoint } from '@dynamicforms/vuetify-inputs';
import { computed, getCurrentInstance, onMounted, onUnmounted, watch } from 'vue';
import { useDisplay } from 'vuetify';

import { DfModalProps, DfModalSlots } from './df-modal.types';
import { defaultDialogSize, resolveDialogSize } from './dialog-size';
import modalDefaults from './modal-defaults';
import dialogTracker from './top-modal-tracker';

const props = withDefaults(defineProps<DfModalProps>(), {
  modelValue: false,
  size: defaultDialogSize,
  dialogId: undefined,
  formControl: undefined,
  title: undefined,
  color: undefined,
  icon: undefined,
  actions: () => [],
});
const instance = getCurrentInstance();
const display = useDisplay();
const breakpoint = useBreakpoint();
const size = computed(() => resolveDialogSize(props.size));
// errors of the form itself, not of its members
const formErrors = useShownErrors(() => props.formControl);
const resolvedColor = computed(() => props.color || modalDefaults.titleColor || undefined);

const fullScreen = computed(() => {
  if (size.value === 'small' && !display.smAndUp.value) return true;
  if (size.value === 'medium' && !display.mdAndUp.value) return true;
  if (size.value === 'large' && !display.lgAndUp.value) return true;
  return size.value === 'x-large' && !display.xlAndUp.value;
});

const width = computed<'unset' | number>(() => {
  if (fullScreen.value) return 'unset';
  switch (size.value) {
    case 'small':
      return 400;
    case 'medium':
      return 600;
    case 'large':
      return 800;
    case 'x-large':
      return 1140;
    default:
      return 'unset';
  }
});

// stack key of a template dialog, which has no dialogId
const ownSym = Symbol('df-dialog');
const sym = computed(() => props.dialogId ?? ownSym);
// reads `sym` on every evaluation: <modal-view> swaps `dialogId` on one <df-modal>
const isTop = computed(() => dialogTracker.currentRef.value === sym.value);
const emit = defineEmits<{
  'update:model-value': [value: boolean];
}>();

function onModelValueUpdate(value: boolean, dontEmit = false) {
  if (!props.dialogId || !value) {
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

function renderOptions(action: Form.Action) {
  return getRenderOptionsForBreakpoint(action.value ?? {}, breakpoint.value);
}

function isReachable(action: Form.Action) {
  return action.executable;
}

// a rejection goes to the app's errorHandler, as it would from a template handler
function run(action: Form.Action, e: Event) {
  e.preventDefault();
  action.execute(e).catch((error: unknown) => {
    const handler = instance?.appContext.config.errorHandler;
    if (handler) handler(error, instance?.proxy ?? null, 'df-modal keyboard shortcut');
    else console.error(error);
  });
}

// the action Escape and the header's close button run
const rejectAction = computed(() =>
  props.actions.find((action) => renderOptions(action).defaultReject && isReachable(action)),
);

const showsCloseButton = computed(() => rejectAction.value !== undefined);

function onClose(e: MouseEvent) {
  if (rejectAction.value) run(rejectAction.value, e);
}

const overlayClass = 'df-modal';

function overlayZIndex(el: Element) {
  return Number.parseFloat((el as HTMLElement).style.zIndex) || 0;
}

// overlays with a z-index above the dialog that do not take the keyboard
const unstacked = '.v-tooltip, .v-snackbar';

// true when no other active overlay is above this dialog's
function isTopOverlay() {
  const active = Array.from(document.querySelectorAll('.v-overlay-container .v-overlay--active')).filter(
    (el) => !el.matches(unstacked),
  );
  const own = active.filter((el) => el.classList.contains(overlayClass));
  if (!own.length) return true;
  const top = Math.max(...active.map(overlayZIndex));
  return own.some((el) => overlayZIndex(el) >= top);
}

function onKeydown(e: KeyboardEvent) {
  if (!isShown.value || e.defaultPrevented || e.repeat || !isTopOverlay()) return;
  if (e.key === 'Enter') {
    const target = e.target as HTMLElement;
    if (target.tagName === 'TEXTAREA' || target.isContentEditable) return;
    const action = props.actions.find((a) => renderOptions(a).defaultConfirm && isReachable(a));
    if (action) run(action, e);
  } else if (e.key === 'Escape') {
    if (rejectAction.value) run(rejectAction.value, e);
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown);
  // an api-owned entry stays: its promise is still unsettled
  if (!props.dialogId) dialogTracker.remove(sym.value);
});

defineSlots<DfModalSlots>();
</script>
