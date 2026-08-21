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
| `toJSON(breakpoint?)` | Serializes the layout to the JSON structure [`<form-render>`](./form-render) consumes. Without an argument it keeps the breakpoints; with one it resolves them and returns the layout as it renders at that breakpoint. A component carrying no props is serialized with `props: null`. |
| `FormBuilder.fromJSON(json)` | Static. Reads the JSON `toJSON()` produces back into a `FormBuilder`; a `FormBuilder` passed in is handed back unchanged. `<FormRender>` calls it on whatever reaches `:layout`. |

A breakpoint - on the form, a row or a column - states only what changes and inherits the rest:
[what a breakpoint inherits](/examples/form-builder-responsive#what-a-breakpoint-inherits).

Every `simple()` - the form's, a row's, a column's - returns a proxy on which any key is a component-adding call,
with two exceptions. On the form's proxy `simple` is answered first and restarts the layout at a new column count,
as the table above says. And the keys a runtime reads off a value it knows nothing about answer `undefined`: every
symbol, plus `then`, `toString`, `valueOf` and `toJSON`, so returning a layout out of an `async` function,
stringifying the proxy or inspecting it in a console adds no component, row or column. No component builder method
carries one of those names.

## `Row`

Returned by `row()`'s callback.

| Method | Description |
|---|---|
| `col(colProps, colCallback)` | Appends a new `Column`, built by `colCallback`. `colProps` is a [`Column` props object](#column). |
| `simple(cols = 1)` | Same idea as `FormBuilder.simple()`, scoped to this row's columns. It does not chain: `simple` on the returned proxy is a component-adding call like any other name, where the form's restarts the layout. |
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
| `simple()` | Shortcut for `component()` - lets you chain builder methods (e.g. `.dfInput(...)`) directly on the column. It takes no column count, because a column holds components rather than columns, and like a row's it does not restart. |
| `breakpoint(name, colCallback)` | Per-breakpoint override for this column. The callback receives a bare column whose Vuetify props live under `.props`, and has to return it: `.breakpoint('sm', (col) => { col.props.cols = 12; return col; })`. |
| `Column.fromJSON(json)` | Static. Reads a serialized column - `toJSON()`'s `columns[]` entries - back into a `Column`; a `Column` passed in is handed back unchanged. |

Column props (all optional): `cols` (a number, `'auto'` or `false`; omitting it leaves the width to `<v-col>`,
which is auto), `offset` and `order` (numbers), `alignSelf`, `class`, `style`. `offset-md`, `order-lg` and the
other breakpoint-suffixed variants reach Vuetify's `offsetMd` / `orderLg` props. Per-breakpoint column *width*
goes through `breakpoint(name, colCallback)` rather than a `cols-md` key.

## Component builder

The object passed to `component()`'s callback (`VuetifyInputsComponentBuilder` by default).

| Method | Description |
|---|---|
| `generic(name, props)` | Renders any component registered on `<FormRender :components>` (or a native tag, e.g. `'h3'`) with `props`. Use the special `FormBuilderBodyProp` symbol key in `props` to set the element's body/inner content (see the Registration Form example in [FormBuilder examples](/examples/form-builder)). |
| `nestedForm(form)` | Embeds another `FormBuilder` layout as a nested form. Serialized by `toJSON()` and rendered by `<FormRender>` as a form of its own - it resolves the nested layout's breakpoints itself and inherits the outer `:components` map. Nesting has no depth limit. |
| `dfInput` / `dfTextArea` / `dfSelect` / `dfCheckbox` / `dfDateTime` / `dfFile` / `dfColor` / `dfRtfEditor` / `dfActions` | Shorthands for `generic('df-*', props)`, typed to the matching component's props from [`@dynamicforms/vuetify-inputs`](:vuetify-inputs:). |

`FormBuilder` and `FormBuilderBodyProp` are top-level exports of `@dynamicforms/vuetify-modal-form-kit`. The rest
of the layout tree - `Row`, `Column`, `Component`, `ComponentBuilderBase`, `ComponentBuilderInterface`,
`VuetifyInputsComponentBuilder`, `FormBuilderName`, `SimpleProxy`, `TwelveDivisible` and the props and JSON types of
rows, columns and components - is reached through the `FormLayout` namespace alone, which is what a custom component
builder or renderer extends:

```typescript
import { FormLayout } from '@dynamicforms/vuetify-modal-form-kit';

class MyBuilder extends FormLayout.VuetifyInputsComponentBuilder {}
```

## Rendering a layout

[`<form-render>`](./form-render) draws a layout, and [`<component-render>`](./component-render) draws one component
of it. Both take the layout either as the builder or as the JSON `toJSON()` produces, and both are exported, along
with their props types, for a renderer of your own.
