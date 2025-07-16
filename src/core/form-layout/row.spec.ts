import { FormBuilder } from './form-builder';
import { Row } from './row';

describe('Row', () => {
  it('should create an empty row', () => {
    const row = new Row();
    expect(row.toJSON()).toEqual({ props: {}, columns: [] });
  });

  it('should add columns', () => {
    const row = new Row();
    row.col({ cols: 6 });
    row.col({ cols: 6 });

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
    row.col({ cols: 4, offset: 2 });
    row.col({ cols: 4, offset: 2 });

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
    row.col({ cols: 12, offset: 0 }, (col) => col
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
    row.col({ cols: 6 });
    row.col({ cols: 6 });

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
    row.col({ cols: 4 });
    row.col({ cols: 4 });
    row.col({ cols: 4 });

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

    row.col({ cols: 12, offset: 0 }, mockCallback);

    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith(expect.any(Object));
  });

  it('should add components using simple() API on Row', () => {
    const fb = new FormBuilder();

    fb.row({}, (row) => {
      row.simple()
        .generic('VTextField', { label: 'First Name' })
        .generic('VTextField', { label: 'Last Name' });
      return row;
    });

    const json = fb.toJSON();

    // Should have 1 row with 2 columns
    expect(json.rows.length).toBe(1);
    expect(json.rows[0].columns.length).toBe(2);

    // First column
    expect(json.rows[0].columns[0].props).toEqual({ cols: 12 });
    expect(json.rows[0].columns[0].components.length).toBe(1);
    expect(json.rows[0].columns[0].components[0].name).toBe('VTextField');
    expect(json.rows[0].columns[0].components[0].props.label).toBe('First Name');

    // Second column
    expect(json.rows[0].columns[1].props).toEqual({ cols: 12 });
    expect(json.rows[0].columns[1].components.length).toBe(1);
    expect(json.rows[0].columns[1].components[0].name).toBe('VTextField');
    expect(json.rows[0].columns[1].components[0].props.label).toBe('Last Name');
  });

  it('should add components using simple(cols = 2) API on Row', () => {
    const fb = new FormBuilder();

    fb.row({}, (row) => {
      row.simple(2)
        .generic('VTextField', { label: 'First Name' })
        .generic('VTextField', { label: 'Middle Name' })
        .generic('VTextField', { label: 'Last Name' });
      return row;
    });

    const json = fb.toJSON();

    // Should have 1 row with 3 columns, eash 6 wide (because we specified a 2-column layout)
    expect(json.rows.length).toBe(1);
    expect(json.rows[0].columns.length).toBe(3);

    // First column
    expect(json.rows[0].columns[0].props).toEqual({ cols: 6 });
    expect(json.rows[0].columns[0].components.length).toBe(1);
    expect(json.rows[0].columns[0].components[0].name).toBe('VTextField');
    expect(json.rows[0].columns[0].components[0].props.label).toBe('First Name');

    // Second column
    expect(json.rows[0].columns[1].props).toEqual({ cols: 6 });
    expect(json.rows[0].columns[1].components.length).toBe(1);
    expect(json.rows[0].columns[1].components[0].name).toBe('VTextField');
    expect(json.rows[0].columns[1].components[0].props.label).toBe('Middle Name');

    // Third column
    expect(json.rows[0].columns[2].props).toEqual({ cols: 6 });
    expect(json.rows[0].columns[2].components.length).toBe(1);
    expect(json.rows[0].columns[2].components[0].name).toBe('VTextField');
    expect(json.rows[0].columns[2].components[0].props.label).toBe('Last Name');
  });
});
