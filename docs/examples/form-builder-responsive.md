# FormBuilder Component

A `FormBuilder` layout can differ per Vuetify breakpoint, on the form, a row or a column.

## Responsive Layout

The demo's base layout is the `xs` one; `sm`, `md` and `lg` state their own, and `xl` uses the `lg` one:

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

// Base layout: from xs up to the first breakpoint that states an override
formBuilder
  .row({ }, (row) => row
    .col({ cols: 12 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'Name', density: 'compact' }))))
  .row({ }, (row) => row
    .col({ cols: 12 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'Email', density: 'compact' }))));

// Row-level breakpoint: this row only
formBuilder.row({ }, (row) => row
  // 2 columns
  .col({ cols: 6 }, (col) => col
    .component((cmpt) => cmpt
      .generic('VTextField', { label: 'City' })))
  .col({ cols: 6 }, (col) => col
    .component((cmpt) => cmpt
      .generic('VTextField', { label: 'State/Zip' })))
  // 3 columns from md upwards
  .breakpoint('md', (row) => row
    .col({ cols: 4 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'City' })))
    .col({ cols: 4 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'State' })))
    .col({ cols: 4 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'Zip' })))));

// Column-level breakpoint: this column only
formBuilder.row({ }, (row) => row
  .col({ cols: 12 }, (col) => col
    // 12 columns wide; 3 from md upwards
    .breakpoint('md', (col) => { col.props.cols = 3; return col; })
    .component((cmpt) => cmpt
      .generic('VTextField', { label: 'First field' })))
  .col({ cols: 12 }, (col) => col
    // 12 columns wide; 9 from md upwards
    .breakpoint('md', (col) => { col.props.cols = 9; return col; })
    .component((cmpt) => cmpt
      .generic('VTextarea', { label: 'Comments' }))));

// Form-level breakpoint: from xl upwards the form is this one, and replaces all rows above, with their own
// breakpoints
formBuilder.breakpoint('xl', (form) => form
  .row({ }, (row) => row
    .col({ cols: 6 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'Name' })))
    .col({ cols: 6 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'Email' })))));
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
