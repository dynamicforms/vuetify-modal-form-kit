export { default as ModalView } from './df-api.component.vue';
export { default as DfModal } from './df-modal.component.vue';
export type { DfModalProps, DfModalSlots } from './df-modal.types';
export { default as modal, type CloseablePromise, type FormActions, type ModalOptions } from './api';
export {
  type DialogSize,
  type DialogSizeName,
  defaultDialogSize,
  dialogSizes,
  isDialogSize,
  resolveDialogSize,
} from './dialog-size';
export { setDfModalDefaults, type DfModalDefaults } from './modal-defaults';
