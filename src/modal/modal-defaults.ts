import { reactive } from 'vue';

export interface DfModalDefaults {
  // Title bar background color, used by every <df-modal> whose own `color` prop is unset.
  titleColor?: string;
}

const modalDefaults: DfModalDefaults = reactive({ titleColor: undefined });

export function setDfModalDefaults(defaults: Partial<DfModalDefaults>): void {
  Object.assign(modalDefaults, defaults);
}

export default modalDefaults;
