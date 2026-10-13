# FormBuilder

A layout is a tree of builders: `FormBuilder` → `Row` → `Column` → component builder. Each method returns `this`
or a proxy that forwards to it, so calls chain. `.simple()` creates the rows, columns and components;
`.row()` / `.col()` / `.component()` set widths, row and column classes and breakpoints explicitly.

[FormBuilder examples](/examples/form-builder) shows both styles.

## `FormBuilder`

`import { FormBuilder } from '@dynamicforms/vuetify-modal-form-kit'`

| Method | Description |
|---|---|
| `row(rowProps, rowCallback)` | Appends a new `Row`, built by `rowCallback`. `rowProps` is a [`Row` props object](#row). |
| `simple(cols = 1)` | Returns a proxy of a [component builder](#component-builder). Each call on it (e.g. `.dfInput(...)`) adds a component in a new `12 / cols`-wide column; after `cols` components a new row starts. `.simple(newCols)` later in the chain starts a new row layout. `cols` is one of `1 \| 2 \| 3 \| 4 \| 6 \| 12`. |
| `breakpoint(name, formCallback)` | Overrides one breakpoint (`'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'`). `formCallback` receives the breakpoint's form, which has the same `row()` / `simple()` methods and is empty on the first call for that breakpoint. The callback's signature returns it; the returned value is not used. |
| `toJSON(breakpoint?)` | Serializes the layout to the JSON [`<form-render>`](./form-render) takes. Without an argument the breakpoints are kept; with one, the layout is resolved for that breakpoint. A component without props serializes as `props: null`. |
| `FormBuilder.fromJSON(json)` | Static. Reads the JSON `toJSON()` produces into a `FormBuilder`; a `FormBuilder` is returned unchanged. `<FormRender>` calls it on the value of `:layout`. |

A breakpoint on the form, a row or a column states only what changes and inherits the rest - see
[what a breakpoint inherits](/examples/form-builder-responsive#what-a-breakpoint-inherits).

On the proxy any `simple()` returns (the form's, a row's or a column's), every key adds a component, except:

- `simple` on the form's proxy starts a new row layout, as above.
- Symbols and `then`, `toString`, `valueOf`, `toJSON` return `undefined`. Returning a layout from an `async`
  function, converting the proxy to a string or logging it adds nothing. No component builder method has one of
  these names.

## `Row`

Returned by `row()`'s callback.

| Method | Description |
|---|---|
| `col(colProps, colCallback)` | Appends a new `Column`, built by `colCallback`. `colProps` is a [`Column` props object](#column). |
| `simple(cols = 1)` | As `FormBuilder.simple()`, within this row. `simple` on the returned proxy adds a component; it does not start a new layout. |
| `breakpoint(name, rowCallback)` | Overrides one breakpoint for this row. The callback receives the breakpoint's row, empty on the first call for that breakpoint, and returns it. |
| `Row.fromJSON(json)` | Static. Reads an entry of `toJSON()`'s `rows[]` into a `Row`; a `Row` is returned unchanged. |

Row props (all optional): `align`, `align-content`, `justify` (Vuetify's `v-row` alignment values, e.g. `'center'`,
`'space-between'`), `dense`, `noGutters`, `class`, `style`, plus breakpoint-suffixed variants of the three
alignment props (`align-md`, `justify-lg`, ...).

## `Column`

Returned by `col()`'s callback.

| Method | Description |
|---|---|
| `component(builderCallback)` | Adds one component to this column, built with the default [component builder](#component-builder). |
| `component(BuilderClass, builderCallback)` | As above, with the given component builder class. |
| `simple()` | Returns a component builder proxy, so builder methods (e.g. `.dfInput(...)`) chain on the column. It takes no column count, and `simple` on the proxy adds a component. |
| `breakpoint(name, colCallback)` | Overrides one breakpoint for this column. The callback receives the breakpoint's column, empty on the first call for that breakpoint, with its Vuetify props under `.props`, and returns it: `.breakpoint('sm', (col) => { col.props.cols = 12; return col; })`. |
| `Column.fromJSON(json)` | Static. Reads an entry of `toJSON()`'s `columns[]` into a `Column`; a `Column` is returned unchanged. |

Column props (all optional): `cols` (a number, `'auto'` or `false`; without it `<v-col>` sizes the column
automatically), `offset` (a number), `order` (a number, `'first'` or `'last'`), `alignSelf`, `class`, `style`.
`<v-col>` renders `offset` and `order` as the classes `offset-<value>` / `order-<value>`; a value Vuetify's
stylesheet has no class for is dropped from the serialized props. `offset-md`, `order-lg` and the other
breakpoint-suffixed variants set Vuetify's `offsetMd` / `orderLg` props. A width per breakpoint is set with
`breakpoint(name, colCallback)`; there is no `cols-md` key.

## Component builder

The object passed to `component()`'s callback (`VuetifyInputsComponentBuilder` by default).

| Method | Description |
|---|---|
| `generic(name, props)` | Renders a component of `<FormRender :components>`, a globally registered component or a native tag (e.g. `'h3'`) with `props`. The `FormBuilderBodyProp` symbol key in `props` sets the element's content (see the Registration Form example in [FormBuilder examples](/examples/form-builder)). |
| `nestedForm(form)` | Embeds another `FormBuilder` layout. `toJSON()` serializes it, and `<FormRender>` renders it as a separate form that resolves its own breakpoints and uses the outer `:components` map. Nesting depth is not limited. |
| `teleportAnchor(idRef)` | Adds a `<div>` (`generic('div', { id, style: 'display: contents' })`) that a `<Teleport :to="'#' + idRef.value">` in the application's template targets, so the field, its `v-model` and its handlers are written in the template. When `idRef.value` is empty, it is set to an id from Vue's `useId()`; an id already in the ref is used as is, so a field declared again at another breakpoint keeps its id - see [FormBuilder examples](/examples/form-builder). |
| `dfInput` / `dfTextArea` / `dfSelect` / `dfCheckbox` / `dfDateTime` / `dfFile` / `dfImage` / `dfColor` / `dfRtfEditor` / `dfLabel` / `dfInputHint` / `dfActions` | Shorthands for `generic('df-*', props)`, typed to the props of the matching [`@dynamicforms/vuetify-inputs`](:vuetify-inputs:) component. There is one for each of its components. |
| `byTag(tag, props)` | Builds the component `tag` names: through the `df*` shorthand for that tag (`'df-date-time'` builds what `dfDateTime(props)` builds), or through `generic(tag, props)` when there is none. Used when the tag comes from data; a tag vuetify-inputs adds before this builder has a shorthand for it is still rendered. |

`FormBuilder`, `FormBuilderBodyProp`, `useTeleportAnchor` and `useTeleportAnchors` are top-level exports of
`@dynamicforms/vuetify-modal-form-kit`. `useTeleportAnchor()` returns
`{ id: Ref<string>, target: ComputedRef<string> }`, where `target` is `'#' + id.value`.
`useTeleportAnchors(names)` returns one such anchor per name, keyed by the name. The object is not a ref, and
Vue unwraps only top-level refs of the render context, so a template binds `anchor.target.value` to
`<Teleport :to>`.

The rest of the layout tree - `Row`, `Column`, `Component`, `ComponentBuilderBase`, `ComponentBuilderInterface`,
`VuetifyInputsComponentBuilder`, `FormBuilderName`, `SimpleProxy`, `TwelveDivisible` and the props and JSON types of
rows, columns and components - is exported only through the `FormLayout` namespace, for a custom component builder
or renderer:

```typescript
import { FormLayout } from '@dynamicforms/vuetify-modal-form-kit';

class MyBuilder extends FormLayout.VuetifyInputsComponentBuilder {}
```

## Rendering a layout

[`<form-render>`](./form-render) renders a layout, and [`<component-render>`](./component-render) renders one
component of it. Both are exported with their props types.
