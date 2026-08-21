import { Column } from './column';
import { FormBuilder } from './form-builder';
import { FormBuilderName } from './types';

describe('Column', () => {
  it('should create a column with defaults', () => {
    const column = new Column();
    expect(column.toJSON()).toEqual({ props: {}, components: [] });
  });

  it('should create a column with specified cols', () => {
    const column = new Column({ cols: 6 });
    expect(column.toJSON()).toEqual({ props: { cols: 6 }, components: [] });
  });

  it('should create a column with specified cols and offset', () => {
    const column = new Column({ cols: 6, offset: 3 });
    expect(column.toJSON()).toEqual({ props: { cols: 6, offset: 3 }, components: [] });
  });

  it('should add components', () => {
    const column = new Column({ cols: 12 });
    column.component((cmpt) => cmpt.generic('VTextField', { label: 'Test' }));

    expect(column.toJSON()).toEqual({
      props: { cols: 12 },
      components: [{ name: 'VTextField', props: { label: 'Test' } }],
    });
  });

  it('should add multiple components', () => {
    const column = new Column({ cols: 12 });
    column.component((cmpt) => cmpt.generic('VTextField', { label: 'Name' }).generic('VCheckbox', { label: 'Active' }));

    expect(column.toJSON()).toEqual({
      props: { cols: 12 },
      components: [
        { name: 'VTextField', props: { label: 'Name' } },
        { name: 'VCheckbox', props: { label: 'Active' } },
      ],
    });
  });

  it('should handle breakpoints', () => {
    const column = new Column({ cols: 6 });

    // Default component
    column.component((cmpt) => cmpt.generic('VTextField', { label: 'Test' }));

    // Small screen settings
    column.breakpoint('sm', (col) =>
      col.component((cmpt) => cmpt.generic('VTextField', { label: 'Test', fullWidth: true })),
    );

    expect(column.toJSON()).toEqual({
      props: { cols: 6 },
      components: [{ name: 'VTextField', props: { label: 'Test' } }],
      sm: {
        props: {},
        components: [{ name: 'VTextField', props: { label: 'Test', fullWidth: true } }],
      },
    });
    expect(column.toJSON('xs')).toEqual({
      props: { cols: 6 },
      components: [{ name: 'VTextField', props: { label: 'Test' } }],
    });
    // the sm breakpoint states a component, not a width, so the width carries over from the base
    expect(column.toJSON('lg')).toEqual({
      props: { cols: 6 },
      components: [{ name: 'VTextField', props: { label: 'Test', fullWidth: true } }],
    });
  });

  it('should change cols and offset for breakpoints', () => {
    const column = new Column({ cols: 6 });

    column.breakpoint('sm', (col) => {
      col.props.cols = 12;
      return col;
    });
    column.breakpoint('sm', (col) => {
      col.props.offset = 0;
      return col;
    });

    // sm states a width, not a component list, so it serializes without one and inherits the base components
    expect(column.toJSON()).toEqual({
      props: { cols: 6 },
      components: [],
      sm: { props: { cols: 12, offset: 0 } },
    });
  });

  it('should drop a cols-md key but keep offset-md and order-md', () => {
    const column = new Column({ cols: 6, 'offset-md': 2, 'order-md': 3, 'cols-md': 12 } as any);

    expect(column.toJSON('md')).toEqual({
      props: { cols: 6, 'offset-md': 2, 'order-md': 3 },
      components: [],
    });
  });

  it('keeps the alignSelf, class and style values ColumnProps declares', () => {
    expect(new Column({ alignSelf: 'center' }).toJSON().props).toEqual({ alignSelf: 'center' });
    expect(new Column({ alignSelf: 'baseline' }).toJSON().props).toEqual({ alignSelf: 'baseline' });
    expect(new Column({ class: 'col-class' }).toJSON().props).toEqual({ class: 'col-class' });
    expect(new Column({ class: ['first', 'second'] }).toJSON().props).toEqual({ class: ['first', 'second'] });
    expect(new Column({ class: { active: true } }).toJSON().props).toEqual({ class: { active: true } });
    expect(new Column({ style: 'color: red' }).toJSON().props).toEqual({ style: 'color: red' });
    expect(new Column({ style: { color: 'red', flexGrow: 1 } }).toJSON().props).toEqual({
      style: { color: 'red', flexGrow: 1 },
    });
    expect(new Column({ style: [{ color: 'red' }, 'margin: 0'] }).toJSON().props).toEqual({
      style: [{ color: 'red' }, 'margin: 0'],
    });
  });

  it('drops an alignSelf, class or style value ColumnProps does not declare', () => {
    // 'space-between' is a justify value; alignSelf has no such alignment
    expect(new Column({ alignSelf: 'space-between' as any }).toJSON().props).toEqual({});
    // `class` is a string, a list of strings or a class-to-boolean object; a list holding an object is none of them
    expect(new Column({ class: ['first', { active: true }] as any }).toJSON().props).toEqual({});
    expect(new Column({ class: 42 as any }).toJSON().props).toEqual({});
    // a CSS property holds a string or a number
    expect(new Column({ style: { color: ['red'] } as any }).toJSON().props).toEqual({});
    expect(new Column({ style: 42 as any }).toJSON().props).toEqual({});
  });

  it('takes a number for offset and order, and nothing else', () => {
    expect(new Column({ offset: 2, order: 3 }).toJSON().props).toEqual({ offset: 2, order: 3 });
    // ColumnProps declares number | 'auto' | boolean for both; the filter takes the number alone
    expect(new Column({ offset: 'auto', order: 'auto' }).toJSON().props).toEqual({});
  });

  it('carries alignSelf, class and style into a breakpoint that states none of them', () => {
    const column = Column.fromJSON({
      props: { alignSelf: 'center', class: 'col-class', style: { color: 'red' } },
      components: [],
      md: { props: { cols: 4 } },
    });

    expect(column.toJSON('sm').props).toEqual({ alignSelf: 'center', class: 'col-class', style: { color: 'red' } });
    expect(column.toJSON('md').props).toEqual({
      alignSelf: 'center',
      class: 'col-class',
      style: { color: 'red' },
      cols: 4,
    });
  });

  it('lets a breakpoint restate alignSelf', () => {
    const column = Column.fromJSON({
      props: { alignSelf: 'center' },
      components: [],
      md: { props: { alignSelf: 'stretch' } },
    });

    expect(column.toJSON('sm').props).toEqual({ alignSelf: 'center' });
    expect(column.toJSON('md').props).toEqual({ alignSelf: 'stretch' });
  });

  it('resolves a column returned from an async function', async () => {
    const column = new Column({ cols: 12 });
    const build = async () => column.simple().generic('VTextField', { label: 'First Name' });

    // resolving the promise reads `then` off the proxy: a component-adding function there calls `then` on the
    // component builder, which declares none
    await expect(build()).resolves.toBeDefined();

    expect(column.toJSON()).toEqual({
      props: { cols: 12 },
      components: [{ name: 'VTextField', props: { label: 'First Name' } }],
    });
  });

  it('answers undefined for the keys a runtime probes the simple() proxy with', () => {
    const column = new Column({ cols: 12 });
    const proxy = <any>column.simple();

    expect(proxy.then).toBeUndefined();
    expect(proxy.toString).toBeUndefined();
    expect(proxy.valueOf).toBeUndefined();
    expect(proxy.toJSON).toBeUndefined();
    expect(proxy[Symbol.toPrimitive]).toBeUndefined();
    expect(proxy[Symbol.toStringTag]).toBeUndefined();
    expect(proxy[Symbol.iterator]).toBeUndefined();
    expect(proxy[Symbol.asyncIterator]).toBeUndefined();
    expect(proxy[Symbol.for('nodejs.util.inspect.custom')]).toBeUndefined();

    // a probe builds nothing: no component
    expect(column.toJSON().components).toEqual([]);
  });

  it('should support nested forms via component method', () => {
    const nestedForm = new FormBuilder();
    nestedForm.row({}, (row) => row.col({ cols: 12 }));

    const column = new Column({ cols: 12 });
    column.component((cmpt) => cmpt.nestedForm(nestedForm));

    expect(column.toJSON()).toEqual({
      props: { cols: 12 },
      components: [{ name: FormBuilderName, props: nestedForm.toJSON() }],
    });
  });

  it('should serialize nested form correctly', () => {
    const nestedForm = new FormBuilder();
    nestedForm.row({}, (row) =>
      row.col({ cols: 12, offset: 0 }, (col) =>
        col.component((cmpt) => cmpt.generic('VTextField', { label: 'Nested field' })),
      ),
    );

    const column = new Column({ cols: 12 });
    column.component((cmpt) => cmpt.nestedForm(nestedForm));

    const json = column.toJSON();
    expect(json.components[0].name).toBe(FormBuilderName);
    expect(json.components[0].props).toEqual(nestedForm.toJSON());
  });

  it('should handle complex component props', () => {
    const column = new Column({ cols: 12 });
    const complexProps = {
      label: 'Test',
      rules: ['required', 'email'],
      items: [
        { text: 'Option 1', value: 1 },
        { text: 'Option 2', value: 2 },
      ],
      on: { change: () => {} },
    };

    column.component((cmpt) => cmpt.generic('VSelect', complexProps));

    expect(column.toJSON()).toEqual({
      props: { cols: 12 },
      components: [{ name: 'VSelect', props: complexProps }],
    });
  });
  it('should add components using simple() API on Column', () => {
    const fb = new FormBuilder();

    fb.row({}, (row) =>
      row.col({}, (col) => {
        col.simple().generic('VTextField', { label: 'First Name' }).generic('VTextField', { label: 'Last Name' });
        return col;
      }),
    );

    const json = fb.toJSON();

    // Should have 1 row with 1 column containing 2 components
    expect(json.rows.length).toBe(1);
    expect(json.rows[0].columns.length).toBe(1);
    expect(json.rows[0].columns[0].components.length).toBe(2);

    // First component
    expect(json.rows[0].columns[0].components[0].name).toBe('VTextField');
    expect(json.rows[0].columns[0].components[0].props!.label).toBe('First Name');

    // Second component
    expect(json.rows[0].columns[0].components[1].name).toBe('VTextField');
    expect(json.rows[0].columns[0].components[1].props!.label).toBe('Last Name');
  });

  describe('fromJSON', () => {
    it('round-trips a serialized column', () => {
      const json = {
        props: { cols: 12 },
        components: [{ name: 'VTextField', props: { label: 'City' } }],
      };

      expect(Column.fromJSON(json).toJSON()).toEqual(json);
    });

    it('reads a plain props bag', () => {
      expect(new Column({ cols: 6 }).toJSON()).toEqual({ props: { cols: 6 }, components: [] });
    });

    it('keeps the components a breakpoint says nothing about', () => {
      const column = Column.fromJSON({
        props: { cols: 6 },
        components: [{ name: 'VTextField', props: { label: 'City' } }],
        md: { props: { cols: 4 } },
      });

      expect(column.toJSON('md')).toEqual({
        props: { cols: 4 },
        components: [{ name: 'VTextField', props: { label: 'City' } }],
      });
    });

    it('lets a breakpoint state that the column has no components', () => {
      const column = Column.fromJSON({
        props: { cols: 6 },
        components: [{ name: 'VTextField', props: { label: 'City' } }],
        md: { props: {}, components: [] },
      });

      expect(column.toJSON('sm').components.length).toBe(1);
      expect(column.toJSON('md').components).toEqual([]);
    });

    it('reads a column whose JSON names a breakpoint and nothing else', () => {
      const column = Column.fromJSON(<any>{ sm: { props: { cols: 6 } } });

      // `sm` is a breakpoint, not a Vuetify prop: taking the object for a props bag would file it under `props`,
      // where the props filter drops it and the override is gone
      expect(column.toJSON('sm').props).toEqual({ cols: 6 });
      expect(column.toJSON().props).toEqual({});
    });

    it('hydrates a nested form component without touching its layout', () => {
      const nested = new FormBuilder();
      nested.row({}, (row) => row.col({ cols: 12 }));

      const json = { props: { cols: 12 }, components: [{ name: FormBuilderName, props: nested.toJSON() }] };

      expect(Column.fromJSON(json).toJSON()).toEqual(json);
    });

    it('hands back a Column it is given', () => {
      const column = new Column();
      expect(Column.fromJSON(column)).toBe(column);
    });
  });
});
