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
    expect(json.rows[0].columns[0].components[0].props.label).toBe('First Name');

    // Second component
    expect(json.rows[0].columns[0].components[1].name).toBe('VTextField');
    expect(json.rows[0].columns[0].components[1].props.label).toBe('Last Name');
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
