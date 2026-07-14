# FormBuilder

`FormBuilder` is a tree of small builders - `FormBuilder` → `Row` → `Column` → component builder - each returning
`this` (or a proxy that forwards to it), so calls chain. `.simple()` is a shortcut that builds the
row/column/component chain for you; use `.row()` / `.col()` / `.component()` when you need explicit control (widths,
row/column CSS classes, responsive breakpoints).

See [FormBuilder examples](/examples/form-builder) for the two styles side by side and full worked layouts.

## `FormBuilder`

`import { FormBuilder } from '@dynamicforms/vuetify-modal-form-kit'`

| Method | Description |
|---|---|
| `row(rowProps, rowCallback)` | Appends a new `Row`, built by `rowCallback`. `rowProps` is a [`Row` props object](#row). |
| `simple(cols = 1)` | Returns a proxy of a component builder (see [below](#component-builder)); every call made on it (e.g. `.dfInput(...)`) is placed into a new `12 / cols`-wide column, wrapping to a new row once `cols` components have been added to the current one. Calling `.simple(newCols)` again mid-chain starts a fresh row layout from that point on. |
| `breakpoint(name, formCallback)` | Overrides rows for one responsive breakpoint (`'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'`); `formCallback` receives a form-like object with the same `row()` / `simple()` methods. |
| `toJSON(breakpoint?)` | Serializes the layout to the JSON structure `<FormRender>` consumes. Called automatically when a `FormBuilder` is passed to `:layout`. |

## `Row`

Returned by `row()`'s callback.

| Method | Description |
|---|---|
| `col(colProps, colCallback)` | Appends a new `Column`, built by `colCallback`. `colProps` is a [`Column` props object](#column). |
| `simple(cols = 1)` | Same idea as `FormBuilder.simple()`, scoped to this row's columns. |
| `breakpoint(name, rowCallback)` | Per-breakpoint override for this row. |

Row props (all optional): `align`, `align-content`, `justify` (Vuetify's `v-row` alignment values, e.g. `'center'`,
`'space-between'`), `dense`, `class`, `style`, plus breakpoint-suffixed variants (`align-md`, `justify-lg`, ...).

## `Column`

Returned by `col()`'s callback.

| Method | Description |
|---|---|
| `component(builderCallback)` | Adds one component to this column, built via the default [component builder](#component-builder). |
| `component(BuilderClass, builderCallback)` | Same, but with a custom component-builder class instead of the default one. |
| `simple()` | Shortcut for `component()` - lets you chain builder methods (e.g. `.dfInput(...)`) directly on the column. |
| `breakpoint(name, colCallback)` | Per-breakpoint override for this column. |

Column props (all optional): `cols` (1-12, `'auto'`, or `false`), `offset`, `order`, `alignSelf`, `class`, `style`,
plus breakpoint-suffixed variants (`cols-md`, `offset-lg`, ...) - these map directly to Vuetify's `v-col` props.

## Component builder

The object passed to `component()`'s callback (`VuetifyInputsComponentBuilder` by default).

| Method | Description |
|---|---|
| `generic(name, props)` | Renders any component registered on `<FormRender :components>` (or a native tag, e.g. `'h3'`) with `props`. Use the special `FormBuilderBodyProp` symbol key in `props` to set the element's body/inner content (see the Registration Form example in [FormBuilder examples](/examples/form-builder)). |
| `nestedForm(form)` | Embeds another `FormBuilder` layout as a nested form. |
| `dfInput` / `dfTextArea` / `dfSelect` / `dfCheckbox` / `dfDateTime` / `dfFile` / `dfColor` / `dfRtfEditor` / `dfActions` | Shorthands for `generic('df-*', props)`, typed to the matching component's props from [`@dynamicforms/vuetify-inputs`](:vuetify-inputs:). |

`FormBuilderBodyProp` is exported from `@dynamicforms/vuetify-modal-form-kit` for building custom component
builders/renderers; the rest of the `form-layout` internals (`Row`, `Column`, `FormBuilderName`, ...) are available
under the `FormLayout` namespace export if you need to build your own component builder class.

## `<FormRender>`

`import { FormRender } from '@dynamicforms/vuetify-modal-form-kit'`

Renders a `FormBuilder` layout (or its plain JSON via `.toJSON()`).

| Prop | Type | Description |
|---|---|---|
| `layout` | `FormBuilder \| FormJSONResponsive` | The layout to render. |
| `components` | `Record<string, Component>` | Maps component names used in `generic()` calls (e.g. `'df-input'`) to actual Vue components. |
