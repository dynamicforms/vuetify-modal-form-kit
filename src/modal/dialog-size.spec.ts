import { defaultDialogSize, dialogSizes, isDialogSize, resolveDialogSize } from './dialog-size';

describe('DialogSize', () => {
  it('resolves every size and every shorter name to the size it names', () => {
    expect(resolveDialogSize('small')).toBe('small');
    expect(resolveDialogSize('sm')).toBe('small');
    expect(resolveDialogSize('modal-sm')).toBe('small');

    expect(resolveDialogSize('medium')).toBe('medium');
    expect(resolveDialogSize('md')).toBe('medium');
    expect(resolveDialogSize('modal-md')).toBe('medium');

    expect(resolveDialogSize('large')).toBe('large');
    expect(resolveDialogSize('lg')).toBe('large');
    expect(resolveDialogSize('modal-lg')).toBe('large');

    expect(resolveDialogSize('x-large')).toBe('x-large');
    expect(resolveDialogSize('xl')).toBe('x-large');
    expect(resolveDialogSize('modal-xl')).toBe('x-large');

    expect(resolveDialogSize('default')).toBe('default');
    expect(defaultDialogSize).toBe('default');
  });

  it('refuses what names no size, rather than falling back to the default', () => {
    expect(() => resolveDialogSize('LARGE' as never)).toThrow("'LARGE' is not a dialog size");
    expect(() => resolveDialogSize(3 as never)).toThrow("'3' is not a dialog size");
  });

  it('answers isDialogSize for the sizes and their shorter names and for nothing else', () => {
    dialogSizes.forEach((size) => expect(isDialogSize(size)).toBe(true));
    ['sm', 'modal-sm', 'md', 'modal-md', 'lg', 'modal-lg', 'xl', 'modal-xl'].forEach((name) =>
      expect(isDialogSize(name)).toBe(true),
    );
    expect(isDialogSize('LARGE')).toBe(false);
    expect(isDialogSize(3)).toBe(false);
    expect(isDialogSize('toString')).toBe(false);
  });
});
