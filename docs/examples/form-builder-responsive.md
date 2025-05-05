# FormBuilder Component

The FormBuilder component provides a programmatic API for creating responsive form layouts that integrate seamlessly 
with Vuetify. It allows you to define form layouts in code instead of templates, making it ideal for both backend-driven
layouts and programmatically generated forms.

## Responsive Layout

The FormBuilder component supports responsive layouts with different configurations for various screen sizes:

<form-responsive/>

## Features

- Programmatic API for defining form layouts
- Full support for responsive designs with breakpoint-specific layouts
  - responsive designs supported at any level (form, row or column)
- Integration with `@dynamicforms/vue-forms` for state management and validation
- Default editors supported from `@dynamicforms/vuetify-inputs`
- Nesting capabilities for complex form structures
- Integration with all Vuetify input components

## Responsive Designs

Define different layouts for different screen sizes:

```typescript
const formBuilder = new FormBuilder();

// Default layout (applies to all breakpoints unless overridden)
formBuilder
  .row({ }, (row) => row
    .column({ cols: 6, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'Name' })))
    .column({ cols: 6, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'Email' }))));

// Form-level breakpoint (entire form changes for small screens)
formBuilder.breakpoint('sm', (form) => form
  .row({ }, (row) => row
    .column({ cols: 12, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'Name', dense: true }))))
  .row({ }, (row) => row
    .column({ cols: 12, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'Email', dense: true }))));

// Row-level breakpoint (just this row changes behavior)
formBuilder.row({ }, (row) => row
  // Default layout for this row - 3 equal columns
  .column({ cols: 4, offset: 0 }, (col) => col
    .component((cmpt) => cmpt
      .generic('VTextField', { label: 'City' })))
  .column({ cols: 4, offset: 0 }, (col) => col
    .component((cmpt) => cmpt
      .generic('VTextField', { label: 'State' })))
  .column({ cols: 4, offset: 0 }, (col) => col
    .component((cmpt) => cmpt
      .generic('VTextField', { label: 'Zip' })))
  // Row-level breakpoint - changes to 2 columns for medium screens
  .breakpoint('md', (row) => row
    .column({ cols: 6, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'City' })))
    .column({ cols: 6, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'State/Zip' }))));

// Column-level breakpoint (just this column changes behavior)
formBuilder.row({ }, (row) => row
  .column({ cols: 3, offset: 0 }, (col) => col
    .component((cmpt) => cmpt
      .generic('VTextField', { label: 'First field' })))
  .column(9, 0, (col) => col
    // Default is 9 columns wide, but changes at different breakpoints
    .breakpoint('md', (col) => { col.cols = 6; return col; })
    .breakpoint('sm', (col) => { col.cols = 12; col.offset = 0; return col; })
    .component((cmpt) => cmpt
      .generic('VTextarea', { label: 'Comments' }))));
```

<script setup>
import FormResponsive from '../components/form-responsive.vue';
</script>
