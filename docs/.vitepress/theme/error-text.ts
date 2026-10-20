import { interpolate } from '@dynamicforms/translatable';
import { ERROR_NAMESPACE as VUE_FORMS_ERRORS } from '@dynamicforms/vue-forms';
import { ERROR_NAMESPACE as VUETIFY_INPUTS_ERRORS, type ErrorText, MdString } from '@dynamicforms/vuetify-inputs';

// The messages of the error codes the demos raise, keyed `<prefix>.<code>`. A key with an `Md` entry renders that
// entry as markdown; a code with neither entry renders as the error's detail.
const messages: Record<string, string> = {
  'libs.vue-forms.required': 'Please enter a value',
  'errors.invalid_email': 'Please enter a valid email address',
  'errors.invalid_emailMd': 'Please enter a valid **email address**',
};

// the key prefix of each error namespace: vue-forms', vuetify-inputs' and the demos' own `app`
const keyPrefixes: Record<string, string> = {
  [VUE_FORMS_ERRORS]: 'libs.vue-forms',
  [VUETIFY_INPUTS_ERRORS]: 'libs.vuetify-inputs',
  app: 'errors',
};

// the message key of a full error code, split at its last `.`; undefined for a namespace without a prefix
const errorKey = (fullCode: string) => {
  const dot = fullCode.lastIndexOf('.');
  const prefix = keyPrefixes[fullCode.slice(0, dot)];
  return prefix === undefined ? undefined : `${prefix}.${fullCode.slice(dot + 1)}`;
};

export const errorText: ErrorText = (error) => {
  const key = errorKey(error.code);
  if (key === undefined) return undefined;
  const markdown = messages[`${key}Md`];
  if (markdown !== undefined) return new MdString(interpolate(markdown, error.params));
  const text = messages[key];
  return text === undefined ? undefined : interpolate(text, error.params);
};
