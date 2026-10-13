import { interpolate } from '@dynamicforms/translatable';
import { type ErrorText, MdString } from '@dynamicforms/vuetify-inputs';

// The messages of the error codes the demos raise. A code with an `Md` entry renders that entry as markdown; a code
// with neither entry renders as the error's detail.
const messages: Record<string, string> = {
  required: 'Please enter a value',
  invalid_email: 'Please enter a valid email address',
  invalid_emailMd: 'Please enter a valid **email address**',
};

export const errorText: ErrorText = (error) => {
  const markdown = messages[`${error.code}Md`];
  if (markdown !== undefined) return new MdString(interpolate(markdown, error.params));
  const text = messages[error.code];
  return text === undefined ? undefined : interpolate(text, error.params);
};
