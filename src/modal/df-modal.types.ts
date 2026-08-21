import * as Form from '@dynamicforms/vue-forms';

import DialogSize from './dialog-size';

export interface DfModalProps {
  modelValue: boolean;
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

export type DfModalSlots = {
  title: () => any;
  body: (props: { formControl: Form.Group }) => Form.Group;
  actions: () => any;
};
