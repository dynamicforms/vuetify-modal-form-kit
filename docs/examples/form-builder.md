# FormBuilder Component

The FormBuilder component provides a programmatic API for creating responsive form layouts that integrate seamlessly 
with Vuetify. It allows you to define form layouts in code instead of templates, making it ideal for both backend-driven
layouts and programmatically generated forms.

## Basic Usage

Below is an example of a basic form layout created with FormBuilder:

<form-basic/>

## Features

- Programmatic API for defining form layouts
- Full support for responsive designs with breakpoint-specific layouts
- Integration with [`@dynamicforms/vue-forms`](:vue-forms:) for state management and validation
- Default editors supported from [`@dynamicforms/vuetify-inputs`](:vuetify-inputs:)
- Nesting capabilities for complex form structures
- Integration with all Vuetify input components

## API Usage

The FormBuilder provides a fluent API for defining form layouts.

### Using `simple()` (recommended)

The `simple(cols)` method is the most concise way to build a layout. It creates a new row automatically
whenever the number of components in the current row reaches `cols`:

```typescript
const form = new FormBuilder();

// Two equal columns; each dfInput() call fills one column
form.simple(2)
  .dfInput({ label: 'First name', placeholder: 'Enter your first name' })
  .dfInput({ label: 'Last name', placeholder: 'Enter your last name' });

// Switch to a single full-width column
form.simple()
  .generic('VTextarea', { label: 'Comments', placeholder: 'Enter any additional comments', rows: 3 });
```

### Using `row()` / `col()` (more control)

For fine-grained control over column widths and row properties, use the explicit `row()` / `col()` API:

```typescript
const form = new FormBuilder();

// A row with two columns of different widths
form.row({ }, (row) => {
  row.col({ cols: 8 }, (col) => col
    .component((cmpt) => cmpt
      .dfInput({ label: 'Street', placeholder: 'Enter street name' })));
  row.col({ cols: 4 }, (col) => col
    .component((cmpt) => cmpt
      .dfInput({ label: 'House number' })));
  return row;
});

// A second row with a full-width text area
form.row({ }, (row) => {
  row.col({ cols: 12 }, (col) => col
    .component((cmpt) => cmpt
      .generic('VTextarea', { label: 'Comments', rows: 3 })));
  return row;
});
```

## Nested Forms

FormBuilder supports nesting forms for complex layouts:

```typescript
const addressForm = new FormBuilder();
addressForm
  .row({ }, (row) => row
    .col({ cols: 8 }, (col) => col.component((cmpt) => cmpt.generic('VTextField', { label: 'Street' })))
    .col({ cols: 4 }, (col) => col.component((cmpt) => cmpt.generic('VTextField', { label: 'Number' }))));

// Include the address form within the main form
mainForm.row({ }, (row) => row
  .col({ cols: 12 }, (col) => col
    .component((cmpt) => cmpt
      .nestedForm(addressForm))));
```

## Examples

### Registration Form

```typescript
const form = new FormBuilder();

form
  .simple() // single-column layout if no parameter is given
  .generic('h3', { [FormBuilderBodyProp]: 'Personal Information', class: 'mt-0' })
  .simple(2)
  .generic('VTextField', { label: 'First Name', modelValue: '' })
  .generic('VTextField', { label: 'Last Name', modelValue: '' })
  .simple()
  .generic('h3', { [FormBuilderBodyProp]: 'Contact Information', class: 'mt-0' })
  .simple(2)
  .generic('VTextField', { label: 'Email', type: 'email', modelValue: '' })
  .generic('VSelect', {
    label: 'Preferred Contact Method',
    items: [
      { title: 'Email', value: 'email' },
      { title: 'Phone', value: 'phone' },
      { title: 'Mail', value: 'mail' }
    ],
    modelValue: '',
  })
  .simple()
  .generic('h3', { [FormBuilderBodyProp]: 'Additional Information', class: 'mt-0' })
  .generic('VTextarea', { label: 'Comments', rows: 3, modelValue: '' });

/************************************************************************
 *
 * OR
 * 
 * Code left to demonstrate the "long and clunky, but more powerful and 
 * fine-controlled" way of declaring the layout vs the simple() way above
 * 
 * Both code fragments result in the same layout being built.
 ************************************************************************/

form
  .row({ }, (row) => {
    row.col({ cols: 12 }, (col) => col
      .component((cmpt) => cmpt
        .generic('h3', { [FormBuilderBodyProp]: 'Personal Information', class: 'mt-0' })));
    return row;
  })
  .row({ }, (row) => {
    row.col({ cols: 6 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'First Name', modelValue: '' })));
    row.col({ cols: 6 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'Last Name', modelValue: '' })));
    return row;
  })
  // Contact Information Section
  .row({ }, (row) => {
    row.col({ cols: 12 }, (col) => col
      .component((cmpt) => cmpt
        .generic('h3', { [FormBuilderBodyProp]: 'Contact Information', class: 'mt-0' })));
    return row;
  })
  .row({ }, (row) => {
    row.col({ cols: 6 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'Email', type: 'email', modelValue: '' })));
    row.col({ cols: 6 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VSelect', {
          label: 'Preferred Contact Method',
          items: [
            { title: 'Email', value: 'email' },
            { title: 'Phone', value: 'phone' },
            { title: 'Mail', value: 'mail' }
          ],
          modelValue: '',
        })));
    return row;
  })
  // Additional Information Section
  .row({ }, (row) => {
    row.col({ cols: 12 }, (col) => col
      .component((cmpt) => cmpt
        .generic('h3', { [FormBuilderBodyProp]: 'Additional Information', class: 'mt-0' })));
    return row;
  })
  .row({ }, (row) => {
    row.col({ cols: 12 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextarea', { label: 'Comments', rows: 3, modelValue: '' })));
    return row;
  });
```

<script setup>
import FormBasic from '../components/form-basic.vue';
</script>
