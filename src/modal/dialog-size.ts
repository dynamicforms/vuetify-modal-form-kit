export enum DialogSize {
  DEFAULT = 0,
  SMALL = 1,
  MEDIUM = 2,
  LARGE = 3,
  X_LARGE = 4,
}

export const defaultDialogSize = DialogSize.DEFAULT;

const largeIdentifiers = ['large', 'lg', 'modal-lg'] as const;
const mediumIdentifiers = ['medium', 'md', 'modal-md'] as const;
const smallIdentifiers = ['small', 'sm', 'modal-sm'] as const;
const xLargeIdentifiers = ['x-large', 'xl', 'modal-xl'] as const;

export const DialogSizeUtils = {
  fromString(size?: string): DialogSize {
    if (!size) return defaultDialogSize;
    if (largeIdentifiers.includes(size as any)) return DialogSize.LARGE;
    if (mediumIdentifiers.includes(size as any)) return DialogSize.MEDIUM;
    if (smallIdentifiers.includes(size as any)) return DialogSize.SMALL;
    if (xLargeIdentifiers.includes(size as any)) return DialogSize.X_LARGE;
    return defaultDialogSize;
  },

  isDefined(size: number | string): boolean {
    const value = typeof size === 'number' ? size : DialogSizeUtils.fromString(size);

    return Object.values(DialogSize)
      .filter((v) => typeof v === 'number')
      .includes(value);
  },
};
