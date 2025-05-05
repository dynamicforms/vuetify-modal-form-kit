/* eslint-disable vue/one-component-per-file */
import { Column } from './column';
import { FormBuilder } from './form-builder';
import { FormBuilderName } from './types';

describe('Column', () => {
  it('should create a column with defaults', () => {
    const column = new Column();
    expect(column.toJSON()).toEqual({ props: { cols: false }, components: [] });
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
    column.component((cmpt) => cmpt
      .generic('VTextField', { label: 'Test' }));

    expect(column.toJSON()).toEqual({
      props: { cols: 12 },
      components: [
        { name: 'VTextField', props: { label: 'Test' } },
      ],
    });
  });

  it('should add multiple components', () => {
    const column = new Column({ cols: 12 });
    column.component((cmpt) => cmpt
      .generic('VTextField', { label: 'Name' })
      .generic('VCheckbox', { label: 'Active' }));

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
    column.component((cmpt) => cmpt
      .generic('VTextField', { label: 'Test' }));

    // Small screen settings
    column.breakpoint('sm', (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'Test', fullWidth: true })));

    expect(column.toJSON()).toEqual({
      props: { cols: 6 },
      components: [
        { name: 'VTextField', props: { label: 'Test' } },
      ],
      sm: {
        props: { cols: false },
        components: [
          { name: 'VTextField', props: { label: 'Test', fullWidth: true } },
        ],
      },
    });
    expect(column.toJSON('xs')).toEqual({
      props: { cols: 6 },
      components: [
        { name: 'VTextField', props: { label: 'Test' } },
      ],
    });
    expect(column.toJSON('lg')).toEqual({
      props: { cols: false },
      components: [
        { name: 'VTextField', props: { label: 'Test', fullWidth: true } },
      ],
    });
  });

  it('should change cols and offset for breakpoints', () => {
    const column = new Column({ cols: 6 });

    column.breakpoint('sm', (col) => { col.props.cols = 12; return col; });
    column.breakpoint('sm', (col) => { col.props.offset = 0; return col; });

    expect(column.toJSON()).toEqual({
      props: { cols: 6 },
      components: [],
      sm: { props: { cols: 12, offset: 0 }, components: [] },
    });
  });

  it('should support nested forms via component method', () => {
    const nestedForm = new FormBuilder();
    nestedForm.row({ }, (row) => row.column({ cols: 12 }));

    const column = new Column({ cols: 12 });
    column.component((cmpt) => cmpt
      .nestedForm(nestedForm));

    expect(column.toJSON()).toEqual({
      props: { cols: 12 },
      components: [
        { name: FormBuilderName, props: nestedForm.toJSON() },
      ],
    });
  });

  it('should serialize nested form correctly', () => {
    const nestedForm = new FormBuilder();
    nestedForm.row({ }, (row) => row
      .column({ cols: 12, offset: 0 }, (col) => col
        .component((cmpt) => cmpt
          .generic('VTextField', { label: 'Nested field' }))));

    const column = new Column({ cols: 12 });
    column.component((cmpt) => cmpt
      .nestedForm(nestedForm));

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

    column.component((cmpt) => cmpt
      .generic('VSelect', complexProps));

    expect(column.toJSON()).toEqual({
      props: { cols: 12 },
      components: [
        { name: 'VSelect', props: complexProps },
      ],
    });
  });
});
