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
- Integration with `@dynamicforms/vue-forms` for state management and validation
- Default editors supported from `@dynamicforms/vuetify-inputs`
- Nesting capabilities for complex form structures
- Integration with all Vuetify input components

## API Usage

The FormBuilder provides a fluent API for defining form layouts:

```typescript
const form = new FormBuilder();

// Add a row with two equal columns
form
  .row({ }, (row) => row
    .column({ cols: 6, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'First name', placeholder: 'Enter your first name' })))
    .column({ cols: 6, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'Last name', placeholder: 'Enter your last name' }))));
  // Add a second row with a full-width text area
  .row({ }, (row) => row
    .column({ cols: 12, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextarea', { label: 'Comments', placeholder: 'Enter any additional comments', rows: 3 }))));
```

## Nested Forms

FormBuilder supports nesting forms for complex layouts:

```typescript
const addressForm = new FormBuilder();
addressForm
  .row({ }, (row) => row
    .column({ cols: 8, offset: 0 }, (col) => col.component((cmpt) => cmpt.generic('VTextField', { label: 'Street' })))
    .column({ cols: 4, offset: 0 }, (col) => col.component((cmpt) => cmpt.generic('VTextField', { label: 'Number' }))));

// Include the address form within the main form
mainForm.row({ }, (row) => row
  .column({ cols: 12, offset: 0 }, (col) => col
    .component((cmpt) => cmpt
      .nestedForm(addressForm))));
```

## Examples

### Registration Form

```typescript
const form = new FormBuilder();

formBuilder
  .row({ }, (row) => row
    .column({ cols: 12, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('h3', { [FormBuilderBodyProp]: 'Personal Information', class: 'mt-0' }))))
  .row({ }, (row) => row
    .column({ cols: 6, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'First Name', modelValue: '' })))
    .column({ cols: 6, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'Last Name', modelValue: '' }))))
  // Contact Information Section
  .row({ }, (row) => row
    .column({ cols: 12, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('h3', { [FormBuilderBodyProp]: 'Contact Information', class: 'mt-0' }))))
  .row({ }, (row) => row
    .column({ cols: 6, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'Email', type: 'email', modelValue: '' })))
    .column({ cols: 6, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VSelect', {
          label: 'Preferred Contact Method',
          items: [
            { title: 'Email', value: 'email' },
            { title: 'Phone', value: 'phone' },
            { title: 'Mail', value: 'mail' }
          ],
          modelValue: '',
        }))))
  // Additional Information Section
  .row({ }, (row) => row
    .column({ cols: 12, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('h3', { [FormBuilderBodyProp]: 'Additional Information', class: 'mt-0' }))))
  .row({ }, (row) => row
    .column({ cols: 12, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextarea', { label: 'Comments', rows: 3, modelValue: '' }))));
```

<script setup>
import FormBasic from '../components/form-basic.vue';
</script>
