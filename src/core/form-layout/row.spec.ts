import { vi } from 'vitest';

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
    row.col({ cols: 12, offset: 0 }, (col) => col.component((cmpt) => cmpt.generic('VTextField', { label: 'Test' })));

    expect(row.toJSON()).toEqual({
      props: {},
      columns: [
        {
          props: { cols: 12, offset: 0 },
          components: [{ name: 'VTextField', props: { label: 'Test' } }],
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
        columns: [{ props: { cols: 12 }, components: [] }],
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
      columns: [{ props: { cols: 12 }, components: [] }],
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
        columns: [{ props: { cols: 12 }, components: [] }],
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
      row.simple().generic('VTextField', { label: 'First Name' }).generic('VTextField', { label: 'Last Name' });
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
    expect(json.rows[0].columns[0].components[0].props!.label).toBe('First Name');

    // Second column
    expect(json.rows[0].columns[1].props).toEqual({ cols: 12 });
    expect(json.rows[0].columns[1].components.length).toBe(1);
    expect(json.rows[0].columns[1].components[0].name).toBe('VTextField');
    expect(json.rows[0].columns[1].components[0].props!.label).toBe('Last Name');
  });

  it('keeps every row prop it declares', () => {
    const row = new Row({
      dense: true,
      noGutters: true,
      align: 'center',
      'align-content': 'space-between',
      'align-content-md': 'space-around',
      justify: 'space-evenly',
    });

    expect(row.toJSON().props).toEqual({
      dense: true,
      noGutters: true,
      align: 'center',
      'align-content': 'space-between',
      'align-content-md': 'space-around',
      justify: 'space-evenly',
    });
  });

  it('drops a value the prop does not accept', () => {
    // 'space-between' is an align-content value; align has no such alignment
    const row = new Row({ align: 'space-between' as any, justify: 'baseline' as any });

    expect(row.toJSON().props).toEqual({});
  });

  it('keeps the class and style values RowProps declares', () => {
    expect(new Row({ class: 'row-class' }).toJSON().props).toEqual({ class: 'row-class' });
    expect(new Row({ class: ['first', 'second'] }).toJSON().props).toEqual({ class: ['first', 'second'] });
    expect(new Row({ class: { active: true } }).toJSON().props).toEqual({ class: { active: true } });
    expect(new Row({ style: 'color: red' }).toJSON().props).toEqual({ style: 'color: red' });
    expect(new Row({ style: { color: 'red', flexGrow: 1 } }).toJSON().props).toEqual({
      style: { color: 'red', flexGrow: 1 },
    });
    expect(new Row({ style: [{ color: 'red' }, 'margin: 0'] }).toJSON().props).toEqual({
      style: [{ color: 'red' }, 'margin: 0'],
    });
  });

  it('drops a class or style value RowProps does not declare', () => {
    // `class` is a string, a list of strings or a class-to-boolean object; a list holding an object is none of them
    expect(new Row({ class: ['first', { active: true }] as any }).toJSON().props).toEqual({});
    expect(new Row({ class: 42 as any }).toJSON().props).toEqual({});
    // a CSS property holds a string or a number
    expect(new Row({ style: { color: ['red'] } as any }).toJSON().props).toEqual({});
    expect(new Row({ style: 42 as any }).toJSON().props).toEqual({});
  });

  it('carries class and style into a breakpoint that states neither', () => {
    const row = Row.fromJSON({
      props: { class: 'row-class', style: { color: 'red' } },
      columns: [],
      md: { props: { dense: true } },
    });

    expect(row.toJSON('sm').props).toEqual({ class: 'row-class', style: { color: 'red' } });
    expect(row.toJSON('md').props).toEqual({ class: 'row-class', style: { color: 'red' }, dense: true });
  });

  it('lets a breakpoint restate class', () => {
    const row = Row.fromJSON({ props: { class: 'row-class' }, columns: [], md: { props: { class: ['md-class'] } } });

    expect(row.toJSON('sm').props).toEqual({ class: 'row-class' });
    expect(row.toJSON('md').props).toEqual({ class: ['md-class'] });
  });

  it('resolves a row returned from an async function', async () => {
    const row = new Row();
    const build = async () => row.simple(2).generic('VTextField', { label: 'First Name' });

    // resolving the promise reads `then` off the proxy: a component-adding function there opens a column and
    // calls `then` on the component builder, which declares none
    await expect(build()).resolves.toBeDefined();

    expect(row.toJSON()).toEqual({
      props: {},
      columns: [{ props: { cols: 6 }, components: [{ name: 'VTextField', props: { label: 'First Name' } }] }],
    });
  });

  it('answers undefined for the keys a runtime probes the simple() proxy with', () => {
    const row = new Row();
    const proxy = <any>row.simple();

    expect(proxy.then).toBeUndefined();
    expect(proxy.toString).toBeUndefined();
    expect(proxy.valueOf).toBeUndefined();
    expect(proxy.toJSON).toBeUndefined();
    expect(proxy[Symbol.toPrimitive]).toBeUndefined();
    expect(proxy[Symbol.toStringTag]).toBeUndefined();
    expect(proxy[Symbol.iterator]).toBeUndefined();
    expect(proxy[Symbol.asyncIterator]).toBeUndefined();
    expect(proxy[Symbol.for('nodejs.util.inspect.custom')]).toBeUndefined();

    // a probe builds nothing: no column
    expect(row.toJSON().columns).toEqual([]);
  });

  it('should add components using simple(cols = 2) API on Row', () => {
    const fb = new FormBuilder();

    fb.row({}, (row) => {
      row
        .simple(2)
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
    expect(json.rows[0].columns[0].components[0].props!.label).toBe('First Name');

    // Second column
    expect(json.rows[0].columns[1].props).toEqual({ cols: 6 });
    expect(json.rows[0].columns[1].components.length).toBe(1);
    expect(json.rows[0].columns[1].components[0].name).toBe('VTextField');
    expect(json.rows[0].columns[1].components[0].props!.label).toBe('Middle Name');

    // Third column
    expect(json.rows[0].columns[2].props).toEqual({ cols: 6 });
    expect(json.rows[0].columns[2].components.length).toBe(1);
    expect(json.rows[0].columns[2].components[0].name).toBe('VTextField');
    expect(json.rows[0].columns[2].components[0].props!.label).toBe('Last Name');
  });

  describe('fromJSON', () => {
    it('round-trips a serialized row', () => {
      const json = {
        props: { dense: true },
        columns: [{ props: { cols: 6 }, components: [{ name: 'VTextField', props: { label: 'City' } }] }],
      };

      expect(Row.fromJSON(json).toJSON()).toEqual(json);
    });

    it('reads a plain props bag', () => {
      expect(new Row({ dense: true }).toJSON()).toEqual({ props: { dense: true }, columns: [] });
    });

    it('reads a row whose JSON names a breakpoint and nothing else', () => {
      const row = Row.fromJSON(<any>{ sm: { props: { dense: true } } });

      // `sm` is a breakpoint, not a Vuetify prop: taking the object for a props bag would file it under `props`,
      // where the props filter drops it and the override is gone
      expect(row.toJSON('sm').props).toEqual({ dense: true });
      expect(row.toJSON().props).toEqual({});
    });

    it('validates the props of a breakpoint it hydrates', () => {
      const row = Row.fromJSON({
        props: {},
        columns: [],
        // 'baseline' is an align value; justify has no such alignment
        md: { props: { justify: 'baseline' as any, dense: true } },
      });

      expect(row.toJSON('md').props).toEqual({ dense: true });
    });

    it('keeps the columns a breakpoint says nothing about', () => {
      const row = Row.fromJSON({
        props: {},
        columns: [{ props: { cols: 6 }, components: [] }],
        md: { props: { dense: true } },
      });

      expect(row.toJSON('md')).toEqual({ props: { dense: true }, columns: [{ props: { cols: 6 }, components: [] }] });
    });

    it('lets a breakpoint state that the row has no columns', () => {
      const row = Row.fromJSON({
        props: {},
        columns: [{ props: { cols: 6 }, components: [] }],
        md: { props: {}, columns: [] },
      });

      expect(row.toJSON('sm').columns.length).toBe(1);
      expect(row.toJSON('md').columns).toEqual([]);
    });

    it('hands back a Row it is given', () => {
      const row = new Row();
      expect(Row.fromJSON(row)).toBe(row);
    });
  });
});
