enum DialogSize {
  SMALL = 1,
  MEDIUM = 2,
  LARGE = 3,
  X_LARGE = 4,
  DEFAULT = 0,
}

export const defaultDialogSize: DialogSize = DialogSize.DEFAULT;

// eslint-disable-next-line @typescript-eslint/no-namespace,no-redeclare
namespace DialogSize {
  const largeIdentifiers: string[] = ['large', 'lg', 'modal-lg'];
  const mediumIdentifiers: string[] = ['medium', 'md', 'modal-md'];
  const smallIdentifiers: string[] = ['small', 'sm', 'modal-sm'];
  const xLargeIdentifiers: string[] = ['x-large', 'xl', 'modal-xl'];

  // Resolves a string identifier, or undefined when the string names no size. There is no string
  // identifier for DEFAULT: it is the fallback fromString applies, not a size anyone can name.
  function lookup(size: string): DialogSize | undefined {
    if (largeIdentifiers.includes(size)) return DialogSize.LARGE;
    if (mediumIdentifiers.includes(size)) return DialogSize.MEDIUM;
    if (smallIdentifiers.includes(size)) return DialogSize.SMALL;
    if (xLargeIdentifiers.includes(size)) return DialogSize.X_LARGE;
    return undefined;
  }

  export function fromString(size?: string): DialogSize {
    if (size === undefined) return defaultDialogSize;
    return lookup(size) ?? defaultDialogSize;
  }

  export function isDefined(size: number | string) {
    if (typeof size === 'number') return Object.values(DialogSize).includes(size);
    return lookup(size) !== undefined;
  }
}

Object.freeze(DialogSize);
export default DialogSize;
