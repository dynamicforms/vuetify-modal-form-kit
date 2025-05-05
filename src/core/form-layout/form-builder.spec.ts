/* eslint-disable vue/one-component-per-file */
import { FormBuilder } from './form-builder';
import { FormBuilderName } from './types';

describe('FormBuilder', () => {
  it('should create an empty form', () => {
    const fb = new FormBuilder();
    expect(fb.toJSON()).toEqual({ rows: [] });
  });

  it('should add a row', () => {
    const fb = new FormBuilder();
    fb.row({ }, (row) => row);

    expect(fb.toJSON()).toEqual({ rows: [{ props: { }, columns: [] }] });
  });

  it('should add a row with columns', () => {
    const fb = new FormBuilder();
    fb.row({ }, (row) => row
      .column({ cols: 6, offset: 0 })
      .column({ cols: 6, offset: 0 }));

    expect(fb.toJSON()).toEqual({
      rows: [{
        props: { },
        columns: [
          { props: { cols: 6, offset: 0 }, components: [] },
          { props: { cols: 6, offset: 0 }, components: [] },
        ],
      }],
    });
  });

  it('should add components to columns', () => {
    const fb = new FormBuilder();
    fb.row({ }, (row) => row
      .column({ cols: 6, offset: 0 }, (col) => col.component((cmpt) => cmpt.generic('VTextField', { label: 'Test' }))));

    expect(fb.toJSON()).toEqual({
      rows: [{
        props: { },
        columns: [
          {
            props: { cols: 6, offset: 0 },
            components: [
              { name: 'VTextField', props: { label: 'Test' } },
            ],
          },
        ],
      }],
    });
  });

  it('should handle breakpoints', () => {
    const fb = new FormBuilder();

    // Default layout
    fb.row({ }, (row) => row
      .column({ cols: 6, offset: 0 })
      .column({ cols: 6, offset: 0 }));

    // Small screen layout
    fb.breakpoint('sm', (form) => form
      .row({ }, (row) => row
        .column({ cols: 12, offset: 0 })));

    expect(fb.toJSON()).toEqual({
      rows: [{
        props: {},
        columns: [
          { props: { cols: 6, offset: 0 }, components: [] },
          { props: { cols: 6, offset: 0 }, components: [] },
        ],
      }],
      sm: {
        rows: [{
          props: {},
          columns: [
            { props: { cols: 12, offset: 0 }, components: [] },
          ],
        }],
      },
    });
    expect(fb.toJSON('xs')).toEqual({
      rows: [{
        props: {},
        columns: [
          { props: { cols: 6, offset: 0 }, components: [] },
          { props: { cols: 6, offset: 0 }, components: [] },
        ],
      }],
    });
    expect(fb.toJSON('xl')).toEqual({
      rows: [{
        props: {},
        columns: [
          { props: { cols: 12, offset: 0 }, components: [] },
        ],
      }],
    });
  });

  it('should allow nesting forms', () => {
    const nestedForm = new FormBuilder();
    nestedForm.row({ }, (row) => row
      .column({ cols: 12, offset: 0 }, (col) => col
        .component((cmpt) => cmpt
          .generic('VTextField', { label: 'Nested' }))));

    const mainForm = new FormBuilder();
    mainForm.row({ }, (row) => row
      .column({ cols: 12, offset: 0 }, (col) => col
        .component((cmpt) => cmpt
          .nestedForm(nestedForm))));

    expect(mainForm.toJSON()).toEqual({
      rows: [{
        props: {},
        columns: [
          {
            props: { cols: 12, offset: 0 },
            components: [{ name: FormBuilderName, props: nestedForm.toJSON() }],
          },
        ],
      }],
    });
  });

  it('should handle complex layouts', () => {
    const fb = new FormBuilder();

    // Row 1: two equal columns
    fb.row({ }, (row) => row
      .column({ cols: 6, offset: 0 }, (col) => col
        .component((cmpt) => cmpt.generic('VTextField', { label: 'First name' })))
      .column({ cols: 6, offset: 0 }, (col) => col
        .component((cmpt) => cmpt.generic('VTextField', { label: 'Last name' }))));

    // Row 2: single column
    fb.row({ }, (row) => row
      .column({ cols: 12, offset: 0 }, (col) => col
        .component((cmpt) => cmpt.generic('VTextarea', { label: 'Comments' }))));

    // Row 3: three equal columns
    fb.row({ }, (row) => row
      .column({ cols: 4, offset: 0 }, (col) => col.component((cmpt) => cmpt.generic('VSelect', { label: 'Country' })))
      .column({ cols: 4, offset: 0 }, (col) => col.component((cmpt) => cmpt.generic('VTextField', { label: 'City' })))
      .column({ cols: 4, offset: 0 }, (col) => col
        .component((cmpt) => cmpt.generic('VTextField', { label: 'Postal code' }))));

    const json = fb.toJSON();
    expect(json.rows.length).toBe(3);
    expect(json.rows[0].columns.length).toBe(2);
    expect(json.rows[1].columns.length).toBe(1);
    expect(json.rows[2].columns.length).toBe(3);
  });
});
