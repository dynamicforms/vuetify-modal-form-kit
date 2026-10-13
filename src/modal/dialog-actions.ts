import type * as Form from '@dynamicforms/vue-forms';
import { Action } from '@dynamicforms/vuetify-inputs';

import modalDefaults from './modal-defaults';
import { translate } from './translations';

/**
 * The actions `modal.message()` (`close`) and `modal.yesNo()` (`yes`, `no`) state where the caller states none that
 * is drawn. Each factory returns a new action for every dialog.
 */
export interface DialogActionFactories {
  close: () => Form.Action;
  yes: () => Form.Action;
  no: () => Form.Action;
}

/**
 * The built-in factories. Their labels are the library's translations of `Close`, `Yes` and `No`, read while the
 * button renders. `close` is the dialog's `defaultConfirm` and `defaultReject` action, `yes` its `defaultConfirm`
 * and `no` its `defaultReject`; `yes` is drawn in the `success` color and `no` in the `error` color.
 */
export const defaultDialogActions: Readonly<DialogActionFactories> = Object.freeze({
  close: () =>
    new Action({
      value: {
        name: 'close',
        label: () => translate('Close'),
        icon: 'mdi-close',
        renderAs: 'button',
        showLabel: true,
        showIcon: true,
        defaultConfirm: true,
        defaultReject: true,
      },
    }),
  yes: () =>
    new Action({
      value: {
        name: 'yes',
        label: () => translate('Yes'),
        icon: 'mdi-check',
        renderAs: 'button',
        showLabel: true,
        showIcon: true,
        defaultConfirm: true,
        passthroughAttrs: { color: 'success' },
      },
    }),
  no: () =>
    new Action({
      value: {
        name: 'no',
        label: () => translate('No'),
        icon: 'mdi-close',
        renderAs: 'button',
        showLabel: true,
        showIcon: true,
        defaultReject: true,
        passthroughAttrs: { color: 'error' },
      },
    }),
});

/** The factory of `name`: the one `setDfModalDefaults({ actions })` states, the built-in one otherwise. */
export function dialogAction(name: keyof DialogActionFactories): Form.Action {
  return (modalDefaults.actions?.[name] ?? defaultDialogActions[name])();
}
