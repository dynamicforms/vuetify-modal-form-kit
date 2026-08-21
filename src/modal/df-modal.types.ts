import * as Form from '@dynamicforms/vue-forms';

import DialogSize from './dialog-size';

export interface DfModalProps {
  modelValue: boolean;
  /**
   * Whether the header carries a close button. Unset, the dialog answers it for itself: the button is drawn where
   * the `actions` prop holds an action Escape reaches, and clicking it is that keystroke - the action runs, and
   * the dialog settles with its key. `true` draws the button whether or not such an action exists, and `false`
   * draws none.
   *
   * A dialog with no reachable `defaultReject` action and `closable: true` falls back to emitting
   * `update:model-value(false)`, which closes a template dialog. That does not settle a dialog the `modal`
   * service owns - one this component was given a `dialogId` for - so state a `defaultReject` action there.
   */
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

export type DfModalSlots = {
  title: () => any;
  body: (props: { formControl: Form.Group }) => Form.Group;
  actions: () => any;
};
