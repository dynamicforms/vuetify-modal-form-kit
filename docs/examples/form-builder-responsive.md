# FormBuilder Component

A `FormBuilder` layout can differ per Vuetify breakpoint, on the form, a row or a column.

## Responsive Layout

The demo states a layout for `xs`, `sm` and `md`; `lg` and `xl` use the `md` one:

<form-responsive/>

## Features

- Breakpoint overrides on the form, a row or a column
- A nested layout resolves its own breakpoints
- Teleport-anchored cells keep their id across breakpoints - see
  [Template-declared content (Teleport)](/examples/form-builder#template-declared-content-teleport)

## Responsive Designs

Overrides on each level:

```typescript
const formBuilder = new FormBuilder();

// Base layout: used at every breakpoint that neither states nor inherits an override
formBuilder
  .row({ }, (row) => row
    .col({ cols: 6 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'Name' })))
    .col({ cols: 6 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'Email' }))));

// Form-level breakpoint: the whole form from sm upwards
formBuilder.breakpoint('sm', (form) => form
  .row({ }, (row) => row
    .col({ cols: 12 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'Name', density: 'compact' }))))
  .row({ }, (row) => row
    .col({ cols: 12 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'Email', density: 'compact' })))));

// Row-level breakpoint: this row only
formBuilder.row({ }, (row) => row
  // Base layout of this row: 3 equal columns
  .col({ cols: 4 }, (col) => col
    .component((cmpt) => cmpt
      .generic('VTextField', { label: 'City' })))
  .col({ cols: 4 }, (col) => col
    .component((cmpt) => cmpt
      .generic('VTextField', { label: 'State' })))
  .col({ cols: 4 }, (col) => col
    .component((cmpt) => cmpt
      .generic('VTextField', { label: 'Zip' })))
  // 2 columns from md upwards
  .breakpoint('md', (row) => row
    .col({ cols: 6 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'City' })))
    .col({ cols: 6 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'State/Zip' })))));

// Column-level breakpoint: this column only
formBuilder.row({ }, (row) => row
  .col({ cols: 3 }, (col) => col
    .component((cmpt) => cmpt
      .generic('VTextField', { label: 'First field' })))
  .col({ cols: 9 }, (col) => col
    // 9 columns wide; 12 from sm and 6 from md upwards
    .breakpoint('md', (col) => { col.props.cols = 6; return col; })
    .breakpoint('sm', (col) => { col.props.cols = 12; return col; })
    .component((cmpt) => cmpt
      .generic('VTextarea', { label: 'Comments' }))));
```

## What a breakpoint inherits

Breakpoints are mobile-first: the base layout applies from the smallest size up, and each breakpoint inherits what
it does not state from the nearest smaller breakpoint that states it. A form, a row and a column each inherit
separately.

A breakpoint states only what changes:

- **Props are merged by key.** `.breakpoint('sm', (col) => { col.props.cols = 12; return col; })` keeps the
  column's `offset` and classes.
- **Content is inherited.** A column keeps its components and a row its columns, unless the breakpoint adds
  content; then the added content replaces all of it, as in the row-level example above.

An empty list states that a breakpoint has no content, which differs from stating nothing:

```typescript
formBuilder.row({ }, (row) => row
  .col({ cols: 6 }, (col) => col.component((cmpt) => cmpt.generic('VTextField', { label: 'City' })))
  .col({ cols: 6 }, (col) => col.component((cmpt) => cmpt.generic('VTextField', { label: 'Zip' })))
  // nothing in this row from md upwards
  .breakpoint('md', (bpRow) => { bpRow.columns = []; return bpRow; }));
```

`toJSON()` keeps the difference: a breakpoint without content serializes without the `rows` / `columns` /
`components` key, an empty list serializes as an empty list, and `FormBuilder.fromJSON()` reads it back into a
layout that renders the same at every breakpoint.

The rules are those of `ResponsiveRenderOptions` in [`@dynamicforms/vuetify-inputs`](:vuetify-inputs:);
[its documentation](:vuetify-inputs:/examples/responsive-render-options.html) describes them in full, including
values that cannot be merged.

<script setup>
import FormResponsive from '../components/form-responsive.vue';
</script>
