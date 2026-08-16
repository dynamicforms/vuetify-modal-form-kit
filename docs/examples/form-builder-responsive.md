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
- Integration with [`@dynamicforms/vue-forms`](:vue-forms:) for state management and validation
- Default editors supported from [`@dynamicforms/vuetify-inputs`](:vuetify-inputs:)
- Nesting capabilities for complex form structures
- Integration with all Vuetify input components

## Responsive Designs

Define different layouts for different screen sizes:

```typescript
const formBuilder = new FormBuilder();

// Default layout (applies to all breakpoints unless overridden)
formBuilder
  .row({ }, (row) => row
    .col({ cols: 6 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'Name' })))
    .col({ cols: 6 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'Email' }))));

// Form-level breakpoint (entire form changes for small screens)
formBuilder.breakpoint('sm', (form) => form
  .row({ }, (row) => row
    .col({ cols: 12 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'Name', dense: true }))))
  .row({ }, (row) => row
    .col({ cols: 12 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'Email', dense: true })))));

// Row-level breakpoint (just this row changes behavior)
formBuilder.row({ }, (row) => row
  // Default layout for this row - 3 equal columns
  .col({ cols: 4 }, (col) => col
    .component((cmpt) => cmpt
      .generic('VTextField', { label: 'City' })))
  .col({ cols: 4 }, (col) => col
    .component((cmpt) => cmpt
      .generic('VTextField', { label: 'State' })))
  .col({ cols: 4 }, (col) => col
    .component((cmpt) => cmpt
      .generic('VTextField', { label: 'Zip' })))
  // Row-level breakpoint - changes to 2 columns for medium screens
  .breakpoint('md', (row) => row
    .col({ cols: 6 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'City' })))
    .col({ cols: 6 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'State/Zip' })))));

// Column-level breakpoint (just this column changes behavior)
formBuilder.row({ }, (row) => row
  .col({ cols: 3 }, (col) => col
    .component((cmpt) => cmpt
      .generic('VTextField', { label: 'First field' })))
  .col({ cols: 9 }, (col) => col
    // Default is 9 columns wide, but changes at different breakpoints
    .breakpoint('md', (col) => { col.props.cols = 6; return col; })
    .breakpoint('sm', (col) => { col.props.cols = 12; return col; })
    .component((cmpt) => cmpt
      .generic('VTextarea', { label: 'Comments' }))));
```

## What a breakpoint inherits

Breakpoints are mobile-first: what you write without one is the smallest size, and each breakpoint changes what it
states and inherits the rest from the nearest smaller one that stated it. That holds per element - a form, a row and
a column each cascade on their own.

A breakpoint states only what changes:

- **Props are merged key by key.** `.breakpoint('sm', (col) => { col.props.cols = 12; return col; })` leaves the
  `offset` and the classes the column was given in place.
- **Content carries over.** A column keeps its components, and a row keeps its columns, unless the breakpoint adds
  content of its own - in which case what it adds replaces the lot, as the row-level example above does.

To state that there is nothing at a breakpoint, assign an empty list. It is a statement, not an omission:

```typescript
formBuilder.row({ }, (row) => row
  .col({ cols: 6 }, (col) => col.component((cmpt) => cmpt.generic('VTextField', { label: 'City' })))
  .col({ cols: 6 }, (col) => col.component((cmpt) => cmpt.generic('VTextField', { label: 'Zip' })))
  // nothing in this row from md upwards
  .breakpoint('md', (bpRow) => { bpRow.columns = []; return bpRow; }));
```

`toJSON()` keeps the difference: a breakpoint that states nothing about its content serializes without the
`rows` / `columns` / `components` key, an empty list serializes as one, and reading the JSON back with
`FormBuilder.fromJSON()` gives a layout that renders the same at every breakpoint.

The rules come from `ResponsiveRenderOptions` in [`@dynamicforms/vuetify-inputs`](:vuetify-inputs:), which this
layout is built on - [its documentation](:vuetify-inputs:/examples/responsive-render-options.html) covers them in
full, including how the merge treats values it cannot merge.

<script setup>
import FormResponsive from '../components/form-responsive.vue';
</script>
