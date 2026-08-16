import DialogSize, { defaultDialogSize } from './dialog-size';

describe('DialogSize', () => {
  it('Check Dialog Size From String', () => {
    expect(DialogSize.fromString('small')).toBe(DialogSize.SMALL);
    expect(DialogSize.fromString('sm')).toBe(DialogSize.SMALL);
    expect(DialogSize.fromString('modal-sm')).toBe(DialogSize.SMALL);

    expect(DialogSize.fromString('medium')).toBe(DialogSize.MEDIUM);
    expect(DialogSize.fromString('md')).toBe(DialogSize.MEDIUM);
    expect(DialogSize.fromString('modal-md')).toBe(DialogSize.MEDIUM);

    expect(DialogSize.fromString('large')).toBe(DialogSize.LARGE);
    expect(DialogSize.fromString('lg')).toBe(DialogSize.LARGE);
    expect(DialogSize.fromString('modal-lg')).toBe(DialogSize.LARGE);

    expect(DialogSize.fromString('x-large')).toBe(DialogSize.X_LARGE);
    expect(DialogSize.fromString('xl')).toBe(DialogSize.X_LARGE);
    expect(DialogSize.fromString('modal-xl')).toBe(DialogSize.X_LARGE);

    expect(DialogSize.fromString('THIS WILL NEVER BE A SIZE')).toEqual(defaultDialogSize);
  });
  it('Check Is Defined', () => {
    expect(DialogSize.isDefined(DialogSize.LARGE)).toBe(true);
    expect(DialogSize.isDefined(DialogSize.SMALL)).toBe(true);
    expect(DialogSize.isDefined(DialogSize.MEDIUM)).toBe(true);
    expect(DialogSize.isDefined(DialogSize.X_LARGE)).toBe(true);
    expect(DialogSize.isDefined(DialogSize.DEFAULT)).toBe(true);

    expect(DialogSize.isDefined('sm')).toBe(true);
    expect(DialogSize.isDefined('small')).toBe(true);
    expect(DialogSize.isDefined('modal-sm')).toBe(true);

    expect(DialogSize.isDefined('md')).toBe(true);
    expect(DialogSize.isDefined('medium')).toBe(true);
    expect(DialogSize.isDefined('modal-md')).toBe(true);

    expect(DialogSize.isDefined('lg')).toBe(true);
    expect(DialogSize.isDefined('large')).toBe(true);
    expect(DialogSize.isDefined('modal-lg')).toBe(true);

    expect(DialogSize.isDefined('xl')).toBe(true);
    expect(DialogSize.isDefined('x-large')).toBe(true);
    expect(DialogSize.isDefined('modal-xl')).toBe(true);

    expect(DialogSize.isDefined(100)).toBe(false);
    expect(DialogSize.isDefined('THIS WILL NEVER BE A SIZE')).toBe(false);
  });
  it('Check Is Defined Reports Actual Existence', () => {
    const identifiers = [
      'small',
      'sm',
      'modal-sm',
      'medium',
      'md',
      'modal-md',
      'large',
      'lg',
      'modal-lg',
      'x-large',
      'xl',
      'modal-xl',
    ];
    identifiers.forEach((identifier) => expect(DialogSize.isDefined(identifier)).toBe(true));

    // DEFAULT has no string identifier, so no string resolves to it
    expect(DialogSize.isDefined('default')).toBe(false);
    expect(DialogSize.isDefined('')).toBe(false);
    expect(DialogSize.isDefined('modal-xxl')).toBe(false);

    // fromString falls back to defaultDialogSize for an unrecognised string
    expect(DialogSize.fromString('default')).toBe(defaultDialogSize);
    expect(DialogSize.fromString('modal-xxl')).toBe(defaultDialogSize);
  });
});
