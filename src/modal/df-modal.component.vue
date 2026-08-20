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
import { ActionRenderOptions } from '@dynamicforms/vuetify-inputs';
import { computed, getCurrentInstance, onMounted, onUnmounted, watch } from 'vue';
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
  // still up to the `actions` slot - this prop only drives the keyboard handling. The flags are read off the
  // action's value, which is where <df-actions> reads them too, so any vue-forms Action states them.
  actions?: Form.Action[];
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
const instance = getCurrentInstance();
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

// defaultConfirm / defaultReject live on the action's value, not on a class: <df-actions> reads them there and so
// does this, which is what lets a dialog take an action of either class.
function renderOptions(action: Form.Action): ActionRenderOptions {
  return (action.value ?? {}) as ActionRenderOptions;
}

// The keyboard reaches an action that is rendered at FULL, that is enabled all the way up - `effectiveEnabled` is
// false where the action or any container above it is disabled - and that is not already running. `busy` is what
// keeps a held-down Enter from starting a second run of a handler that has yet to settle.
function isReachable(action: Form.Action) {
  return action.effectiveEnabled && action.visibility === Form.DisplayMode.FULL && !action.busy;
}

// execute() is asynchronous and this is a document listener, so nothing wraps it the way Vue wraps a template
// handler: a rejecting handler would leave an unhandled rejection. The error goes where a template handler's
// would have gone.
function run(action: Form.Action, e: KeyboardEvent) {
  e.preventDefault();
  action.execute(e).catch((error: unknown) => {
    const handler = instance?.appContext.config.errorHandler;
    if (handler) handler(error, instance?.proxy ?? null, 'df-modal keyboard shortcut');
    else console.error(error);
  });
}

function onKeydown(e: KeyboardEvent) {
  if (!isShown.value || e.defaultPrevented || e.repeat) return;
  if (e.key === 'Enter') {
    const target = e.target as HTMLElement;
    if (target.tagName === 'TEXTAREA' || target.isContentEditable) return;
    const action = props.actions.find((a) => renderOptions(a).defaultConfirm && isReachable(a));
    if (action) run(action, e);
  } else if (e.key === 'Escape') {
    const action = props.actions.find((a) => renderOptions(a).defaultReject && isReachable(a));
    if (action) run(action, e);
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
