import { createTranslatable, type TranslateFunction, type Translatable } from '@dynamicforms/translatable';
import { getCurrentInstance, inject, type InjectionKey } from 'vue';

const defaults = {
  Close: 'Close',
  Yes: 'Yes',
  No: 'No',
};

type Key = keyof typeof defaults;

/** The namespace the library's keys are looked up under where none is given: `df_modal.Close`. */
export const defaultTranslateNamespace = 'df_modal';

/** The translation settings an app installed with `DynamicFormsModalFormKit` provides. */
export interface ModalTranslationSettings {
  /** The translation function of the library's strings, shaped like vue-i18n's `t`. */
  translate?: TranslateFunction;
  /** The namespace `translate` looks the keys up under. `''` looks them up without one. */
  translateNamespace?: string;
}

export const modalTranslationSettingsKey: InjectionKey<ModalTranslationSettings> = Symbol('dfModalTranslation');

const global = createTranslatable(defaults);

/**
 * Sets the translation function of the library's strings for the whole process; see `@dynamicforms/translatable`.
 * The keys are looked up under `namespace`, `'df_modal'` where it is not given. An app installed with the
 * `translate` option translates with that one instead.
 */
export function translateStrings(t: TranslateFunction, namespace: string = defaultTranslateNamespace): void {
  global.translateStrings(t, namespace);
}

// one Translatable per settings object that states `translate`, made on first use
const perApp = new WeakMap<ModalTranslationSettings, Translatable<typeof defaults>>();

function translatableOf(settings: ModalTranslationSettings | undefined): Translatable<typeof defaults> {
  if (!settings?.translate) return global;
  let translatable = perApp.get(settings);
  if (!translatable) {
    translatable = createTranslatable(defaults);
    translatable.translateStrings(settings.translate, settings.translateNamespace ?? defaultTranslateNamespace);
    perApp.set(settings, translatable);
  }
  return translatable;
}

/**
 * The current translation of one of the library's strings. Called while a component sets up or renders, it
 * translates with the `translate` option of the app the component belongs to, where one is given, and with the
 * function `translateStrings` set otherwise.
 */
export function translate(key: Key, params?: Record<string, unknown>): string {
  const settings = getCurrentInstance() ? inject(modalTranslationSettingsKey, {}) : undefined;
  return translatableOf(settings).translate(key, params);
}
