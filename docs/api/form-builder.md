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
| `simple(cols = 1)` | Returns a proxy of a component builder (see [below](#component-builder)); every call made on it (e.g. `.dfInput(...)`) is placed into a new `12 / cols`-wide column, wrapping to a new row once `cols` components have been added to the current one. Calling `.simple(newCols)` again mid-chain starts a fresh row layout from that point on. `cols` must divide 12: `1 \| 2 \| 3 \| 4 \| 6 \| 12`. |
| `breakpoint(name, formCallback)` | Overrides one responsive breakpoint (`'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'`); `formCallback` receives a form-like object with the same `row()` / `simple()` methods and has to return it. |
| `toJSON(breakpoint?)` | Serializes the layout to the JSON structure `<FormRender>` consumes. Without an argument it keeps the breakpoints; with one it resolves them and returns the layout as it renders at that breakpoint. |
| `FormBuilder.fromJSON(json)` | Static. Reads the JSON `toJSON()` produces back into a `FormBuilder`; a `FormBuilder` passed in is handed back unchanged. `<FormRender>` calls it on whatever reaches `:layout`. |

A breakpoint - on the form, a row or a column - states only what changes and inherits the rest:
[what a breakpoint inherits](/examples/form-builder-responsive#what-a-breakpoint-inherits).

## `Row`

Returned by `row()`'s callback.

| Method | Description |
|---|---|
| `col(colProps, colCallback)` | Appends a new `Column`, built by `colCallback`. `colProps` is a [`Column` props object](#column). |
| `simple(cols = 1)` | Same idea as `FormBuilder.simple()`, scoped to this row's columns. |
| `breakpoint(name, rowCallback)` | Per-breakpoint override for this row; the callback receives a bare row and has to return it. |
| `Row.fromJSON(json)` | Static. Reads a serialized row - `toJSON()`'s `rows[]` entries - back into a `Row`; a `Row` passed in is handed back unchanged. |

Row props (all optional): `align`, `align-content`, `justify` (Vuetify's `v-row` alignment values, e.g. `'center'`,
`'space-between'`), `dense`, `class`, `style`, plus breakpoint-suffixed variants (`align-md`, `justify-lg`, ...).

## `Column`

Returned by `col()`'s callback.

| Method | Description |
|---|---|
| `component(builderCallback)` | Adds one component to this column, built via the default [component builder](#component-builder). |
| `component(BuilderClass, builderCallback)` | Same, but with a custom component-builder class instead of the default one. |
| `simple()` | Shortcut for `component()` - lets you chain builder methods (e.g. `.dfInput(...)`) directly on the column. |
| `breakpoint(name, colCallback)` | Per-breakpoint override for this column. The callback receives a bare column whose Vuetify props live under `.props`, and has to return it: `.breakpoint('sm', (col) => { col.props.cols = 12; return col; })`. |
| `Column.fromJSON(json)` | Static. Reads a serialized column - `toJSON()`'s `columns[]` entries - back into a `Column`; a `Column` passed in is handed back unchanged. |

Column props (all optional): `cols` (a number, `'auto'` or `false`; omitting it leaves the width to `<v-col>`,
which is auto), `offset` and `order` (numbers), `alignSelf`, `class`, `style`. `offset-md`, `order-lg` and the other breakpoint-suffixed
variants reach Vuetify's `offsetMd` / `orderLg` props. Per-breakpoint column *width* goes through
`breakpoint(name, colCallback)` rather than a `cols-md` key.

## Component builder

The object passed to `component()`'s callback (`VuetifyInputsComponentBuilder` by default).

| Method | Description |
|---|---|
| `generic(name, props)` | Renders any component registered on `<FormRender :components>` (or a native tag, e.g. `'h3'`) with `props`. Use the special `FormBuilderBodyProp` symbol key in `props` to set the element's body/inner content (see the Registration Form example in [FormBuilder examples](/examples/form-builder)). |
| `nestedForm(form)` | Embeds another `FormBuilder` layout as a nested form. Serialized by `toJSON()` and rendered by `<FormRender>` as a form of its own - it resolves the nested layout's breakpoints itself and inherits the outer `:components` map. Nesting has no depth limit. |
| `dfInput` / `dfTextArea` / `dfSelect` / `dfCheckbox` / `dfDateTime` / `dfFile` / `dfColor` / `dfRtfEditor` / `dfActions` | Shorthands for `generic('df-*', props)`, typed to the matching component's props from [`@dynamicforms/vuetify-inputs`](:vuetify-inputs:). |

`FormBuilderBodyProp` is exported from `@dynamicforms/vuetify-modal-form-kit` for building custom component
builders/renderers; the rest of the `form-layout` internals (`Row`, `Column`, `FormBuilderName`, ...) are available
under the `FormLayout` namespace export if you need to build your own component builder class.

## `<FormRender>`

`import { FormRender } from '@dynamicforms/vuetify-modal-form-kit'`

Renders a `FormBuilder` layout.

| Prop | Type | Description |
|---|---|---|
| `layout` | `FormBuilder \| FormJSONResponsive` | The layout to render, either as the builder or as the plain JSON `toJSON()` produces. JSON is hydrated back into rows, columns and components, so the two render the same thing. A `symbol` component name - `FormBuilderName` among them - survives an in-memory copy of the JSON but not a `JSON.stringify()` / `JSON.parse()` round trip. |
| `components` | `Record<string \| symbol, Component>` | Maps component names used in `generic()` calls (e.g. `'df-input'`) to actual Vue components. Symbol keys are supported; the renderer adds one of its own to resolve nested layouts. |
