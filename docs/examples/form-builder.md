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
- Template-declared content for individual cells via Vue's `<Teleport>`, for fields whose markup and `v-model`
  are more natural to write directly in the consumer's own template - see
  [Template-declared content (Teleport)](#template-declared-content-teleport)

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

A nested layout is part of what `toJSON()` serializes, and `<FormRender>` renders it as a form of its own inside the
column that holds it: it resolves the nested layout's breakpoints itself and inherits the outer `:components` map.

## Template-declared content (Teleport)

A cell's content reaches the layout in one of two ways. Code-declared content — `.generic()`, `.dfInput()`,
and the rest of the component builder API — is resolved at render time against the `components` map passed
to `<FormRender :components>`. Teleport-anchored content instead has FormBuilder reserve only the cell: the
actual component, along with its `v-model` and event handlers, is written directly in the consumer's own
template and delivered into the cell through Vue's built-in `<Teleport>`.

`teleportAnchor(idRef)` renders a `<div :id>` anchor in the cell using the same `.generic()` mechanism as any
other component, so no new rendering machinery is involved. The `useTeleportAnchor()` composable creates a
matching `id`/`target` pair for the `<Teleport :to>` on the template side:

```typescript
const email = ref('');
const emailAnchor = useTeleportAnchor();

formBuilder.row({ }, (row) => row
  .col({ cols: 6 }, (col) => col
    .component((cmpt) => cmpt.teleportAnchor(emailAnchor.id))));
```
```html
<Teleport :to="emailAnchor.target.value" defer>
  <v-text-field v-model="email" label="Email" type="email" />
</Teleport>
```

The `.value` is required: `emailAnchor` is a plain object, not a ref itself, so Vue's template auto-unwrapping -
which only reaches a ref that is a top-level property of the render context - does not reach into its `target`
property. Writing `:to="emailAnchor.target"` binds the `ComputedRef` object itself rather than the string it
holds, which leaves `<Teleport>` unable to resolve a target.

Reach for code-declared content when the layout is backend-driven or otherwise serialized: a teleport anchor's
id is only meaningful in the app instance that generated it, so it round-trips through `toJSON()`/`fromJSON()`
like any other component but isn't meant to be rendered by a different app instance than the one that built it
— the same constraint the `components` map itself already has. Reach for teleport-anchored content when the
layout is always built and rendered by the same component and you want normal template ergonomics for the
field itself.

`defer`, a Vue 3.5+ `<Teleport>` prop, is what makes this work regardless of which of the anchor and the
`<Teleport>` mounts first within the same render.

### The same field across breakpoints

Only one breakpoint's layout ever renders at a time, so the same `idRef` can be passed to more than one
`teleportAnchor()` call: `teleportAnchor` writes a fresh id into an empty ref and reuses whatever is already
there otherwise. Redeclaring a field across breakpoints and passing it the same ref each time keeps its id, and
so the `<Teleport :to>` that targets it, the same across the switch:

```typescript
formBuilder.row({ }, (row) => row
  .col({ cols: 6 }, (col) => col.component((cmpt) => cmpt.teleportAnchor(emailAnchor.id))));

formBuilder.breakpoint('sm', (form) => form.row({ }, (row) => row
  .col({ cols: 12 }, (col) => col.component((cmpt) => cmpt.teleportAnchor(emailAnchor.id)))));
```

That keeps the *id* stable, but not necessarily the DOM element carrying it: switching breakpoints often moves a
field to a different row or column, and Vue then discards the old `<div :id>` and creates a new one at the new
position rather than patching the old one in place. A `<Teleport :to>` only re-resolves its target when the `to`
string itself changes, so a `to` that stayed the same string keeps pointing at the element that just got removed
and the teleported content renders empty - even though the id it names is, again, present elsewhere in the DOM.

Key the `<Teleport>` on `<FormRender>`'s [`breakpoint` emit](/api/form-render#emits) to force it to remount and
re-resolve its target whenever this happens:

```typescript
const breakpoint = ref();
```

```html
<form-render :layout="formBuilder" :components="components" @breakpoint="breakpoint = $event" />
<Teleport :key="breakpoint" :to="emailAnchor.target.value" defer>
  <v-text-field v-model="email" label="Email" type="email" />
</Teleport>
```

`breakpoint` is declared once, alongside the rest of the template's reactive state.

Passing the same ref to two *different* fields, rather than the same field at two breakpoints, leaves both
anchors carrying the same id in a layout that can render them both at once. `<FormRender>` warns when that
happens, since a `<Teleport :to="'#' + id">` only ever reaches the first element bearing that id — the other
field would render as a permanently empty anchor.

The Contact Information section of the example above demonstrates this.

## See also

- [FormBuilder API Reference](/api/form-builder) - the complete `FormBuilder` / `Row` / `Column` / component
  builder method and prop tables.

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
