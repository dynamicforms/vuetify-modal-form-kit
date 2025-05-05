import { Row } from './row';

describe('Row', () => {
  it('should create an empty row', () => {
    const row = new Row();
    expect(row.toJSON()).toEqual({ props: {}, columns: [] });
  });

  it('should add columns', () => {
    const row = new Row();
    row.column({ cols: 6 });
    row.column({ cols: 6 });

    expect(row.toJSON()).toEqual({
      props: {},
      columns: [
        { props: { cols: 6 }, components: [] },
        { props: { cols: 6 }, components: [] },
      ],
    });
  });

  it('should add columns with offset', () => {
    const row = new Row();
    row.column({ cols: 4, offset: 2 });
    row.column({ cols: 4, offset: 2 });

    expect(row.toJSON()).toEqual({
      props: {},
      columns: [
        { props: { cols: 4, offset: 2 }, components: [] },
        { props: { cols: 4, offset: 2 }, components: [] },
      ],
    });
  });

  it('should allow adding components to columns', () => {
    const row = new Row();
    row.column({ cols: 12, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'Test' })));

    expect(row.toJSON()).toEqual({
      props: {},
      columns: [
        {
          props: { cols: 12, offset: 0 },
          components: [
            { name: 'VTextField', props: { label: 'Test' } },
          ],
        },
      ],
    });
  });

  it('should handle breakpoints', () => {
    const row = new Row();

    // Default layout
    row.column({ cols: 6 });
    row.column({ cols: 6 });

    // Small screen layout
    row.breakpoint('sm', (r) => r.col({ cols: 12 }));

    expect(row.toJSON()).toEqual({
      props: {},
      columns: [
        { props: { cols: 6 }, components: [] },
        { props: { cols: 6 }, components: [] },
      ],
      sm: {
        props: {},
        columns: [
          { props: { cols: 12 }, components: [] },
        ],
      },
    });
    expect(row.toJSON('xs')).toEqual({
      props: {},
      columns: [
        { props: { cols: 6 }, components: [] },
        { props: { cols: 6 }, components: [] },
      ],
    });
    expect(row.toJSON('md')).toEqual({
      props: {},
      columns: [
        { props: { cols: 12 }, components: [] },
      ],
    });
  });

  it('should handle multiple breakpoints', () => {
    const row = new Row();

    // Default layout
    row.column({ cols: 4 });
    row.column({ cols: 4 });
    row.column({ cols: 4 });

    // Small screen layout
    row.breakpoint('sm', (r) => r.col({ cols: 6 }));
    row.breakpoint('sm', (r) => r.col({ cols: 6 }));

    // Extra small screen layout
    row.breakpoint('xs', (r) => r.col({ cols: 12 }));

    expect(row.toJSON()).toEqual({
      props: {},
      columns: [
        { props: { cols: 4 }, components: [] },
        { props: { cols: 4 }, components: [] },
        { props: { cols: 4 }, components: [] },
      ],
      sm: {
        props: {},
        columns: [
          { props: { cols: 6 }, components: [] },
          { props: { cols: 6 }, components: [] },
        ],
      },
      xs: {
        props: {},
        columns: [
          { props: { cols: 12 }, components: [] },
        ],
      },
    });
  });

  it('should pass columns callback properly', () => {
    const row = new Row();
    const mockCallback = vi.fn().mockReturnValue({});

    row.column({ cols: 12, offset: 0 }, mockCallback);

    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith(expect.any(Object));
  });
});
