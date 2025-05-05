/* eslint-disable vue/one-component-per-file */
import { FormBuilder } from './form-builder';
import { FormBuilderName } from './types';

describe('Layout Integration Tests', () => {
  it('should build a complete form', () => {
    const form = new FormBuilder();

    form.row({ }, (row) => row
      .column({ cols: 6, offset: 0 }, (col) => col
        .component((cmpt) => cmpt
          .generic('VTextField', { label: 'First name', placeholder: 'Enter your first name', rules: ['required'] })))
      .column({ cols: 6, offset: 0 }, (col) => col
        .component((cmpt) => cmpt
          .generic('VTextField', { label: 'Last name', placeholder: 'Enter your last name', rules: ['required'] }))));

    form.row({ }, (row) => row
      .column({ cols: 12, offset: 0 }, (col) => col
        .component((cmpt) => cmpt
          .generic('VTextarea', { label: 'Comments', placeholder: 'Enter any additional comments', rows: 3 }))));

    const json = form.toJSON();

    expect(json.rows.length).toBe(2);
    expect(json.rows[0].columns.length).toBe(2);
    expect(json.rows[1].columns.length).toBe(1);

    // Check first row
    const firstRow = json.rows[0];
    expect(firstRow.columns[0].props.cols).toBe(6);
    expect(firstRow.columns[0].props.offset).toBe(0);
    expect(firstRow.columns[0].components.length).toBe(1);
    expect(firstRow.columns[0].components[0].name).toBe('VTextField');
    expect(firstRow.columns[0].components[0].props.label).toBe('First name');

    expect(firstRow.columns[1].props.cols).toBe(6);
    expect(firstRow.columns[1].props.offset).toBe(0);
    expect(firstRow.columns[1].components.length).toBe(1);
    expect(firstRow.columns[1].components[0].name).toBe('VTextField');
    expect(firstRow.columns[1].components[0].props.label).toBe('Last name');

    // Check second row
    const secondRow = json.rows[1];
    expect(secondRow.columns[0].props.cols).toBe(12);
    expect(secondRow.columns[0].props.offset).toBe(0);
    expect(secondRow.columns[0].components.length).toBe(1);
    expect(secondRow.columns[0].components[0].name).toBe('VTextarea');
    expect(secondRow.columns[0].components[0].props.label).toBe('Comments');
    expect(secondRow.columns[0].components[0].props.rows).toBe(3);
  });

  it('should build a responsive form with breakpoints', () => {
    const form = new FormBuilder();

    // Default layout (md and up)
    form.row({ }, (row) => row
      .column({ cols: 6, offset: 0 }, (col) => col
        .component((cmpt) => cmpt
          .generic('VTextField', { label: 'First name' })))
      .column({ cols: 6, offset: 0 }, (col) => col
        .component((cmpt) => cmpt
          .generic('VTextField', { label: 'Last name' }))));

    // Small screen layout (sm)
    form
      .breakpoint('sm', (frm) => frm
        .row({ }, (row) => row
          .column({ cols: 12, offset: 0 }, (col) => col
            .component((cmpt) => cmpt
              .generic('VTextField', { label: 'First name' }))))
        .row({ }, (row) => row
          .column({ cols: 12, offset: 0 }, (col) => col
            .component((cmpt) => cmpt
              .generic('VTextField', { label: 'Last name' })))));

    // Extra small screen layout (xs)
    form
      .breakpoint('xs', (frm) => frm
        .row({ }, (row) => row
          .column({ cols: 12, offset: 0 }, (col) => col
            .component((cmpt) => cmpt
              .generic('VTextField', { label: 'First name', dense: true }))))
        .row({ }, (row) => row
          .column({ cols: 12, offset: 0 }, (col) => col
            .component((cmpt) => cmpt
              .generic('VTextField', { label: 'Last name', dense: true })))));

    const json = form.toJSON();

    // Check base layout
    expect(json.rows.length).toBe(1);
    expect(json.rows[0].columns.length).toBe(2);

    // Check sm breakpoint
    expect(json.sm?.rows.length).toBe(2);
    expect(json.sm?.rows[0].columns.length).toBe(1);
    expect(json.sm?.rows[1].columns.length).toBe(1);

    // Check xs breakpoint
    expect(json.xs?.rows.length).toBe(2);
    expect(json.xs?.rows[0].columns.length).toBe(1);
    expect(json.xs?.rows[1].columns.length).toBe(1);
    expect(json.xs?.rows[0].columns[0].components[0].props.dense).toBe(true);
  });

  it('should support nested forms', () => {
    // Create an address form
    const addressForm = new FormBuilder();
    addressForm
      .row({ }, (row) => row
        .column({ cols: 8, offset: 0 }, (col) => col
          .component((cmpt) => cmpt.generic('VTextField', { label: 'Street' })))
        .column({ cols: 4, offset: 0 }, (col) => col
          .component((cmpt) => cmpt.generic('VTextField', { label: 'Number' }))))
      .row({ }, (row) => row
        .column({ cols: 6, offset: 0 }, (col) => col.component((cmpt) => cmpt.generic('VTextField', { label: 'City' })))
        .column({ cols: 3, offset: 0 }, (col) => col.component((cmpt) => cmpt.generic('VTextField', { label: 'Zip' })))
        .column({ cols: 3, offset: 0 }, (col) => col
          .component((cmpt) => cmpt.generic('VTextField', { label: 'Country' }))));

    // Create a main form with personal info and nested address
    const personalForm = new FormBuilder();
    personalForm
      .row({}, (row) => row
        .column({ cols: 6, offset: 0 }, (col) => col
          .component((cmpt) => cmpt.generic('VTextField', { label: 'First name' })))
        .column({ cols: 6, offset: 0 }, (col) => col
          .component((cmpt) => cmpt.generic('VTextField', { label: 'Last name' }))))
      .row({ }, (row) => row
        .column({ cols: 12, offset: 0 }, (col) => col.component((cmpt) => cmpt.generic('VDivider', { class: 'my-4' }))))
      .row({ }, (row) => row
        .column({ cols: 12, offset: 0 }, (col) => col
          .component((cmpt) => cmpt.generic('VSubheader', { text: 'Address Information' }))))
      .row({ }, (row) => row.column({ cols: 12, offset: 0 }, (col) => col
        .component((cmpt) => cmpt.nestedForm(addressForm))));

    const json = personalForm.toJSON();

    // Check main form
    expect(json.rows.length).toBe(4);

    // Check nested form component
    const nestedFormComponent = json.rows[3].columns[0].components[0];
    expect(nestedFormComponent.name).toBe(FormBuilderName);
    expect(nestedFormComponent.props).toEqual(addressForm.toJSON());
  });

  it('should handle form with multiple nested layouts and breakpoints', () => {
    // Create a contact form with responsive layout
    const contactForm = new FormBuilder();
    contactForm.row({ }, (row) => row
      .column({ cols: 6, offset: 0 }, (col) => col.component((cmpt) => cmpt.generic('VTextField', { label: 'Email' })))
      .column({ cols: 6, offset: 0 }, (col) => col
        .component((cmpt) => cmpt.generic('VTextField', { label: 'Phone' }))));
    // Small screen layout for contact form
    contactForm.breakpoint('sm', (form) => form
      .row({ }, (row) => row
        .column({ cols: 12, offset: 0 }, (col) => col
          .component((cmpt) => cmpt.generic('VTextField', { label: 'Email' }))))
      .row({ }, (row) => row
        .column({ cols: 12, offset: 0 }, (col) => col
          .component((cmpt) => cmpt.generic('VTextField', { label: 'Phone' })))));

    // Create the main form with nested contact form
    const mainForm = new FormBuilder();
    mainForm
      .row({ }, (row) => row
        .column({ cols: 12, offset: 0 }, (col) => col
          .component((cmpt) => cmpt.generic('VTextField', { label: 'Name' }))))
      .row({ }, (row) => row
        .column({ cols: 12, offset: 0 }, (col) => col.component((cmpt) => cmpt.nestedForm(contactForm))));

    // Small screen layout for main form
    mainForm
      .breakpoint('sm', (form) => form
        .row({ }, (row) => row
          .column({ cols: 12, offset: 0 }, (col) => col
            .component((cmpt) => cmpt.generic('VTextField', { label: 'Name', dense: true }))))
        .row({ }, (row) => row
          .column({ cols: 12, offset: 0 }, (col) => col.component((cmpt) => cmpt.nestedForm(contactForm)))));

    const json = mainForm.toJSON();

    // Check main form
    expect(json.rows.length).toBe(2);
    expect(json.sm?.rows.length).toBe(2);

    // Check that nested form is properly referenced
    const nestedFormComponent = json.rows[1].columns[0].components[0];
    expect(nestedFormComponent.name).toBe(FormBuilderName);
    expect(nestedFormComponent.props).toEqual(contactForm.toJSON());

    // Check that nested form is also properly referenced in responsive layout
    const nestedFormComponentSm = json.sm?.rows[1].columns[0].components[0];
    expect(nestedFormComponentSm?.name).toBe(FormBuilderName);
    expect(nestedFormComponentSm?.props).toEqual(contactForm.toJSON());

    // And the nested form itself should have its own responsive layout
    expect(contactForm.toJSON().sm?.rows.length).toBe(2);
  });
});
