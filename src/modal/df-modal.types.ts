import * as Form from '@dynamicforms/vue-forms';
import { RenderableValue } from '@dynamicforms/vuetify-inputs';

import type { DialogSizeName } from './dialog-size';

export interface DfModalProps {
  modelValue: boolean;
  size?: DialogSizeName;
  formControl?: Form.Group;
  dialogId?: symbol;
  title?: RenderableValue;
  color?: string;
  icon?: string;
  /**
   * The actions the Enter (`defaultConfirm`) and Esc (`defaultReject`) shortcuts run. The prop renders nothing; the
   * `actions` slot renders them. The flags are read off the action's value, as `<df-actions>` reads them.
   */
  actions?: Form.Action[];
}

export type DfModalSlots = {
  title: () => any;
  body: (props: { formControl: Form.Group | undefined }) => any;
  errors: (props: { errors: Form.ValidationError[]; formControl: Form.Group | undefined }) => any;
  actions: () => any;
};
