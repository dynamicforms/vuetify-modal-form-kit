import { vi } from 'vitest';

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

  it('resolves what names no size to the default, warning once per name', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(resolveDialogSize('LARGE')).toBe('default');
    expect(resolveDialogSize('LARGE')).toBe('default');
    expect(resolveDialogSize(3 as never)).toBe('default');

    expect(warn.mock.calls.map(([message]) => message)).toEqual([
      expect.stringContaining("'LARGE' is not a dialog size"),
      expect.stringContaining("'3' is not a dialog size"),
    ]);
    warn.mockRestore();
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
