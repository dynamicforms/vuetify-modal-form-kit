import modalDefaults, { setDfModalDefaults } from './modal-defaults';

describe('modalDefaults', () => {
  afterEach(() => {
    setDfModalDefaults({ titleColor: undefined });
  });

  it('starts with no title color', () => {
    expect(modalDefaults.titleColor).toBeUndefined();
  });

  it('applies a partial update onto the reactive singleton', () => {
    setDfModalDefaults({ titleColor: 'primary' });
    expect(modalDefaults.titleColor).toBe('primary');

    setDfModalDefaults({});
    expect(modalDefaults.titleColor).toBe('primary');

    setDfModalDefaults({ titleColor: undefined });
    expect(modalDefaults.titleColor).toBeUndefined();
  });
});
