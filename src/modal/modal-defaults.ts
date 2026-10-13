import { reactive } from 'vue';

import type { DialogActionFactories } from './dialog-actions';

export interface DfModalDefaults {
  /** Title bar background color, used by every `<df-modal>` whose own `color` prop is unset. */
  titleColor?: string;
  /** The factories of the default actions of `modal.message()` and `modal.yesNo()` that replace the built-in ones. */
  actions?: Partial<DialogActionFactories>;
}

const modalDefaults: DfModalDefaults = reactive({ titleColor: undefined, actions: undefined });

export function setDfModalDefaults(defaults: Partial<DfModalDefaults>): void {
  Object.assign(modalDefaults, defaults);
}

export default modalDefaults;
