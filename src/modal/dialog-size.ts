/**
 * How wide a dialog is. Each of the four explicit sizes switches to fullscreen below its own breakpoint; `'default'`
 * sizes the dialog to its content and never does.
 */
export type DialogSize = 'small' | 'medium' | 'large' | 'x-large' | 'default';

/**
 * A size as the dialog options and `df-modal`'s `size` prop take it: a `DialogSize`, which is what an editor offers,
 * or one of its shorter names - `'sm'`, `'modal-sm'`, `'md'`, `'modal-md'`, `'lg'`, `'modal-lg'`, `'xl'`,
 * `'modal-xl'` - which `resolveDialogSize` accepts as well. `(string & {})` keeps the shorter names assignable without
 * collapsing the union into `string`, so the editor still lists the five sizes.
 */

export type DialogSizeName = DialogSize | (string & {});

/** every size */
export const dialogSizes: readonly DialogSize[] = Object.freeze(['small', 'medium', 'large', 'x-large', 'default']);

/** What a dialog's size is where nothing states one. */
export const defaultDialogSize: DialogSize = 'default';

const sizeOfName: Readonly<Record<string, DialogSize>> = Object.freeze({
  small: 'small',
  sm: 'small',
  'modal-sm': 'small',
  medium: 'medium',
  md: 'medium',
  'modal-md': 'medium',
  large: 'large',
  lg: 'large',
  'modal-lg': 'large',
  'x-large': 'x-large',
  xl: 'x-large',
  'modal-xl': 'x-large',
  default: 'default',
});

/** Answers whether `value` names a size: a `DialogSize` or one of its shorter names. */
export function isDialogSize(value: unknown): value is DialogSizeName {
  return typeof value === 'string' && Object.hasOwn(sizeOfName, value);
}

// a size is resolved on every render of the dialog, so a name is reported once
const reportedNames = new Set<unknown>();

/**
 * The size `name` names. A shorter name resolves to its size. Anything that names none resolves to
 * `defaultDialogSize`, with a console warning naming it, once per name.
 */
export function resolveDialogSize(name: DialogSizeName): DialogSize {
  if (isDialogSize(name)) return sizeOfName[name];
  if (!reportedNames.has(name)) {
    reportedNames.add(name);
    console.warn(
      `'${String(name)}' is not a dialog size (${dialogSizes.join(', ')}); ` +
        `the dialog is drawn at '${defaultDialogSize}'.`,
    );
  }
  return defaultDialogSize;
}
