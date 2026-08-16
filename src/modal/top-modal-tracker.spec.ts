import dialogTracker from './top-modal-tracker';

describe('DialogTracker', () => {
  it('makes the most recently pushed dialog the top one', () => {
    const a = Symbol('a');
    const b = Symbol('b');

    dialogTracker.push(a);
    expect(dialogTracker.isTop(a).value).toBe(true);

    dialogTracker.push(b);
    expect(dialogTracker.isTop(a).value).toBe(false);
    expect(dialogTracker.isTop(b).value).toBe(true);

    dialogTracker.remove(b);
    expect(dialogTracker.isTop(a).value).toBe(true);

    dialogTracker.remove(a);
    expect(dialogTracker.currentRef.value).toBeNull();
  });

  it('removes from the middle of the stack without changing the top', () => {
    const a = Symbol('a');
    const b = Symbol('b');
    const c = Symbol('c');

    dialogTracker.push(a);
    dialogTracker.push(b);
    dialogTracker.push(c);

    dialogTracker.remove(b);
    expect(dialogTracker.isTop(c).value).toBe(true);

    dialogTracker.remove(c);
    expect(dialogTracker.isTop(a).value).toBe(true);

    dialogTracker.remove(a);
  });

  it('ignores removal of a symbol it does not hold', () => {
    const a = Symbol('a');
    dialogTracker.push(a);

    dialogTracker.remove(Symbol('never pushed'));
    expect(dialogTracker.isTop(a).value).toBe(true);

    dialogTracker.remove(a);
  });
});
