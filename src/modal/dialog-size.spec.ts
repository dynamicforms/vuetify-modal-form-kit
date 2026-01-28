import { DialogSize, defaultDialogSize, DialogSizeUtils } from './dialog-size';

describe('DialogSize', () => {
  it('Check Dialog Size From String', () => {
    expect(DialogSizeUtils.fromString('small')).toBe(DialogSize.SMALL);
    expect(DialogSizeUtils.fromString('sm')).toBe(DialogSize.SMALL);
    expect(DialogSizeUtils.fromString('modal-sm')).toBe(DialogSize.SMALL);

    expect(DialogSizeUtils.fromString('medium')).toBe(DialogSize.MEDIUM);
    expect(DialogSizeUtils.fromString('md')).toBe(DialogSize.MEDIUM);
    expect(DialogSizeUtils.fromString('modal-md')).toBe(DialogSize.MEDIUM);

    expect(DialogSizeUtils.fromString('large')).toBe(DialogSize.LARGE);
    expect(DialogSizeUtils.fromString('lg')).toBe(DialogSize.LARGE);
    expect(DialogSizeUtils.fromString('modal-lg')).toBe(DialogSize.LARGE);

    expect(DialogSizeUtils.fromString('x-large')).toBe(DialogSize.X_LARGE);
    expect(DialogSizeUtils.fromString('xl')).toBe(DialogSize.X_LARGE);
    expect(DialogSizeUtils.fromString('modal-xl')).toBe(DialogSize.X_LARGE);

    expect(DialogSizeUtils.fromString('THIS WILL NEVER BE A SIZE')).toEqual(defaultDialogSize);
  });
  it('Check Is Defined', () => {
    expect(DialogSizeUtils.isDefined(DialogSize.LARGE)).toBe(true);
    expect(DialogSizeUtils.isDefined(DialogSize.SMALL)).toBe(true);
    expect(DialogSizeUtils.isDefined(DialogSize.MEDIUM)).toBe(true);
    expect(DialogSizeUtils.isDefined(DialogSize.X_LARGE)).toBe(true);
    expect(DialogSizeUtils.isDefined(DialogSize.DEFAULT)).toBe(true);

    expect(DialogSizeUtils.isDefined('sm')).toBe(true);
    expect(DialogSizeUtils.isDefined('small')).toBe(true);
    expect(DialogSizeUtils.isDefined('modal-sm')).toBe(true);

    expect(DialogSizeUtils.isDefined('md')).toBe(true);
    expect(DialogSizeUtils.isDefined('medium')).toBe(true);
    expect(DialogSizeUtils.isDefined('modal-md')).toBe(true);

    expect(DialogSizeUtils.isDefined('lg')).toBe(true);
    expect(DialogSizeUtils.isDefined('large')).toBe(true);
    expect(DialogSizeUtils.isDefined('modal-lg')).toBe(true);

    expect(DialogSizeUtils.isDefined('xl')).toBe(true);
    expect(DialogSizeUtils.isDefined('x-large')).toBe(true);
    expect(DialogSizeUtils.isDefined('modal-xl')).toBe(true);

    expect(DialogSizeUtils.isDefined(100)).toBe(false);
    expect(DialogSizeUtils.isDefined('THIS WILL NEVER BE A SIZE')).toBe(true);
  });
});
